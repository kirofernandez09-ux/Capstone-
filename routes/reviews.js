import express from 'express';
import { createReview, getMyReviews, updateReview, deleteReview, getAllReviews, approveReview } from '../controllers/reviewsController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
    .post(auth, authorize('customer'), createReview)
    .get(auth, authorize('admin'), getAllReviews);

router.route('/my-reviews')
    .get(auth, authorize('customer'), getMyReviews);

router.route('/:id')
    .put(auth, authorize('customer'), updateReview)
    .delete(auth, authorize('customer', 'admin'), deleteReview);

router.route('/:id/approve')
    .put(auth, authorize('admin'), approveReview);

export default router;