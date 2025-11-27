import express from 'express';
import {authenticateToken} from '../middleware/auth';
import pool from '../config/database';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

/**
 * Sync subscription status from Stripe
 * Fixes: Payment succeeds but webhook fails
 */
router.post('/sync', authenticateToken, async (req: any, res): Promise<any> => {
  try {
    const userId = req.user.id;

    // Get user's subscriptions from database
    const dbSubs = await pool.query(
      'SELECT id, stripe_subscription_id FROM subscriptions WHERE user_id = $1',
      [userId],
    );

    if (dbSubs.rows.length === 0) {
      return res.json({success: true, message: 'No subscriptions to sync'});
    }

    // Sync each subscription with Stripe
    for (const dbSub of dbSubs.rows) {
      if (!dbSub.stripe_subscription_id) continue;

      const stripeSub: any = await stripe.subscriptions.retrieve(
        dbSub.stripe_subscription_id,
      );

      // Update database with Stripe data
      await pool.query(
        `UPDATE subscriptions 
         SET status = $1, 
             current_period_end = $2,
             cancel_at_period_end = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          stripeSub.status,
          new Date(stripeSub.current_period_end * 1000),
          stripeSub.cancel_at_period_end,
          dbSub.id,
        ],
      );
    }

    res.json({success: true, message: 'Subscriptions synced'});
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({success: false, error: 'Sync failed'});
  }
});

/**
 * Check for pending checkout sessions
 * Fixes: User closes browser mid-payment
 */
router.get(
  '/check-pending',
  authenticateToken,
  async (req: any, res): Promise<any> => {
    try {
      const userId = req.user.id;

      // Get pending sessions from last 24 hours
      const sessions = await pool.query(
        `SELECT checkout_session_id 
       FROM subscription_checkout_sessions 
       WHERE user_id = $1 
         AND status = 'pending' 
         AND created_at > NOW() - INTERVAL '24 hours'`,
        [userId],
      );

      const pending = [];
      for (const session of sessions.rows) {
        const stripeSession = await stripe.checkout.sessions.retrieve(
          session.checkout_session_id,
        );

        if (stripeSession.status === 'complete') {
          // Payment completed, update database
          await pool.query(
            `UPDATE subscription_checkout_sessions 
           SET status = 'complete' 
           WHERE checkout_session_id = $1`,
            [session.checkout_session_id],
          );
        } else if (stripeSession.status === 'open') {
          pending.push({
            sessionId: session.checkout_session_id,
            url: stripeSession.url,
          });
        }
      }

      res.json({success: true, pending});
    } catch (error) {
      console.error('Check pending error:', error);
      res.status(500).json({success: false, error: 'Check failed'});
    }
  },
);

export default router;
