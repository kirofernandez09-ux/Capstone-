import Review from '../models/Reviews.js';
import Booking from '../models/Booking.js';

export const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment, item, itemModel } = req.body;
        const booking = await Booking.findById(bookingId);

        // Validations
        if (!booking) return res.status(404).json({ message: 'Booking not found.' });
        if (booking.user.toString() !== req.user.id) return res.status(403).json({ message: 'You can only review your own bookings.'});
        if (booking.status !== 'completed') return res.status(400).json({ message: 'You can only review completed bookings.' });
        
        const newReview = new Review({
            user: req.user.id,
            booking: bookingId,
            item,
            itemModel,
            rating,
            comment
        });

        await newReview.save();
        res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create review.' });
    }
};
