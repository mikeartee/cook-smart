import express, {Response} from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import {UserModel} from '../models/User';

const router = express.Router();

// Get user profile
router.get(
  '/profile',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({error: 'User not found'});
        return;
      }

      // Return user profile without sensitive data
      res.json({
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_creator: user.is_creator,
          is_co_founder: user.is_co_founder,
          is_special_user: user.is_special_user,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('[User Profile] Error:', error);
      res.status(500).json({error: 'Failed to get user profile'});
    }
  },
);

// Update user profile
router.patch(
  '/profile',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const {first_name, last_name} = req.body;

      // Validate input
      if (!first_name && !last_name) {
        res.status(400).json({error: 'No fields to update'});
        return;
      }

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (first_name) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(first_name.trim());
      }
      if (last_name) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(last_name.trim());
      }

      values.push(userId);

      const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING id, email, first_name, last_name
    `;

      const pool = require('../config/database').default;
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        res.status(404).json({error: 'User not found'});
        return;
      }

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('[Update Profile] Error:', error);
      res.status(500).json({error: 'Failed to update profile'});
    }
  },
);

export default router;
