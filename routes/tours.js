import express from 'express';
import { getAllTours, getTourById, createTour, updateTour, archiveTour } from '../controllers/toursController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.route('/')
    .get(getAllTours)
    .post(auth, checkPermission('tours', 'write'), createTour);

router.route('/:id')
    .get(getTourById)
    .put(auth, checkPermission('tours', 'write'), updateTour);

router.route('/:id/archive')
    .patch(auth, checkPermission('tours', 'full'), archiveTour);

export default router;