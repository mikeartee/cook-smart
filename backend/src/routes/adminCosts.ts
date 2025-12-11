import express, { Request, Response } from 'express';
import { AdminCostsController } from '../controllers/AdminCostsController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminCostsController();

router.use(requireAdmin);

// Get costs overview
router.get('/overview', async (req: Request, res: Response) => {
  await controller.getCurrentCosts(req, res);
});

router.get('/current', async (req: Request, res: Response) => {
  await controller.getCurrentCosts(req, res);
});

router.get('/trends', async (req: Request, res: Response) => {
  await controller.getCostTrends(req, res);
});

router.get('/per-user', async (req: Request, res: Response) => {
  await controller.getCostPerUser(req, res);
});

router.get('/projections', async (req: Request, res: Response) => {
  await controller.getProjections(req, res);
});

router.get('/alerts', async (req: Request, res: Response) => {
  await controller.getAlerts(req, res);
});

export default router;
