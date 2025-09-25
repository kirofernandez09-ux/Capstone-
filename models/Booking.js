import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingReference: {
    type: String,
    required: true,
    unique: true
  },
  itemType: {
    type: String,
    enum: ['car', 'tour'],
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemModel'
  },
  itemModel: {
    type: String,
    required: true,
    enum: ['Car', 'Tour']
  },
  // Guest Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  // Booking Details
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(value) {
        return this.itemType === 'car' ? value > this.startDate : true;
      },
      message: 'End date must be after start date'
    }
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: [1, 'Must have at least 1 guest']
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  pickupLocation: {
    type: String,
    trim: true
  },
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'gcash', 'paymaya', 'bank_transfer', 'cash'],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  paymentProof: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // Status and Processing
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
    validate: {
      validator: function(value) {
        return value === true;
      },
      message: 'Must agree to terms and conditions'
    }
  }
}, {
  timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
  if (!this.bookingReference) {
    const prefix = this.itemType === 'car' ? 'CAR' : 'TOUR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingReference = `${prefix}-${timestamp}-${random}`;
  }
  next();
});

// Set itemModel based on itemType
bookingSchema.pre('save', function(next) {
  if (this.itemType === 'car') {
    this.itemModel = 'Car';
  } else if (this.itemType === 'tour') {
    this.itemModel = 'Tour';
  }
  next();
});

// Indexes
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: -1 });

export default mongoose.model('Booking', bookingSchema);