import mongoose from 'mongoose';

const auditTrailSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  notes: { type: String }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  itemType: { type: String, enum: ['car', 'tour'], required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'itemModel' },
  itemModel: { type: String, required: true, enum: ['Car', 'Tour'] },
  firstName: { type: String, required: [true, 'First name is required'], trim: true },
  lastName: { type: String, required: [true, 'Last name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], trim: true, lowercase: true, index: true },
  phone: { type: String, required: [true, 'Phone number is required'], trim: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, validate: { validator: function(v) { return this.itemType === 'car' ? v > this.startDate : true; }, message: 'End date must be after start date' }},
  numberOfGuests: { type: Number, required: true, min: [1, 'Must have at least 1 guest'] },
  specialRequests: { type: String, maxlength: [500, 'Special requests cannot exceed 500 characters'] },
  totalPrice: { type: Number, required: true, min: [0, 'Total price cannot be negative'] },
  paymentMethod: { type: String, enum: ['credit_card', 'gcash', 'paymaya', 'bank_transfer', 'cash'], default: 'bank_transfer' },
  governmentIdUrl: { type: String },
  paymentProofUrl: { type: String },
  paymentReferenceNumber: { type: String },
  amountPaid: { type: Number },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'], default: 'pending', index: true },
  adminNotes: { type: String, maxlength: [1000, 'Admin notes cannot exceed 1000 characters'] },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  agreedToTerms: { type: Boolean, required: true, validate: { validator: (v) => v === true, message: 'Must agree to terms' }},
  auditTrail: [auditTrailSchema],
  archived: { type: Boolean, default: false }
}, { timestamps: true });

/*
// --- FIX: REMOVED the pre-save hook to prevent conflicts ---
bookingSchema.pre('save', function(next) {
  if (this.isNew) {
    const prefix = this.itemType === 'car' ? 'CAR' : 'TOUR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingReference = `${prefix}-${timestamp}-${random}`;
    this.auditTrail.push({ action: 'created', notes: 'Booking created by customer.' });
  }
  next();
});
*/

export default mongoose.model('Booking', bookingSchema);