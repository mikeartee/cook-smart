import { Request, Response } from 'express';
import AdminUserModel from '../models/AdminUser';
import ApprovedAdminEmailModel from '../models/ApprovedAdminEmail';
import AdminActivityLogger from '../services/AdminActivityLogger';

export class AdminManagementController {
  /**
   * Get all admins
   * GET /api/admin/management/admins
   */
  async getAdmins(req: Request, res: Response): Promise<void> {
    try {
      const admins = await AdminUserModel.getAll();
      res.json({ admins });
    } catch (error) {
      console.error('Get admins error:', error);
      res.status(500).json({ error: 'Failed to get admins' });
    }
  }

  /**
   * Get all approved emails
   * GET /api/admin/management/approved-emails
   */
  async getApprovedEmails(req: Request, res: Response): Promise<void> {
    try {
      const emails = await ApprovedAdminEmailModel.getAll();
      res.json({ emails });
    } catch (error) {
      console.error('Get approved emails error:', error);
      res.status(500).json({ error: 'Failed to get approved emails' });
    }
  }

  /**
   * Add email to approved list
   * POST /api/admin/management/approved-emails
   */
  async addApprovedEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, is_super_admin } = req.body;
      const adminId = req.admin!.id;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      const exists = await ApprovedAdminEmailModel.isApproved(email);
      if (exists) {
        res.status(409).json({ error: 'Email already approved' });
        return;
      }

      const approvedEmail = await ApprovedAdminEmailModel.add(
        email,
        is_super_admin || false,
        adminId
      );

      res.status(201).json({ message: 'Email added to approved list', email: approvedEmail });
    } catch (error) {
      console.error('Add approved email error:', error);
      res.status(500).json({ error: 'Failed to add approved email' });
    }
  }

  /**
   * Remove email from approved list
   * DELETE /api/admin/management/approved-emails/:email
   */
  async removeApprovedEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;

      const success = await ApprovedAdminEmailModel.remove(email);

      if (!success) {
        res.status(400).json({ error: 'Cannot remove this email or email not found' });
        return;
      }

      res.json({ message: 'Email removed from approved list' });
    } catch (error) {
      console.error('Remove approved email error:', error);
      res.status(500).json({ error: 'Failed to remove approved email' });
    }
  }

  /**
   * Remove admin access
   * PATCH /api/admin/management/admins/:id/remove
   */
  async removeAdmin(req: Request, res: Response): Promise<void> {
    try {
      const adminId = parseInt(req.params.id);

      if (isNaN(adminId)) {
        res.status(400).json({ error: 'Invalid admin ID' });
        return;
      }

      const success = await AdminUserModel.delete(adminId);

      if (!success) {
        res.status(400).json({ error: 'Cannot remove this admin or admin not found' });
        return;
      }

      res.json({ message: 'Admin removed successfully' });
    } catch (error) {
      console.error('Remove admin error:', error);
      res.status(500).json({ error: 'Failed to remove admin' });
    }
  }

  /**
   * Change super admin email
   * PATCH /api/admin/management/super-admin/change-email
   */
  async changeSuperAdminEmail(req: Request, res: Response): Promise<void> {
    try {
      const { newEmail, password } = req.body;
      const currentAdmin = req.admin!;

      if (!newEmail || !password) {
        res.status(400).json({ error: 'New email and password are required' });
        return;
      }

      // Verify password
      const admin = await AdminUserModel.findById(currentAdmin.id);
      if (!admin) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }

      const isValidPassword = await AdminUserModel.verifyPassword(password, admin.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }

      // Change super admin email
      await ApprovedAdminEmailModel.changeSuperAdminEmail(
        currentAdmin.email,
        newEmail,
        currentAdmin.id
      );

      // Update admin user email
      await AdminUserModel.update(currentAdmin.id, { email: newEmail });

      res.json({ message: 'Super admin email changed successfully' });
    } catch (error) {
      console.error('Change super admin email error:', error);
      res.status(500).json({ error: 'Failed to change super admin email' });
    }
  }

  /**
   * Reset admin password
   * POST /api/admin/management/admins/:id/reset-password
   */
  async resetAdminPassword(req: Request, res: Response): Promise<void> {
    try {
      const adminId = parseInt(req.params.id);
      const { newPassword } = req.body;

      if (isNaN(adminId)) {
        res.status(400).json({ error: 'Invalid admin ID' });
        return;
      }

      if (!newPassword || newPassword.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      await AdminUserModel.update(adminId, { password: newPassword });

      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset admin password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }

  /**
   * Get admin activity log
   * GET /api/admin/management/activity-log
   */
  async getActivityLog(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await AdminActivityLogger.getLogsPaginated(page, limit);

      res.json(result);
    } catch (error) {
      console.error('Get activity log error:', error);
      res.status(500).json({ error: 'Failed to get activity log' });
    }
  }
}

export default new AdminManagementController();
