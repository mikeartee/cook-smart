import express, { Request, Response } from 'express';
import { AdminReferralsController } from '../controllers/AdminReferralsController';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminReferralsController();

router.use(requireAdmin);

router.get('/overview', async (req: Request, res: Response) => {
  await controller.getOverview(req, res);
});

router.get('/top-referrers', async (req: Request, res: Response) => {
  await controller.getTopReferrers(req, res);
});

router.get('/codes', async (req: Request, res: Response) => {
  await controller.getAllCodes(req, res);
});

router.post('/codes', async (req: Request, res: Response) => {
  await controller.createCustomCode(req, res);
});

router.patch('/codes/:code/disable', async (req: Request, res: Response) => {
  await controller.disableCode(req, res);
});

export default router;
