import express from 'express';
// FIX: Corrected path
import { getAllCars, createCar, updateCar, archiveCar } from '../controllers/carsController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getAllCars).post(auth, authorize('admin', 'employee'), createCar);
router.route('/:id').put(auth, authorize('admin', 'employee'), updateCar);
router.route('/:id/archive').patch(auth, authorize('admin', 'employee'), archiveCar);

export default router;