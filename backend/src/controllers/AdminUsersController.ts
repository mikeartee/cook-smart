import { Request, Response } from 'express';
import pool from '../config/database';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminUsersController {
  /**
   * List users with pagination, search, and filters
   * GET /api/v1/admin/users?page=1&limit=50&search=john&accountType=premium&status=active
   */
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const accountType = req.query.accountType as string; // co-founder, premium, free
      const status = req.query.status as string; // active, suspended
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Search by name or email
      if (search) {
        conditions.push(`(
          LOWER(email) LIKE LOWER($${paramCount}) OR 
          LOWER(first_name) LIKE LOWER($${paramCount}) OR 
          LOWER(last_name) LIKE LOWER($${paramCount})
        )`);
        values.push(`%${search}%`);
        paramCount++;
      }

      // Filter by account type
      if (accountType === 'co-founder') {
        conditions.push(`is_co_founder = true`);
      } else if (accountType === 'premium') {
        conditions.push(`subscription_status = 'active' AND is_co_founder = false`);
      } else if (accountType === 'free') {
        conditions.push(`subscription_status = 'free' AND is_co_founder = false`);
      }

      // Filter by status
      if (status === 'suspended') {
        conditions.push(`is_suspended = true`);
      } else if (status === 'active') {
        conditions.push(`(is_suspended = false OR is_suspended IS NULL)`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get users with stats
      const query = `
        SELECT 
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          u.is_co_founder,
          u.subscription_status,
          u.subscription_expires_at,
          u.has_lifetime_subscription,
          u.created_at,
          u.last_login_at,
          u.email_verified,
          COALESCE(u.is_suspended, false) as is_suspended,
          (SELECT COUNT(*) FROM user_ingredients WHERE user_id = u.id) as ingredient_count,
          (SELECT COUNT(*) FROM user_recipes WHERE user_id = u.id) as recipe_count
        FROM users u
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const result = await pool.query(query, values);

      res.json({
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  /**
   * Get user details with comprehensive stats
   * GET /api/v1/admin/users/:id
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Get user info
      const userQuery = `
        SELECT 
          id, email, first_name, last_name, is_co_founder,
          subscription_status, subscription_expires_at, has_lifetime_subscription,
          points, age_verified, dietary_restrictions, allergies,
          show_nutrition, preferred_units, created_at, updated_at,
          last_login_at, email_verified,
          COALESCE(is_suspended, false) as is_suspended,
          suspension_reason
        FROM users
        WHERE id = $1
      `;
      const userResult = await pool.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = userResult.rows[0];

      // Get activity stats
      const statsQuery = `
        SELECT
          (SELECT COUNT(*) FROM user_ingredients WHERE user_id = $1) as ingredient_count,
          (SELECT COUNT(*) FROM user_recipes WHERE user_id = $1) as recipe_count,
          (SELECT COUNT(*) FROM feedback WHERE user_id = $1) as feedback_count,
          (SELECT COUNT(*) FROM user_referrals WHERE referrer_id = $1) as referral_count
      `;
      const statsResult = await pool.query(statsQuery, [id]);
      const stats = statsResult.rows[0];

      // Get recent activity
      const recentIngredientsQuery = `
        SELECT name, quantity, unit, added_at
        FROM user_ingredients
        WHERE user_id = $1
        ORDER BY added_at DESC
        LIMIT 5
      `;
      const recentIngredients = await pool.query(recentIngredientsQuery, [id]);

      const recentRecipesQuery = `
        SELECT recipe_id, recipe_title, saved_at
        FROM user_recipes
        WHERE user_id = $1
        ORDER BY saved_at DESC
        LIMIT 5
      `;
      const recentRecipes = await pool.query(recentRecipesQuery, [id]);

      res.json({
        user,
        stats,
        recentActivity: {
          ingredients: recentIngredients.rows,
          recipes: recentRecipes.rows,
        },
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  }

  /**
   * Mark user as co-founder
   * PATCH /api/v1/admin/users/:id/co-founder
   */
  async markAsCoFounder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isCoFounder } = req.body;

      if (typeof isCoFounder !== 'boolean') {
        res.status(400).json({ error: 'isCoFounder must be a boolean' });
        return;
      }

      const query = `
        UPDATE users
        SET 
          is_co_founder = $1,
          has_lifetime_subscription = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, email, first_name, last_name, is_co_founder
      `;

      const result = await pool.query(query, [isCoFounder, id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'mark_co_founder',
        resourceType: 'user',
        resourceId: id,
        details: { isCoFounder },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `User ${isCoFounder ? 'marked' : 'unmarked'} as co-founder`,
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Mark co-founder error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Suspend or unsuspend user account
   * PATCH /api/v1/admin/users/:id/suspend
   */
  async suspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { suspend, reason } = req.body;

      if (typeof suspend !== 'boolean') {
        res.status(400).json({ error: 'suspend must be a boolean' });
        return;
      }

      if (suspend && !reason) {
        res.status(400).json({ error: 'reason is required when suspending a user' });
        return;
      }

      const query = `
        UPDATE users
        SET 
          is_suspended = $1,
          suspension_reason = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING id, email, first_name, last_name, is_suspended, suspension_reason
      `;

      const result = await pool.query(query, [suspend, suspend ? reason : null, id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: suspend ? 'suspend_user' : 'unsuspend_user',
        resourceType: 'user',
        resourceId: id,
        details: { reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`,
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  /**
   * Delete user account (requires "DELETE" confirmation)
   * DELETE /api/v1/admin/users/:id?confirmation=DELETE
   */
  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { confirmation } = req.query;

      if (confirmation !== 'DELETE') {
        res.status(400).json({ 
          error: 'Confirmation required. Add ?confirmation=DELETE to the request' 
        });
        return;
      }

      // Get user info before deletion
      const userQuery = 'SELECT email, first_name, last_name FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [id]);

      if (userResult.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const user = userResult.rows[0];

      // Delete user and all related data (cascading deletes should handle this)
      const deleteQuery = 'DELETE FROM users WHERE id = $1';
      await pool.query(deleteQuery, [id]);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'delete_user',
        resourceType: 'user',
        resourceId: id,
        details: { 
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'User deleted successfully',
        deletedUser: {
          id,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }
}
