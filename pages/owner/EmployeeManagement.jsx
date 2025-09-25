import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Key } from 'lucide-react';
import DataService from '../../components/services/DataService.jsx';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialFormState = {
    firstName: '', lastName: '', email: '', password: '', phone: '', position: '',
    permissions: {
        canManageCars: false, canManageTours: false, canManageBookings: false, canViewReports: false
    }
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await DataService.fetchAllEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePermissionChange = (e) => setFormData({ ...formData, permissions: { ...formData.permissions, [e.target.name]: e.target.checked } });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEmployee) {
        // Don't send password if it's not being changed
        const { password, ...updateData } = formData;
        const dataToSend = password ? formData : updateData;
        await DataService.updateEmployee(editingEmployee._id, dataToSend);
      } else {
        await DataService.createEmployee(formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      console.error("Failed to save employee:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({ ...employee, password: '' }); // Clear password field for security
    setShowModal(true);
  };
  
  const handleDelete = async (employeeId) => {
      if (window.confirm('Are you sure you want to delete this employee?')) {
          await DataService.deleteEmployee(employeeId);
          fetchEmployees();
      }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <button onClick={() => { setEditingEmployee(null); setFormData(initialFormState); setShowModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus size={20} className="mr-2"/> Add Employee
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full">
            {/* Table Head */}
            <thead className="bg-gray-100">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
                {loading ? <tr><td colSpan="4" className="text-center py-4">Loading...</td></tr> : employees.map(emp => (
                    <tr key={emp._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{emp.firstName} {emp.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{emp.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{emp.position}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                           <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-900"><Edit3/></button>
                           <button onClick={() => handleDelete(emp._id)} className="text-red-600 hover:text-red-900"><Trash2/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                  <h3 className="text-xl font-bold mb-4">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Form fields */}
                      <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full p-2 border rounded"/>
                      <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full p-2 border rounded"/>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Email" required className="w-full p-2 border rounded"/>
                      <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder={editingEmployee ? "New Password (optional)" : "Password"} required={!editingEmployee} className="w-full p-2 border rounded"/>
                      {/* Permissions */}
                      <div className="border p-4 rounded">
                          <h4 className="font-semibold mb-2">Permissions</h4>
                          {Object.keys(formData.permissions).map(key => (
                              <label key={key} className="flex items-center space-x-2">
                                  <input type="checkbox" name={key} checked={formData.permissions[key]} onChange={handlePermissionChange} />
                                  <span>{key.replace('can', '')}</span>
                              </label>
                          ))}
                      </div>
                      <div className="flex justify-end space-x-4">
                          <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                          <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded">{submitting ? 'Saving...' : 'Save'}</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default EmployeeManagement;