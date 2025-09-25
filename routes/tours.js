import express from 'express';
// FIX: Corrected path
import { getAllTours, getTourById, createTour, updateTour, archiveTour } from '../controllers/toursController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getAllTours).post(auth, authorize('admin', 'employee'), createTour);
router.route('/:id').get(getTourById).put(auth, authorize('admin', 'employee'), updateTour);
router.route('/:id/archive').patch(auth, authorize('admin', 'employee'), archiveTour);

export default router;