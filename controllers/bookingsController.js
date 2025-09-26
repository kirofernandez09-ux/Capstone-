import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import EmailService from '../utils/emailServices.js';

export const getAllBookings = async (req, res) => {
  try {
    const query = {};
    // --- FIX STARTS HERE ---
    // This logic correctly filters bookings based on the user's role
    if (req.user && req.user.role === 'customer') {
      query.user = req.user._id;
    }
    // --- FIX ENDS HERE ---
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('itemId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createBooking = async (req, res) => {
    try {
        const { itemType, itemId, startDate, endDate, numberOfGuests, ...guestInfo } = req.body;
        let item, totalPrice = 0;

        if (itemType === 'car') {
            item = await Car.findById(itemId);
            if (!item || !item.isAvailable) return res.status(400).json({ success: false, message: 'Car not available' });
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            if (days <= 0) return res.status(400).json({ success: false, message: 'Invalid date range' });
            totalPrice = days * item.pricePerDay;
        } else if (itemType === 'tour') {
            item = await Tour.findById(itemId);
            if (!item || !item.isAvailable) return res.status(400).json({ success: false, message: 'Tour not available' });
            totalPrice = numberOfGuests * item.price;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        const bookingData = {
          ...guestInfo,
          itemType,
          itemId,
          itemModel: itemType.charAt(0).toUpperCase() + itemType.slice(1),
          startDate,
          endDate: itemType === 'car' ? endDate : undefined,
          numberOfGuests,
          totalPrice,
          agreedToTerms: true,
        };

        const booking = new Booking(bookingData);
        await booking.save();
        
        await EmailService.sendBookingConfirmation(booking);

        const io = req.app.get('io');
        io.emit('new-booking', booking);

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    booking.status = status;
    if (adminNotes) booking.adminNotes = adminNotes;
    booking.processedBy = req.user.id;
    booking.processedAt = Date.now();
    await booking.save();

    await EmailService.sendStatusUpdate(booking);

    const io = req.app.get('io');
    io.emit('booking-updated', booking);

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        booking.status = 'cancelled';
        await booking.save();
        
        const io = req.app.get('io');
        io.emit('booking-updated', booking);
        
        res.json({ success: true, data: booking, message: 'Booking has been cancelled.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
    }
};