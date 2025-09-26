import express from 'express';
import {
    getAllBookings,
    createBooking,
    updateBookingStatus,
    uploadPaymentProof,
    archiveBooking
} from '../controllers/bookingsController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';
import { upload } from '../middleware/upload.js'; // Corrected import

const router = express.Router();

// Public route to create a new booking
router.route('/').post(createBooking);

// Authenticated routes
router.use(auth);

router.route('/')
    .get(getAllBookings); // Customers get their own, staff get all

router.route('/:id/status')
    .put(checkPermission('bookings', 'write'), updateBookingStatus);

// Use the 'upload' middleware specifically for this route
router.route('/:id/payment-proof')
    .post(upload.single('paymentProof'), uploadPaymentProof);

router.route('/:id/archive')
    .patch(checkPermission('bookings', 'full'), archiveBooking);

export default router;