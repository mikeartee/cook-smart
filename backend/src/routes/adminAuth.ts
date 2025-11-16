import express, { Request, Response } from 'express';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { requireAdmin, rateLimitLogin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminAuthController();

// Public routes
router.post('/signup', async (req: Request, res: Response) => {
  await controller.signup(req, res);
});

router.post('/verify-email', async (req: Request, res: Response) => {
  await controller.verifyEmail(req, res);
});

router.post('/login', rateLimitLogin, async (req: Request, res: Response) => {
  await controller.login(req, res);
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  await controller.forgotPassword(req, res);
});

router.post('/reset-password', async (req: Request, res: Response) => {
  await controller.resetPassword(req, res);
});

// Protected routes
router.post('/logout', requireAdmin, async (req: Request, res: Response) => {
  await controller.logout(req, res);
});

router.get('/me', requireAdmin, async (req: Request, res: Response) => {
  await controller.me(req, res);
});

export default router;
