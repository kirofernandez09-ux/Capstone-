import express from 'express';
import {
    getAllBookings,
    createBooking,
    updateBookingStatus,
    getMyBookings,
    uploadPaymentProof
} from '../controllers/bookingsController.js';
import { auth, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js'; 

const router = express.Router();

// Route to create a booking (data only)
// Supports both registered users and guests (auth is optional here)
router.route('/').post(createBooking);

// Authenticated routes below
router.use(auth);

router.route('/')
    .get(authorize('admin', 'employee'), getAllBookings);
    
router.route('/my-bookings')
    .get(authorize('customer'), getMyBookings);

router.route('/:id/status')
    .put(authorize('admin', 'employee'), updateBookingStatus);

// Route for customers to upload payment proof to an existing booking
router.route('/:id/payment-proof')
    .post(authorize('customer'), upload.single('paymentProof'), uploadPaymentProof);

export default router;