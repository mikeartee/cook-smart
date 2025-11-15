import { Router, Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = Router();

// Get pricing plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = StripeService.getPricingPlans();
    return res.json({ success: true, plans });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to get pricing plans' });
  }
});

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { planId } = req.body;
    const plans = StripeService.getPricingPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      return res.status(400).json({ success: false, error: 'Invalid plan ID' });
    }

    const paymentIntent = await StripeService.createPaymentIntent(plan.price, 'usd', {
      planId,
      userId: req.user?.id
    });

    return res.json({ success: true, paymentIntent });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// Create subscription
router.post('/subscribe', authenticateToken, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const subscription = await StripeService.createSubscription(userId, planId, paymentMethodId);
    
    // Store subscription in database
    await pool.query(
      'INSERT INTO subscriptions (id, user_id, plan_id, status, current_period_start, current_period_end, cancel_at_period_end) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [subscription.id, subscription.userId, subscription.planId, subscription.status, 
       subscription.currentPeriodStart, subscription.currentPeriodEnd, subscription.cancelAtPeriodEnd]
    );

    return res.json({ success: true, subscription });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create subscription' });
  }
});

// Get user subscriptions
router.get('/subscriptions', authenticateToken, async (req: Request & { user?: any }, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    return res.json({ success: true, subscriptions: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to get subscriptions' });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req: Request & { user?: any }, res: Response) => {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = req.body;
    const userId = req.user?.id;

    // Verify subscription belongs to user
    const result = await pool.query(
      'SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2',
      [subscriptionId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }

    await StripeService.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
    
    // Update database
    await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = $1, status = $2 WHERE id = $3',
      [cancelAtPeriodEnd, cancelAtPeriodEnd ? 'active' : 'canceled', subscriptionId]
    );

    return res.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await StripeService.processWebhook(req.body, signature);
    return res.json({ received: true });
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Webhook processing failed' });
  }
});

export default router;
