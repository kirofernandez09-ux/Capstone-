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

// CREATE a new booking
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

        let userId = req.user ? req.user._id : null;

        const bookingData = {
          ...guestInfo,
          user: userId,
          itemType,
          itemId,
          itemModel: itemType.charAt(0).toUpperCase() + itemType.slice(1),
          startDate,
          endDate: itemType === 'car' ? endDate : undefined,
          numberOfGuests,
          totalPrice,
          paymentProof: {
            url: req.body.paymentProofUrl
          }
        };

        const booking = new Booking(bookingData);
        await booking.save();
        
        await EmailService.sendBookingConfirmation(booking);

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

    booking.auditTrail.push({
        user: req.user.id,
        action: `status_changed_to_${status}`,
        notes: adminNotes || `Status updated by ${req.user.role}`
    });

    await booking.save();

    await EmailService.sendStatusUpdate(booking);

    req.app.get('io').emit('booking-updated', booking);

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

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
            url: `/uploads/documents/${req.file.filename}`,
            uploadedAt: Date.now()
        };
        booking.auditTrail.push({ user: req.user?.id || booking.user, action: 'payment_proof_uploaded' });

        await booking.save();
        res.json({ success: true, message: 'Payment proof uploaded successfully.', data: booking });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during upload.' });
    }
};

export const archiveBooking = async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, { archived: true }, { new: true });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: 'Booking archived successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to archive booking.' });
    }
};