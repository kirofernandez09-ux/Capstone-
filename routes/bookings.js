import express from 'express';
// FIX: Corrected path
import { getAllBookings, getBookingById, createBooking, updateBookingStatus, cancelBooking } from '../controllers/bookingsController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(auth, getAllBookings).post(createBooking);
router.route('/:id').get(auth, getBookingById);
router.route('/:id/status').put(auth, authorize('admin', 'employee'), updateBookingStatus);
router.route('/:id/cancel').put(auth, cancelBooking);

export default router;