import {Request, Response, NextFunction} from 'express';
import pool from '../config/database';

/**
 * Check if user has active subscription or is in grace period
 */
export async function requireActiveSubscription(
  req: Request & {user?: any},
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({error: 'Authentication required'});
      return;
    }

    const result = await pool.query(
      `SELECT subscription_status FROM users WHERE id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({error: 'User not found'});
      return;
    }

    const status = result.rows[0].subscription_status;

    // Allow: active, trialing, past_due (grace period)
    if (['active', 'trialing', 'past_due'].includes(status)) {
      next();
      return;
    }

    // Restricted or no subscription
    res.status(403).json({
      error: 'Subscription required',
      message: 'Please update your subscription to access this feature',
      restricted: true,
    });
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({error: 'Failed to verify subscription'});
  }
}

/**
 * Get user's subscription access level
 */
export async function getSubscriptionAccess(
  req: Request & {user?: any},
  res: Response,
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({error: 'Authentication required'});
      return;
    }

    const result = await pool.query(
      `SELECT u.subscription_status, s.status as stripe_status, s.current_period_end, s.updated_at
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status IN ('active', 'trialing', 'past_due')
       WHERE u.id = $1
       LIMIT 1`,
      [userId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({error: 'User not found'});
      return;
    }

    const user = result.rows[0];
    const status = user.subscription_status;

    let accessLevel = 'none';
    let gracePeriodEnd = null;
    let daysRemaining = null;

    if (status === 'active' || status === 'trialing') {
      accessLevel = 'full';
    } else if (status === 'past_due') {
      const daysPastDue = Math.floor(
        (Date.now() - new Date(user.updated_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysPastDue < 7) {
        accessLevel = 'full'; // Grace period
        gracePeriodEnd = new Date(user.updated_at);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
        daysRemaining = 7 - daysPastDue;
      } else {
        accessLevel = 'restricted';
      }
    } else if (status === 'restricted') {
      accessLevel = 'restricted';
    }

    res.json({
      accessLevel,
      status,
      gracePeriodEnd,
      daysRemaining,
      expiresAt: user.current_period_end,
    });
  } catch (error) {
    console.error('Get subscription access error:', error);
    res.status(500).json({error: 'Failed to get subscription access'});
  }
}
