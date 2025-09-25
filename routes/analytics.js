import express from 'express';
import User from '../models/User.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin/Employee)
router.get('/dashboard', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Basic counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalCars = await Car.countDocuments();
    const totalTours = await Tour.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Today's stats
    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfToday }
    });
    
    const todayRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfToday },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Monthly stats
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Booking status breakdown
    const bookingStatusStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue by item type
    const revenueByType = await Booking.aggregate([
      {
        $match: {
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: '$itemType',
          totalRevenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 }
        }
      }
    ]);

    // Monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookingCount: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'completed']] },
                '$totalPrice',
                0
              ]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Top performing cars and tours
    const topCars = await Car.find()
      .sort({ bookingCount: -1, 'ratings.average': -1 })
      .limit(5)
      .select('brand model year bookingCount ratings location');

    const topTours = await Tour.find()
      .sort({ bookingCount: -1, 'ratings.average': -1 })
      .limit(5)
      .select('title destination bookingCount ratings price');

    // Recent activity
    const recentBookings = await Booking.find()
      .populate('car', 'brand model')
      .populate('tour', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('bookingReference guestInfo itemType status totalPrice createdAt');

    // Unread messages count
    const unreadMessages = await Message.countDocuments({
      status: { $in: ['new', 'read'] }
    });

    // Pending bookings that need attention
    const pendingBookings = await Booking.countDocuments({
      status: 'pending'
    });

    const analytics = {
      overview: {
        totalUsers,
        totalCars,
        totalTours,
        totalBookings,
        todayBookings,
        todayRevenue: todayRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        unreadMessages,
        pendingBookings
      },
      bookingStats: {
        statusBreakdown: bookingStatusStats,
        revenueByType,
        monthlyTrends
      },
      topPerformers: {
        cars: topCars,
        tours: topTours
      },
      recentActivity: recentBookings
    };

    res.json({
      success: true,
      data: analytics,
      generatedAt: new Date().toISOString()
    });

    console.log(`📊 Analytics data generated for ${req.user.name} at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate analytics',
      error: error.message
    });
  }
});

// @desc    Get revenue analytics
// @route   GET /api/analytics/revenue
// @access  Private (Admin only)
router.get('/revenue', auth, authorize('admin'), async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupBy;
    let matchCondition = {
      status: { $in: ['confirmed', 'completed'] },
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${parseInt(year) + 1}-01-01`)
      }
    };

    if (period === 'daily') {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (period === 'weekly') {
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else {
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const revenueData = await Booking.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 },
          averageBookingValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    res.json({
      success: true,
      data: revenueData,
      period,
      year
    });
  } catch (error) {
    console.error('Error generating revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue analytics'
    });
  }
});

// @desc    Get customer analytics
// @route   GET /api/analytics/customers
// @access  Private (Admin/Employee)
router.get('/customers', auth, authorize('admin', 'employee'), async (req, res) => {
  try {
    // New customers this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newCustomersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startOfMonth }
    });

    // Customer registration trends
    const customerTrends = await User.aggregate([
      {
        $match: { role: 'customer' }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top customers by booking count
    const topCustomers = await Booking.aggregate([
      {
        $match: { user: { $exists: true } }
      },
      {
        $group: {
          _id: '$user',
          bookingCount: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' }
        }
      },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          name: '$userInfo.name',
          email: '$userInfo.email',
          bookingCount: 1,
          totalSpent: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        newCustomersThisMonth,
        customerTrends,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Error generating customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate customer analytics'
    });
  }
});

export default router;