import express, { Request, Response } from 'express';
import { AdminErrorsController } from '../controllers/AdminErrorsController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminErrorsController();

// All routes require admin authentication
router.use(requireAdmin);

// Get error list with filters
router.get('/', async (req: Request, res: Response) => {
  await controller.listErrors(req, res);
});

// Get error details
router.get('/:id', async (req: Request, res: Response) => {
  await controller.getErrorDetails(req, res);
});

// Get error frequency data
router.get('/stats/frequency', async (req: Request, res: Response) => {
  await controller.getErrorFrequency(req, res);
});

export default router;
