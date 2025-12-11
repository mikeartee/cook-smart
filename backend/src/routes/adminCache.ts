import express, { Request, Response } from 'express';
import { AdminCacheController } from '../controllers/AdminCacheController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminCacheController();

router.use(requireAdmin);

// Get cache status overview
router.get('/status', async (req: Request, res: Response) => {
  await controller.getStats(req, res);
});

router.get('/stats', async (req: Request, res: Response) => {
  await controller.getStats(req, res);
});

router.get('/popular', async (req: Request, res: Response) => {
  await controller.getPopularRecipes(req, res);
});

router.delete('/expired', async (req: Request, res: Response) => {
  await controller.clearExpired(req, res);
});

router.delete('/all', async (req: Request, res: Response) => {
  await controller.clearAll(req, res);
});

export default router;
