import express from 'express';
import { createReview } from '../controllers/reviewsController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').post(auth, authorize('customer'), createReview);

export default router;
