import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // FIX: Changed from require to import for ES Modules
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Hide password by default
  phone: { type: String },
  role: {
    type: String,
    enum: ['customer', 'employee', 'admin'],
    default: 'customer'
  },
  position: { type: String },
  permissions: {
    canManageCars: { type: Boolean, default: false },
    canManageTours: { type: Boolean, default: false },
    canManageBookings: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canManageEmployees: { type: Boolean, default: false },
    canManageContent: { type: Boolean, default: false },
    canViewMessages: { type: Boolean, default: false },
    canManageMessages: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date
}, { timestamps: true });

// Hash password before saving if it has been modified
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare candidate password with the user's actual password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to generate a password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;