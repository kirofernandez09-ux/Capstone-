import express from 'express';
// FIX: Corrected path
import { getContentByType, updateContent, getAllContentTypes } from '../controllers/contentController.js';
import { auth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllContentTypes);
router.get('/:type', getContentByType);
router.put('/:type', auth, authorize('admin'), updateContent);

export default router;