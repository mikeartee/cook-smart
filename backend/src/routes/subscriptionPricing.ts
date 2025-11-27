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

// Protected route - get current user's subscription (if method exists)
// router.get(
//   '/me',
//   authenticateToken,
//   SubscriptionPricingController.getMySubscription,
// );

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
  StripeCheckoutController.createCheckoutSession,
);

// Admin route - update phase status (requires admin authentication)
router.post('/phase', requireAdmin, SubscriptionPricingController.updatePhase);

export default router;
