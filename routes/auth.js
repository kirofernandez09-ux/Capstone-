import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Routes for password reset
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

export default router;