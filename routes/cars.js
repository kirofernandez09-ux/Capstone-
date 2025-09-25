import express from 'express';
import Car from '../models/Car.js';
import { auth, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      brand,
      category,
      location,
      minPrice,
      maxPrice,
      transmission,
      fuelType,
      seats,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      available = 'true'
    } = req.query;

    // Build query
    const query = {};
    
    if (available === 'true') query.isAvailable = true;
    if (brand) query.brand = new RegExp(brand, 'i');
    if (category) query.category = category;
    if (location) query.location = new RegExp(location, 'i');
    if (transmission) query.transmission = transmission;
    if (fuelType) query.fuelType = fuelType;
    if (seats) query.seats = { $gte: parseInt(seats) };
    
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerDay.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const cars = await Car.find(query)
      .populate('owner', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Car.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: cars,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

    console.log(`📊 Cars fetched: ${cars.length}/${total} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cars',
      error: error.message
    });
  }
});

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id)
      .populate('owner', 'name email phone')
      .populate({
        path: 'bookings',
        populate: {
          path: 'user',
          select: 'name'
        }
      });

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    res.json({
      success: true,
      data: car
    });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car'
    });
  }
});

// @desc    Create new car
// @route   POST /api/cars
// @access  Private (Admin/Owner)
router.post('/', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const carData = {
      ...req.body,
      owner: req.user._id
    };

    const car = await Car.create(carData);

    res.status(201).json({
      success: true,
      message: 'Car created successfully',
      data: car
    });

    console.log(`✅ New car created: ${car.brand} ${car.model} by ${req.user.name}`);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create car',
      error: error.message
    });
  }
});

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private (Admin/Owner)
router.put('/:id', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    let car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership (only admin can edit any car)
    if (req.user.role !== 'admin' && car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this car'
      });
    }

    car = await Car.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Car updated successfully',
      data: car
    });

    console.log(`✅ Car updated: ${car.brand} ${car.model} by ${req.user.name}`);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car',
      error: error.message
    });
  }
});

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check for active bookings
    const { default: Booking } = await import('../models/Booking.js');
    const activeBookings = await Booking.countDocuments({
      car: req.params.id,
      status: { $in: ['confirmed', 'in_progress'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete car with active bookings'
      });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Car deleted successfully'
    });

    console.log(`🗑️ Car deleted: ${car.brand} ${car.model} by ${req.user.name}`);
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete car'
    });
  }
});

// @desc    Toggle car availability
// @route   PATCH /api/cars/:id/availability
// @access  Private (Admin/Owner)
router.patch('/:id/availability', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Check ownership
    if (req.user.role !== 'admin' && car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this car'
      });
    }

    car.isAvailable = !car.isAvailable;
    await car.save();

    res.json({
      success: true,
      message: `Car ${car.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: car
    });
  } catch (error) {
    console.error('Error toggling car availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update car availability'
    });
  }
});

// @desc    Get car categories
// @route   GET /api/cars/meta/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Car.distinct('category');
    const brands = await Car.distinct('brand');
    const locations = await Car.distinct('location');
    const transmissions = await Car.distinct('transmission');
    const fuelTypes = await Car.distinct('fuelType');

    res.json({
      success: true,
      data: {
        categories,
        brands,
        locations,
        transmissions,
        fuelTypes
      }
    });
  } catch (error) {
    console.error('Error fetching car metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch car metadata'
    });
  }
});

export default router;