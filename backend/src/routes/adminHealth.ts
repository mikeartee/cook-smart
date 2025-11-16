import express, { Request, Response } from 'express';
import { AdminHealthController } from '../controllers/AdminHealthController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminHealthController();

// All routes require admin authentication
router.use(requireAdmin);

// Get overall system health
router.get('/overview', async (req: Request, res: Response) => {
  await controller.getOverview(req, res);
});

// Get server metrics
router.get('/server', async (req: Request, res: Response) => {
  await controller.getServerMetrics(req, res);
});

// Get database metrics
router.get('/database', async (req: Request, res: Response) => {
  await controller.getDatabaseMetrics(req, res);
});

// Get API metrics
router.get('/api', async (req: Request, res: Response) => {
  await controller.getAPIMetrics(req, res);
});

// Get external services status
router.get('/external-services', async (req: Request, res: Response) => {
  await controller.getExternalServices(req, res);
});

// Get cache metrics
router.get('/cache', async (req: Request, res: Response) => {
  await controller.getCacheMetrics(req, res);
});

export default router;
