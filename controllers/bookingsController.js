import Booking from '../models/Booking.js';
import Car from '../models/Car.js';
import Tour from '../models/Tour.js';
import User from '../models/User.js';
import EmailService from '../utils/emailServices.js';

// Get all bookings (for admin/employee) or user-specific bookings
export const getAllBookings = async (req, res) => {
  try {
    let query = { archived: false };
    if (req.user.role === 'customer') {
      query.user = req.user._id;
    }
    const bookings = await Booking.find(query)
        .populate('itemId')
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 });
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get bookings for the currently authenticated user
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id, archived: false })
            .populate('itemId')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// CREATE a new booking
export const createBooking = async (req, res) => {
    try {
        const {
            itemType, itemId, startDate, endDate, numberOfGuests,
            governmentIdUrl, paymentProofUrl, paymentMethod, paymentReferenceNumber, amountPaid,
            ...guestInfo
        } = req.body;

        let item, totalPrice = 0;

        if (itemType === 'car') {
            item = await Car.findById(itemId);
            if (!item || !item.isAvailable) return res.status(400).json({ success: false, message: 'Car not available' });
            if (numberOfGuests > item.seats) {
                return res.status(400).json({ success: false, message: `Number of guests (${numberOfGuests}) exceeds the car's seating capacity of ${item.seats}.` });
            }
            const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
            if (days <= 0) return res.status(400).json({ success: false, message: 'Invalid date range' });
            totalPrice = days * item.pricePerDay;
        } else if (itemType === 'tour') {
            item = await Tour.findById(itemId);
            if (!item || !item.isAvailable) return res.status(400).json({ success: false, message: 'Tour not available' });
            if (numberOfGuests > item.maxGroupSize) return res.status(400).json({ success: false, message: `This tour only allows ${item.maxGroupSize} guests.` });
            totalPrice = numberOfGuests * item.price;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        const prefix = itemType === 'car' ? 'CAR' : 'TOUR';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const bookingReference = `${prefix}-${timestamp}-${random}`;

        const bookingData = {
          ...guestInfo,
          bookingReference,
          user: req.user ? req.user.id : null,
          itemType,
          itemId,
          itemModel: itemType.charAt(0).toUpperCase() + itemType.slice(1),
          // For tours, use the tour's own start date
          startDate: itemType === 'tour' ? item.startDate : startDate,
          endDate: itemType === 'tour' ? item.endDate : endDate,
          numberOfGuests,
          totalPrice,
          agreedToTerms: true,
          governmentIdUrl,
          paymentProofUrl,
          paymentMethod,
          paymentReferenceNumber,
          amountPaid,
        };

        const booking = new Booking(bookingData);
        await booking.save();

        // Isolate email sending to prevent it from crashing the request
        try {
            await EmailService.sendBookingConfirmation(booking);
        } catch (emailError) {
            console.error('Email sending failed for booking:', booking.bookingReference, emailError);
        }

        req.app.get('io').emit('new-booking', booking);
        res.status(201).json({ success: true, data: booking });

    } catch (error) {
        console.error('Error creating booking:', error);
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

    req.app.get('io').emit('booking-updated', booking);

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

// UPLOAD payment proof for a booking
export const uploadPaymentProof = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        booking.paymentProof = {
            url: req.file.path,
            public_id: req.file.filename,
            uploadedAt: Date.now()
        };
        
        await booking.save();
        req.app.get('io').emit('payment-proof-uploaded', booking);
        res.json({ success: true, message: 'Payment proof uploaded successfully.', data: booking });

    } catch (error) {
        console.error('Error uploading payment proof:', error);
        res.status(500).json({ success: false, message: 'Server error during upload.' });
    }
};