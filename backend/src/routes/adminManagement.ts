import express, { Request, Response } from 'express';
import { AdminManagementController } from '../controllers/AdminManagementController';
import { requireAdmin, requireSuperAdmin } from '../middleware/adminAuth';

const router = express.Router();
const controller = new AdminManagementController();

// All routes require super admin access
router.use(requireAdmin);
router.use(requireSuperAdmin);

// Admin management
router.get('/admins', async (req: Request, res: Response) => {
  await controller.getAdmins(req, res);
});

router.delete('/admins/:id', async (req: Request, res: Response) => {
  await controller.removeAdmin(req, res);
});

router.post('/admins/:id/reset-password', async (req: Request, res: Response) => {
  await controller.resetAdminPassword(req, res);
});

// Approved emails management
router.get('/approved-emails', async (req: Request, res: Response) => {
  await controller.getApprovedEmails(req, res);
});

router.post('/approved-emails', async (req: Request, res: Response) => {
  await controller.addApprovedEmail(req, res);
});

router.delete('/approved-emails/:email', async (req: Request, res: Response) => {
  await controller.removeApprovedEmail(req, res);
});

// Super admin management
router.patch('/super-admin/change-email', async (req: Request, res: Response) => {
  await controller.changeSuperAdminEmail(req, res);
});

// Activity logs
router.get('/activity-log', async (req: Request, res: Response) => {
  await controller.getActivityLog(req, res);
});

export default router;
