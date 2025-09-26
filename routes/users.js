import express from 'express';
// FIX: Corrected folder path to 'controllers'
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee, changeEmployeePassword } from '../controllers/usersController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/employees').get(auth, authorize('admin'), getAllEmployees).post(auth, authorize('admin'), createEmployee);
router.route('/employees/:id').put(auth, authorize('admin'), updateEmployee).delete(auth, authorize('admin'), deleteEmployee);
router.route('/employees/:id/password').put(auth, authorize('admin'), changeEmployeePassword);

export default router;