import express from 'express';
import { getAllCars, createCar, updateCar, archiveCar } from '../controllers/carsController.js';
import { auth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permission.js';

const router = express.Router();

router.route('/')
    .get(getAllCars)
    .post(auth, checkPermission('cars', 'write'), createCar);

router.route('/:id')
    .put(auth, checkPermission('cars', 'write'), updateCar);

router.route('/:id/archive')
    .patch(auth, checkPermission('cars', 'full'), archiveCar);

export default router;