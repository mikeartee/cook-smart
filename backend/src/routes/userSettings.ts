import express, {Request, Response} from 'express';
import pool from '../config/database';
import {authenticateToken} from '../middleware/auth';
import {UserModel} from '../models/User';

const router = express.Router();

// Get user privacy settings
router.get(
  '/privacy',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const query = `
      SELECT 
        data_sharing,
        analytics_enabled,
        push_notifications,
        location_services
      FROM users
      WHERE id = $1
    `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({error: 'User not found'});
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      return res.status(500).json({error: 'Failed to fetch privacy settings'});
    }
  },
);

// Update user privacy settings
router.patch(
  '/privacy',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const {
        data_sharing,
        analytics_enabled,
        push_notifications,
        location_services,
      } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data_sharing !== undefined) {
        updates.push(`data_sharing = $${paramCount++}`);
        values.push(data_sharing);
      }

      if (analytics_enabled !== undefined) {
        updates.push(`analytics_enabled = $${paramCount++}`);
        values.push(analytics_enabled);
      }

      if (push_notifications !== undefined) {
        updates.push(`push_notifications = $${paramCount++}`);
        values.push(push_notifications);
      }

      if (location_services !== undefined) {
        updates.push(`location_services = $${paramCount++}`);
        values.push(location_services);
      }

      if (updates.length === 0) {
        return res.status(400).json({error: 'No settings to update'});
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING data_sharing, analytics_enabled, push_notifications, location_services
    `;

      const result = await pool.query(query, values);

      return res.json({
        success: true,
        settings: result.rows[0],
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return res.status(500).json({error: 'Failed to update privacy settings'});
    }
  },
);

// Export user data (GDPR compliance)
router.get(
  '/export-data',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const userData = await UserModel.exportUserData(String(userId));

      // In production, this should send an email with the data
      // For now, return it directly
      return res.json({
        success: true,
        message: 'Data export completed',
        data: userData,
      });
    } catch (error) {
      console.error('Error exporting user data:', error);
      return res.status(500).json({error: 'Failed to export user data'});
    }
  },
);

// Delete user account (GDPR compliance)
router.delete(
  '/account',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const {confirmation} = req.body;

      if (confirmation !== 'DELETE') {
        return res.status(400).json({error: 'Invalid confirmation'});
      }

      await UserModel.deleteUser(String(userId));

      return res.json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      return res.status(500).json({error: 'Failed to delete account'});
    }
  },
);

// Get two-factor authentication status
router.get(
  '/two-factor',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const query = `
      SELECT two_factor_enabled
      FROM users
      WHERE id = $1
    `;

      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({error: 'User not found'});
      }

      return res.json({
        enabled: result.rows[0].two_factor_enabled || false,
      });
    } catch (error) {
      console.error('Error fetching two-factor status:', error);
      return res.status(500).json({error: 'Failed to fetch two-factor status'});
    }
  },
);

// Enable two-factor authentication
router.post(
  '/two-factor/enable',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      // Generate a secret for 2FA (in production, use speakeasy or similar)
      const secret =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const query = `
      UPDATE users
      SET two_factor_enabled = TRUE,
          two_factor_secret = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING two_factor_enabled
    `;

      const result = await pool.query(query, [secret, userId]);

      return res.json({
        success: true,
        enabled: result.rows[0].two_factor_enabled,
        secret: secret, // In production, this should be a QR code
      });
    } catch (error) {
      console.error('Error enabling two-factor:', error);
      return res
        .status(500)
        .json({error: 'Failed to enable two-factor authentication'});
    }
  },
);

// Disable two-factor authentication
router.post(
  '/two-factor/disable',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
      }

      const query = `
      UPDATE users
      SET two_factor_enabled = FALSE,
          two_factor_secret = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING two_factor_enabled
    `;

      const result = await pool.query(query, [userId]);

      return res.json({
        success: true,
        enabled: result.rows[0].two_factor_enabled,
      });
    } catch (error) {
      console.error('Error disabling two-factor:', error);
      return res
        .status(500)
        .json({error: 'Failed to disable two-factor authentication'});
    }
  },
);

export default router;
