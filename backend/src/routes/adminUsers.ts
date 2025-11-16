import express, { Request, Response } from 'express';
import { AdminUsersController } from '../controllers/AdminUsersController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminUsersController();

// All routes require admin authentication
router.use(requireAdmin);

// User list with pagination, search, and filters
router.get('/', async (req: Request, res: Response) => {
  await controller.listUsers(req, res);
});

// Get user details with stats
router.get('/:id', async (req: Request, res: Response) => {
  await controller.getUserDetails(req, res);
});

// Mark user as co-founder
router.patch('/:id/co-founder', async (req: Request, res: Response) => {
  await controller.markAsCoFounder(req, res);
});

// Suspend/unsuspend user account
router.patch('/:id/suspend', async (req: Request, res: Response) => {
  await controller.suspendUser(req, res);
});

// Delete user account (requires confirmation)
router.delete('/:id', async (req: Request, res: Response) => {
  await controller.deleteUser(req, res);
});

export default router;
