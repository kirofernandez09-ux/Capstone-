import express from 'express';
import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      itemType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'customer') {
      // Customers can only see their own bookings
      query.user = req.user._id;
    } else if (req.user.role === 'employee') {
      // Employees can see bookings assigned to them or unassigned ones
      query.$or = [
        { assignedTo: req.user._id },
        { assignedTo: { $exists: false } }
      ];
    }
    // Admins can see all bookings (no additional query restrictions)

    if (status) query.status = status;
    if (itemType) query.itemType = itemType;
    
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('car', 'brand model year location pricePerDay')
      .populate('tour', 'title destination price duration')
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });

    console.log(`📊 Bookings fetched: ${bookings.length}/${total} for ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('car', 'brand model year location pricePerDay images features')
      .populate('tour', 'title destination price duration images inclusions')
      .populate('assignedTo', 'name email')
      .populate('notes.createdBy', 'name');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check access permissions
    const hasAccess = 
      req.user.role === 'admin' ||
      (req.user.role === 'employee' && (!booking.assignedTo || booking.assignedTo._id.toString() === req.user._id.toString())) ||
      (req.user.role === 'customer' && booking.user && booking.user._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking'
    });
  }
});

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public (allows guest bookings)
router.post('/', async (req, res) => {
  try {
    const {
      itemType,
      itemId,
      guestInfo,
      startDate,
      endDate,
      numberOfGuests,
      paymentMethod,
      specialRequests,
      pickupLocation
    } = req.body;

    // Validate required fields
    if (!itemType || !itemId || !guestInfo || !startDate || !numberOfGuests) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Validate item exists and is available
    let item;
    if (itemType === 'car') {
      item = await Car.findById(itemId);
      if (!endDate) {
        return res.status(400).json({
          success: false,
          message: 'End date is required for car bookings'
        });
      }
    } else if (itemType === 'tour') {
      item = await Tour.findById(itemId);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid item type'
      });
    }

    if (!item || !item.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `${itemType} not found or not available`
      });
    }

    // Calculate total price
    let totalPrice;
    if (itemType === 'car') {
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      totalPrice = item.pricePerDay * days;
    } else {
      totalPrice = item.price * numberOfGuests;
    }

    // Create booking data
    const bookingData = {
      itemType,
      guestInfo,
      startDate,
      numberOfGuests,
      totalPrice,
      paymentMethod: paymentMethod || 'cash',
      specialRequests,
      pickupLocation
    };

    // Add item reference
    if (itemType === 'car') {
      bookingData.car = itemId;
      bookingData.endDate = endDate;
    } else {
      bookingData.tour = itemId;
    }

    // Add user if authenticated
    if (req.user) {
      bookingData.user = req.user._id;
    }

    const booking = await Booking.create(bookingData);

    // Populate the created booking
    await booking.populate([
      { path: 'car', select: 'brand model year location' },
      { path: 'tour', select: 'title destination duration' }
    ]);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('new-booking', {
      bookingId: booking._id,
      bookingReference: booking.bookingReference,
      itemType: booking.itemType,
      guestName: `${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`,
      totalPrice: booking.totalPrice,
      createdAt: booking.createdAt
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });

    console.log(`✅ New booking created: ${booking.bookingReference} for ${booking.guestInfo.firstName} ${booking.guestInfo.lastName} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Admin/Employee)
router.put('/:id/status', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if employee has access
    if (req.user.role === 'employee' && booking.assignedTo && booking.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    await booking.updateStatus(status, note);

    // Assign to current user if not assigned
    if (!booking.assignedTo && req.user.role === 'employee') {
      booking.assignedTo = req.user._id;
      await booking.save();
    }

    await booking.populate([
      { path: 'user', select: 'name email' },
      { path: 'car', select: 'brand model' },
      { path: 'tour', select: 'title destination' },
      { path: 'assignedTo', select: 'name' }
    ]);

    // Emit socket event
    const io = req.app.get('io');
    io.emit('booking-updated', {
      bookingId: booking._id,
      status: booking.status,
      updatedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

    console.log(`✅ Booking ${booking.bookingReference} status updated to ${status} by ${req.user.name}`);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
});

// @desc    Add note to booking
// @route   POST /api/bookings/:id/notes
// @access  Private (Admin/Employee)
router.post('/:id/notes', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const { note } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.notes.push({
      note,
      createdBy: req.user._id
    });

    await booking.save();
    await booking.populate('notes.createdBy', 'name');

    res.json({
      success: true,
      message: 'Note added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note'
    });
  }
});

// @desc    Assign booking to employee
// @route   PUT /api/bookings/:id/assign
// @access  Private (Admin only)
router.put('/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { employeeId } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { assignedTo: employeeId },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking assigned successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error assigning booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign booking'
    });
  }
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permissions
    const canCancel = 
      req.user.role === 'admin' ||
      (booking.user && booking.user.toString() === req.user._id.toString()) ||
      (req.user.role === 'employee' && (!booking.assignedTo || booking.assignedTo.toString() === req.user._id.toString()));

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }

    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled (less than 24 hours before start date)'
      });
    }

    await booking.updateStatus('cancelled', reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

    console.log(`❌ Booking ${booking.bookingReference} cancelled by ${req.user.name}`);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/overview
// @access  Private (Admin/Employee)
router.get('/stats/overview', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const todayBookings = await Booking.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics'
    });
  }
});

export default router;