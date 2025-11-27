import {Request, Response} from 'express';
import Stripe from 'stripe';
import pool from '../config/database';
import {PhaseManagementService} from '../services/PhaseManagementService';
import {SubscriptionPricingService} from '../services/SubscriptionPricingService';

// User type is already declared in SubscriptionPricingController
// No need to redeclare it here

/**
 * StripeCheckoutController
 * Handles Stripe Checkout Session creation for web-based payments
 */
export class StripeCheckoutController {
  /**
   * POST /api/subscriptions/create-checkout-session
   * Create a Stripe Checkout Session for subscription payment
   */
  static async createCheckoutSession(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User must be authenticated',
        });
        return;
      }

      const {planType, referralCode} = req.body;

      // Validate plan type
      if (!planType || !['yearly', 'monthly', 'weekly'].includes(planType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid plan type',
          message: 'Plan type must be yearly, monthly, or weekly',
        });
        return;
      }

      // Get current phase
      const isBeta = await PhaseManagementService.isBetaPhase();

      // Validate plan availability
      if (isBeta && (planType === 'monthly' || planType === 'weekly')) {
        res.status(400).json({
          success: false,
          error: 'Plan not available',
          message: `${planType} subscriptions are not available during beta phase`,
        });
        return;
      }

      // Determine pricing (referral validation happens inside determinePricing)
      const hasValidReferral = referralCode ? true : false; // Simplified for checkout
      const pricing = await SubscriptionPricingService.determinePricing(
        planType,
        isBeta,
        hasValidReferral,
      );

      // Get user email
      const userQuery = 'SELECT email FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      const userEmail = userResult.rows[0].email;

      // Initialize Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

      // Create or retrieve Stripe customer
      let customer: Stripe.Customer;
      const existingCustomers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
        customer = existingCustomers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: userEmail,
          metadata: {
            userId: String(userId),
          },
        });
      }

      // Get trial days from plan
      const planQuery =
        'SELECT trial_days FROM subscription_plans WHERE plan_name = $1';
      const planResult = await pool.query(planQuery, [planType]);
      const trialDays = planResult.rows[0]?.trial_days || 0;

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: pricing.initialPriceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: trialDays > 0 ? trialDays : undefined,
          metadata: {
            userId: String(userId),
            planType,
            hasPromotion: pricing.hasPromotion.toString(),
            referralCode: referralCode || '',
            renewalPriceId: pricing.renewalPriceId,
          },
        },
        success_url: `${process.env.APP_URL || 'cooksmartapp://'}payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL || 'cooksmartapp://'}payment-cancelled`,
        metadata: {
          userId: String(userId),
          planType,
        },
      });

      res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const statusCode = errorMessage.includes('not available') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create checkout session',
        message: errorMessage,
      });
    }
  }
}
