import express, { Request, Response } from 'express';
import { AdminAnalyticsController } from '../controllers/AdminAnalyticsController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminAnalyticsController();

// All routes require admin authentication
router.use(requireAdmin);

// Get comprehensive analytics overview
router.get('/overview', async (req: Request, res: Response) => {
  await controller.getOverview(req, res);
});

// Get user growth data
router.get('/growth', async (req: Request, res: Response) => {
  await controller.getGrowthData(req, res);
});

// Get revenue trends
router.get('/revenue-trends', async (req: Request, res: Response) => {
  await controller.getRevenueTrends(req, res);
});

// Get feature usage statistics
router.get('/features', async (req: Request, res: Response) => {
  await controller.getFeatureUsage(req, res);
});

// Export analytics data
router.get('/export', async (req: Request, res: Response) => {
  await controller.exportData(req, res);
});

export default router;
