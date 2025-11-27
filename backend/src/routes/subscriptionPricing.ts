import express from 'express';
import {SubscriptionPricingController} from '../controllers/SubscriptionPricingController';
import {StripeCheckoutController} from '../controllers/StripeCheckoutController';
import {authenticateToken} from '../middleware/auth';
import {requireAdmin} from '../middleware/adminAuth';

const router = express.Router();

/**
 * Subscription Pricing Routes
 */

// Public route - get available plans (optionally with referral code)
router.get('/plans', SubscriptionPricingController.getPlans);

// Public route - get current phase status
router.get('/phase', SubscriptionPricingController.getPhase);

// Protected route - get subscription access level
router.get(
  '/access',
  authenticateToken,
  require('../middleware/subscriptionAccess').getSubscriptionAccess,
);

// Protected route - create subscription (requires user authentication)
router.post(
  '/create',
  authenticateToken,
  SubscriptionPricingController.createSubscription,
);

// Protected route - create Stripe Checkout Session (web-based payment)
router.post(
  '/create-checkout-session',
  authenticateToken,
  async (req: any, res, next): Promise<any> => {
    // Check for existing active subscription
    const pool = require('../config/database').default;
    const existing = await pool.query(
      `SELECT id FROM subscriptions 
       WHERE user_id = $1 
         AND status IN ('active', 'trialing') 
       LIMIT 1`,
      [req.user.id],
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active subscription',
      });
    }
    next();
  },
  StripeCheckoutController.createCheckoutSession,
);

// Admin route - update phase status (requires admin authentication)
router.post('/phase', requireAdmin, SubscriptionPricingController.updatePhase);

export default router;
