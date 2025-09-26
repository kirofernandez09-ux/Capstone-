import User from '../models/User.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import Booking from '../models/Booking.js';
import Message from '../models/Message.js';

export const getDashboardAnalytics = async (req, res) => {
  try {
    const [
      totalCars,
      totalTours,
      totalBookings,
      pendingBookings,
      totalMessages,
      newMessages,
      recentBookings,
      recentMessages
    ] = await Promise.all([
      Car.countDocuments({ archived: false }),
      Tour.countDocuments({ archived: false }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Message.countDocuments(),
      Message.countDocuments({ status: 'new' }),
      Booking.find().sort({ createdAt: -1 }).limit(5),
      Message.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalCars,
          totalTours,
          totalBookings,
          pendingBookings,
          totalMessages,
          newMessages
        },
        recentBookings,
        recentMessages
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};