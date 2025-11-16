import express, { Request, Response } from 'express';
import { AdminSubscriptionsController } from '../controllers/AdminSubscriptionsController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminSubscriptionsController();

// All routes require admin authentication
router.use(requireAdmin);

// Subscription overview and metrics
router.get('/overview', async (req: Request, res: Response) => {
  await controller.getOverview(req, res);
});

// List all subscriptions with filters
router.get('/', async (req: Request, res: Response) => {
  await controller.listSubscriptions(req, res);
});

// Grant subscription to user
router.post('/grant', async (req: Request, res: Response) => {
  await controller.grantSubscription(req, res);
});

// Cancel subscription
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  await controller.cancelSubscription(req, res);
});

// Extend subscription
router.patch('/:id/extend', async (req: Request, res: Response) => {
  await controller.extendSubscription(req, res);
});

// Get billing history
router.get('/billing-history', async (req: Request, res: Response) => {
  await controller.getBillingHistory(req, res);
});

// Process refund
router.post('/:transactionId/refund', async (req: Request, res: Response) => {
  await controller.processRefund(req, res);
});

export default router;
