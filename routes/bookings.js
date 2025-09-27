import express from 'express';
import {
    getAllBookings,
    createBooking,
    updateBookingStatus,
    getMyBookings,
    uploadPaymentProof
} from '../controllers/bookingsController.js';
import { auth, authorize } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.route('/').post(createBooking);

router.use(auth);

router.route('/')
    .get(checkPermission('bookings', 'read'), getAllBookings);
    
router.route('/my-bookings')
    .get(authorize('customer'), getMyBookings);

router.route('/:id/status')
    .put(checkPermission('bookings', 'write'), updateBookingStatus);

router.route('/:id/payment-proof')
    .post(authorize('customer'), upload.single('paymentProof'), uploadPaymentProof);

export default router;