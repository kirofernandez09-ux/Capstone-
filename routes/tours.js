import express from 'express';
import Tour from '../models/Tour.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all tours
// @route   GET /api/tours
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      destination,
      category,
      difficulty,
      minPrice,
      maxPrice,
      maxGroupSize,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      available = 'true',
      featured
    } = req.query;

    // Build query
    const query = {};
    
    if (available === 'true') query.isAvailable = true;
    if (featured === 'true') query.featured = true;
    if (destination) query.destination = new RegExp(destination, 'i');
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (maxGroupSize) query.maxGroupSize = { $gte: parseInt(maxGroupSize) };
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tours = await Tour.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Tour.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: tours,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      }
    });

    console.log(`📊 Tours fetched: ${tours.length}/${total} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tours',
      error: error.message
    });
  }
});

// @desc    Get single tour
// @route   GET /api/tours/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate({
        path: 'bookings',
        populate: {
          path: 'user',
          select: 'name'
        }
      });

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      data: tour
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour'
    });
  }
});

// @desc    Create new tour
// @route   POST /api/tours
// @access  Private (Admin/Employee)
router.post('/', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const tour = await Tour.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: tour
    });

    console.log(`✅ New tour created: ${tour.title} by ${req.user.name}`);
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tour',
      error: error.message
    });
  }
});

// @desc    Update tour
// @route   PUT /api/tours/:id
// @access  Private (Admin/Employee)
router.put('/:id', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: tour
    });

    console.log(`✅ Tour updated: ${tour.title} by ${req.user.name}`);
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tour',
      error: error.message
    });
  }
});

// @desc    Delete tour
// @route   DELETE /api/tours/:id
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    // Check for active bookings
    const { default: Booking } = await import('../models/Booking.js');
    const activeBookings = await Booking.countDocuments({
      tour: req.params.id,
      status: { $in: ['confirmed', 'in_progress'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete tour with active bookings'
      });
    }

    await Tour.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });

    console.log(`🗑️ Tour deleted: ${tour.title} by ${req.user.name}`);
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tour'
    });
  }
});

// @desc    Toggle tour availability
// @route   PATCH /api/tours/:id/availability
// @access  Private (Admin/Employee)
router.patch('/:id/availability', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    tour.isAvailable = !tour.isAvailable;
    await tour.save();

    res.json({
      success: true,
      message: `Tour ${tour.isAvailable ? 'enabled' : 'disabled'} successfully`,
      data: tour
    });
  } catch (error) {
    console.error('Error toggling tour availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tour availability'
    });
  }
});

// @desc    Toggle tour featured status
// @route   PATCH /api/tours/:id/featured
// @access  Private (Admin only)
router.patch('/:id/featured', auth, authorize('admin'), async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found'
      });
    }

    tour.featured = !tour.featured;
    await tour.save();

    res.json({
      success: true,
      message: `Tour ${tour.featured ? 'featured' : 'unfeatured'} successfully`,
      data: tour
    });
  } catch (error) {
    console.error('Error toggling tour featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tour featured status'
    });
  }
});

// @desc    Get tour metadata
// @route   GET /api/tours/meta/categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await Tour.distinct('category');
    const destinations = await Tour.distinct('destination');
    const difficulties = await Tour.distinct('difficulty');

    res.json({
      success: true,
      data: {
        categories,
        destinations,
        difficulties
      }
    });
  } catch (error) {
    console.error('Error fetching tour metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour metadata'
    });
  }
});

export default router;