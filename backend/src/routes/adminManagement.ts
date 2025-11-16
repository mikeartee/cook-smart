import express from 'express';
import AdminManagementController from '../controllers/AdminManagementController';
import { requireAdmin, requireSuperAdmin } from '../middleware/adminAuth';

const router = express.Router();

// All routes require super admin access
router.use(requireAdmin);
router.use(requireSuperAdmin);

// Admin management
router.get('/admins', AdminManagementController.getAdmins.bind(AdminManagementController));
router.patch('/admins/:id/remove', AdminManagementController.removeAdmin.bind(AdminManagementController));
router.post('/admins/:id/reset-password', AdminManagementController.resetAdminPassword.bind(AdminManagementController));

// Approved emails management
router.get('/approved-emails', AdminManagementController.getApprovedEmails.bind(AdminManagementController));
router.post('/approved-emails', AdminManagementController.addApprovedEmail.bind(AdminManagementController));
router.delete('/approved-emails/:email', AdminManagementController.removeApprovedEmail.bind(AdminManagementController));

// Super admin settings
router.patch('/super-admin/change-email', AdminManagementController.changeSuperAdminEmail.bind(AdminManagementController));

// Activity log
router.get('/activity-log', AdminManagementController.getActivityLog.bind(AdminManagementController));

export default router;
