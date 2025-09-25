import mongoose from 'mongoose';

const tourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
    maxlength: [100, 'Destination cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [500, 'Price cannot be less than ₱500'],
    max: [100000, 'Price cannot exceed ₱100,000']
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
    maxlength: [50, 'Duration cannot exceed 50 characters']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'Maximum group size is required'],
    min: [1, 'Group size must be at least 1'],
    max: [50, 'Group size cannot exceed 50']
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['easy', 'moderate', 'challenging', 'extreme'],
    default: 'moderate'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['adventure', 'cultural', 'nature', 'beach', 'city', 'historical', 'food', 'photography'],
    default: 'nature'
  },
  images: [{
    type: String,
    required: true
  }],
  itinerary: [{
    day: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    activities: [{
      type: String,
      trim: true
    }],
    meals: [{
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: []
    }],
    accommodation: {
      type: String,
      trim: true
    }
  }],
  inclusions: [{
    type: String,
    trim: true
  }],
  exclusions: [{
    type: String,
    trim: true
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  availableDates: [{
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    slotsAvailable: {
      type: Number,
      required: true,
      default: 1
    }
  }],
  guide: {
    name: {
      type: String,
      trim: true
    },
    experience: {
      type: String,
      trim: true
    },
    languages: [{
      type: String,
      trim: true
    }],
    photo: {
      type: String
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  bookingCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
tourSchema.index({ destination: 1 });
tourSchema.index({ category: 1 });
tourSchema.index({ price: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ isAvailable: 1 });
tourSchema.index({ 'ratings.average': -1 });
tourSchema.index({ featured: -1 });
tourSchema.index({ createdAt: -1 });

// Virtual for bookings
tourSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'tour'
});

// Update booking count
tourSchema.methods.updateBookingCount = async function() {
  const Booking = mongoose.model('Booking');
  this.bookingCount = await Booking.countDocuments({ 
    tour: this._id, 
    status: { $in: ['confirmed', 'completed'] } 
  });
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model('Tour', tourSchema);