import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import EmailService from '../utils/emailServices.js';

export const getAllBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.user = req.user._id;
    }
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
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