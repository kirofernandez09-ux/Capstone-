import User from '../models/User.js';
import bcrypt from 'bcryptjs'; // --- ADD this import ---

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: { $in: ['admin', 'employee'] } }).select('-password');
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createEmployee = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, position, permissions, role } = req.body;
        
        // --- ADD explicit password hashing before saving ---
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required.' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        const newRole = (role === 'admin' || role === 'employee') ? role : 'employee';

        const employee = new User({ 
            firstName, 
            lastName, 
            email, 
            password: hashedPassword, // Use the hashed password
            phone, 
            position, 
            permissions, 
            role: newRole 
        });
        
        await employee.save();
        employee.password = undefined;
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        // Handle potential duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const { password, ...updateData } = req.body;
        if (updateData.role && !['admin', 'employee'].includes(updateData.role)) {
            delete updateData.role;
        }
        
        const employee = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const employee = await User.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
        res.json({ success: true, message: 'Employee deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const changeEmployeePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        user.password = password; // Hashing is handled by pre-save hook
        await user.save();
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};