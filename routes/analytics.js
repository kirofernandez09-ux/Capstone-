import express from 'express';
// FIX: Corrected path from './' to '../'
import { getDashboardAnalytics } from '../controllers/analyticsController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', auth, authorize('admin', 'employee'), getDashboardAnalytics);

export default router;