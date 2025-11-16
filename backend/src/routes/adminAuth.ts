import express from 'express';
import AdminAuthController from '../controllers/AdminAuthController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Public routes (no authentication required)
router.post('/signup', AdminAuthController.signup.bind(AdminAuthController));
router.post('/verify-email', AdminAuthController.verifyEmail.bind(AdminAuthController));
router.post('/login', AdminAuthController.login.bind(AdminAuthController));
router.post('/forgot-password', AdminAuthController.forgotPassword.bind(AdminAuthController));
router.post('/reset-password', AdminAuthController.resetPassword.bind(AdminAuthController));

// Protected routes (authentication required)
router.post('/logout', requireAdmin, AdminAuthController.logout.bind(AdminAuthController));
router.get('/me', requireAdmin, AdminAuthController.me.bind(AdminAuthController));

export default router;
