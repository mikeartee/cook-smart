import express, { Request, Response } from 'express';
import { AdminFeedbackController } from '../controllers/AdminFeedbackController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminFeedbackController();

// All routes require admin authentication
router.use(requireAdmin);

// Get feedback list with filters
router.get('/', async (req: Request, res: Response) => {
  await controller.listFeedback(req, res);
});

// Get feedback details
router.get('/:id', async (req: Request, res: Response) => {
  await controller.getFeedbackDetails(req, res);
});

// Update feedback status
router.patch('/:id/status', async (req: Request, res: Response) => {
  await controller.updateStatus(req, res);
});

// Add/update admin notes
router.patch('/:id/notes', async (req: Request, res: Response) => {
  await controller.updateNotes(req, res);
});

// Export feedback as CSV
router.get('/export/csv', async (req: Request, res: Response) => {
  await controller.exportFeedback(req, res);
});

export default router;
