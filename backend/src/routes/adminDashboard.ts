import express, {Response} from 'express';
import pool from '../config/database';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = express.Router();

// Middleware to check admin access
const requireAdmin = (req: AuthRequest, res: Response, next: any): void => {
  const user = req.user;

  if (!user) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  const isAdmin =
    user.is_creator ||
    user.is_co_founder ||
    (user.email === 'bradturnbough80@gmail.com' &&
      user.has_lifetime_subscription);

  if (!isAdmin) {
    res.status(403).json({error: 'Admin access required'});
    return;
  }

  next();
};

// Get dashboard stats
router.get(
  '/stats',
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      // Get user stats
      const userStatsQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_users_today,
        COUNT(*) FILTER (WHERE subscription_status = 'free' OR subscription_status IS NULL) as beta_users,
        COUNT(*) FILTER (WHERE subscription_status = 'active' OR has_lifetime_subscription = true) as active_subscriptions
      FROM users
    `;

      const userStats = await pool.query(userStatsQuery);
      const userData = userStats.rows[0];

      // Get revenue stats (if you have payment tracking)
      const revenueQuery = `
      SELECT
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_payments
      FROM subscription_transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

      let revenueData = {total_revenue: 0, failed_payments: 0};
      try {
        const revenueStats = await pool.query(revenueQuery);
        revenueData = revenueStats.rows[0];
      } catch (error) {
        // Table might not exist yet, use defaults
        console.log('Revenue stats not available:', error);
      }

      // Return combined stats
      res.json({
        success: true,
        stats: {
          totalUsers: parseInt(userData.total_users || '0'),
          activeSubscriptions: parseInt(userData.active_subscriptions || '0'),
          betaUsers: parseInt(userData.beta_users || '0'),
          totalRevenue: parseInt(revenueData.total_revenue?.toString() || '0'),
          newUsersToday: parseInt(userData.new_users_today || '0'),
          failedPayments: parseInt(
            revenueData.failed_payments?.toString() || '0',
          ),
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        error: 'Failed to fetch dashboard stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  },
);

export default router;
