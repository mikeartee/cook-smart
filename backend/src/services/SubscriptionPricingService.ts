import pool from '../config/database';
import {PhaseManagementService} from './PhaseManagementService';
import {StripeService} from './StripeService';
import Stripe from 'stripe';

export interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  initialPrice: number;
  renewalPrice: number;
  billingInterval: string;
  trialDays: number;
  stripePriceId: string;
  stripeRenewalPriceId?: string;
  features: string[];
}

export interface PricingDecision {
  initialPriceId: string;
  renewalPriceId: string;
  initialAmount: number;
  renewalAmount: number;
  hasPromotion: boolean;
}

export interface SubscriptionResult {
  subscriptionId: string;
  clientSecret: string;
  initialPrice: number;
  renewalPrice: number;
  trialEndDate?: Date | undefined;
}

/**
 * SubscriptionPricingService
 * Manages subscription plan selection and pricing logic
 */
export class SubscriptionPricingService {
  /**
   * Get available subscription plans based on current phase
   * @param _userId - Optional user ID for personalized plans (reserved for future use)
   */
  static async getAvailablePlans(
    _userId?: number,
  ): Promise<SubscriptionPlan[]> {
    const isBeta = await PhaseManagementService.isBetaPhase();

    const query = `
      SELECT 
        id,
        plan_name,
        stripe_product_id,
        promotional_price_id,
        standard_price_id,
        billing_interval,
        trial_days
      FROM subscription_plans
      WHERE available_in_beta = $1 OR $1 = false
      ORDER BY 
        CASE billing_interval
          WHEN 'year' THEN 1
          WHEN 'month' THEN 2
          WHEN 'week' THEN 3
        END
    `;

    try {
      const result = await pool.query(query, [isBeta]);

      return result.rows.map(row => this.mapPlanToResponse(row, isBeta));
    } catch (error) {
      console.error('Error fetching available plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Determine which pricing to use based on context
   * @param planType - 'yearly', 'monthly', or 'weekly'
   * @param isBetaPhase - Whether app is in beta phase
   * @param hasReferralCode - Whether user has a valid referral code
   */
  static async determinePricing(
    planType: 'yearly' | 'monthly' | 'weekly',
    isBetaPhase: boolean,
    hasReferralCode: boolean,
  ): Promise<PricingDecision> {
    // Validate plan availability
    if (isBetaPhase && (planType === 'monthly' || planType === 'weekly')) {
      throw new Error(
        `${planType} subscriptions are not available during beta phase`,
      );
    }

    // Fetch plan from database
    const query = `
      SELECT 
        promotional_price_id,
        standard_price_id,
        billing_interval
      FROM subscription_plans
      WHERE plan_name = $1
    `;

    try {
      const result = await pool.query(query, [planType]);

      if (result.rows.length === 0) {
        throw new Error(`Subscription plan '${planType}' not found`);
      }

      const plan = result.rows[0];

      // Pricing logic
      if (planType === 'yearly') {
        // Yearly plan with promotional pricing
        if (isBetaPhase || hasReferralCode) {
          // Use promotional price for first year, standard for renewal
          return {
            initialPriceId: plan.promotional_price_id,
            renewalPriceId: plan.standard_price_id,
            initialAmount: 24.99,
            renewalAmount: 34.99,
            hasPromotion: true,
          };
        } else {
          // Standard pricing for both initial and renewal
          return {
            initialPriceId: plan.standard_price_id,
            renewalPriceId: plan.standard_price_id,
            initialAmount: 34.99,
            renewalAmount: 34.99,
            hasPromotion: false,
          };
        }
      } else if (planType === 'monthly') {
        // Monthly plan - no promotional pricing
        return {
          initialPriceId: plan.standard_price_id,
          renewalPriceId: plan.standard_price_id,
          initialAmount: 6.99,
          renewalAmount: 6.99,
          hasPromotion: false,
        };
      } else {
        // Weekly plan - no promotional pricing
        return {
          initialPriceId: plan.standard_price_id,
          renewalPriceId: plan.standard_price_id,
          initialAmount: 2.99,
          renewalAmount: 2.99,
          hasPromotion: false,
        };
      }
    } catch (error) {
      console.error('Error determining pricing:', error);
      throw error;
    }
  }

  /**
   * Map database row to SubscriptionPlan response
   */
  private static mapPlanToResponse(
    row: any,
    isBeta: boolean,
  ): SubscriptionPlan {
    const planName = row.plan_name;
    const hasPromotion = row.promotional_price_id !== null;

    // Determine pricing based on plan type
    let initialPrice: number;
    let renewalPrice: number;
    let displayName: string;
    let features: string[];

    if (planName === 'yearly') {
      initialPrice = isBeta || hasPromotion ? 24.99 : 34.99;
      renewalPrice = 34.99;
      displayName = 'Yearly Premium';
      features = [
        'Unlimited recipe access',
        'Barcode scanning',
        'Ingredient tracking',
        'Meal planning',
        'Save $40 vs monthly',
        isBeta ? 'Beta early bird pricing' : 'Best value',
      ];
    } else if (planName === 'monthly') {
      initialPrice = 6.99;
      renewalPrice = 6.99;
      displayName = 'Monthly Premium';
      features = [
        'Unlimited recipe access',
        'Barcode scanning',
        'Ingredient tracking',
        'Meal planning',
        '7-day free trial',
        'Cancel anytime',
      ];
    } else {
      // weekly
      initialPrice = 2.99;
      renewalPrice = 2.99;
      displayName = 'Weekly Premium';
      features = [
        'Unlimited recipe access',
        'Barcode scanning',
        'Ingredient tracking',
        'Meal planning',
        '7-day free trial',
        'Most flexible',
      ];
    }

    return {
      id: row.id,
      name: planName,
      displayName,
      initialPrice,
      renewalPrice,
      billingInterval: row.billing_interval,
      trialDays: row.trial_days,
      stripePriceId: row.promotional_price_id || row.standard_price_id,
      stripeRenewalPriceId: row.promotional_price_id
        ? row.standard_price_id
        : undefined,
      features,
    };
  }

  /**
   * Validate that a plan is available in the current phase
   */
  static async validatePlanAvailability(
    planType: 'yearly' | 'monthly' | 'weekly',
  ): Promise<boolean> {
    const isBeta = await PhaseManagementService.isBetaPhase();

    if (isBeta && (planType === 'monthly' || planType === 'weekly')) {
      return false;
    }

    return true;
  }

  /**
   * Create a subscription for a user
   * @param userId - User ID
   * @param planType - 'yearly', 'monthly', or 'weekly'
   * @param referralCode - Optional referral code for discount
   */
  static async createSubscription(
    userId: number,
    planType: 'yearly' | 'monthly' | 'weekly',
    referralCode?: string,
  ): Promise<SubscriptionResult> {
    try {
      // 1. Validate plan availability
      const isAvailable = await this.validatePlanAvailability(planType);
      if (!isAvailable) {
        throw new Error(
          `${planType} subscriptions are not available in beta phase`,
        );
      }

      // 2. Get current phase
      const isBeta = await PhaseManagementService.isBetaPhase();

      // 3. Validate referral code if provided
      let hasValidReferral = false;
      if (referralCode) {
        hasValidReferral = await this.validateReferralCode(
          referralCode,
          userId,
        );
      }

      // 4. Determine pricing
      const pricing = await this.determinePricing(
        planType,
        isBeta,
        hasValidReferral,
      );

      // 5. Get user email for Stripe customer
      const userQuery = 'SELECT email FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const userEmail = userResult.rows[0].email;

      // 6. Create or retrieve Stripe customer
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
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
          metadata: {userId: userId.toString()},
        });
      }

      // 7. Get trial days from plan
      const planQuery =
        'SELECT trial_days FROM subscription_plans WHERE plan_name = $1';
      const planResult = await pool.query(planQuery, [planType]);
      const trialDays = planResult.rows[0]?.trial_days || 0;

      // 8. Create subscription with Stripe
      const subscription = await StripeService.createSubscriptionWithPromotion(
        customer.id,
        pricing.initialPriceId,
        pricing.renewalPriceId,
        trialDays,
      );

      // 9. Calculate trial end date
      let trialEndDate: Date | undefined;
      if (trialDays > 0) {
        trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      }

      // 10. Store subscription in database
      const sub = subscription as any; // Type assertion for Stripe SDK compatibility
      const periodStart = sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : new Date();
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : new Date();

      await this.storeSubscription(
        subscription.id,
        userId,
        planType,
        pricing.hasPromotion,
        referralCode,
        pricing.initialAmount,
        pricing.renewalAmount,
        subscription.status,
        periodStart,
        periodEnd,
      );

      // 11. Credit referrer if referral code was used
      if (hasValidReferral && referralCode) {
        await this.creditReferrer(referralCode, userId);
      }

      // 12. Get client secret for payment confirmation
      const latestInvoice = subscription.latest_invoice as any;
      let clientSecret = '';

      if (latestInvoice && typeof latestInvoice !== 'string') {
        const paymentIntent = latestInvoice.payment_intent as any;
        if (paymentIntent && typeof paymentIntent !== 'string') {
          clientSecret = paymentIntent.client_secret || '';
        }
      }

      return {
        subscriptionId: subscription.id,
        clientSecret,
        initialPrice: pricing.initialAmount,
        renewalPrice: pricing.renewalAmount,
        trialEndDate,
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Validate referral code
   */
  private static async validateReferralCode(
    referralCode: string,
    userId: number,
  ): Promise<boolean> {
    try {
      // Check if referral code exists and is active
      const query = `
        SELECT id, user_id, is_active 
        FROM referral_codes 
        WHERE code = $1
      `;
      const result = await pool.query(query, [referralCode]);

      if (result.rows.length === 0) {
        return false;
      }

      const referral = result.rows[0];

      // Check if active
      if (!referral.is_active) {
        return false;
      }

      // Check if user is not referring themselves
      if (referral.user_id === userId) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  /**
   * Store subscription in database
   */
  private static async storeSubscription(
    stripeSubscriptionId: string,
    userId: number,
    planType: string,
    promotionalPriceUsed: boolean,
    referralCodeUsed: string | undefined,
    initialPrice: number,
    renewalPrice: number,
    status: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
  ): Promise<void> {
    const query = `
      INSERT INTO subscriptions (
        id, user_id, plan_id, status,
        current_period_start, current_period_end,
        promotional_price_used, referral_code_used,
        initial_price, renewal_price,
        cancel_at_period_end, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
    `;

    await pool.query(query, [
      stripeSubscriptionId,
      userId,
      planType,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      promotionalPriceUsed,
      referralCodeUsed || null,
      initialPrice,
      renewalPrice,
      false, // cancel_at_period_end
    ]);

    // Update user subscription status
    await pool.query(
      `UPDATE users 
       SET subscription_status = $1, subscription_expires_at = $2 
       WHERE id = $3`,
      [status, currentPeriodEnd, userId],
    );
  }

  /**
   * Credit referrer account
   */
  private static async creditReferrer(
    referralCode: string,
    newUserId: number,
  ): Promise<void> {
    try {
      // Get referrer user ID
      const referralQuery =
        'SELECT user_id FROM referral_codes WHERE code = $1';
      const referralResult = await pool.query(referralQuery, [referralCode]);

      if (referralResult.rows.length === 0) {
        return;
      }

      const referrerId = referralResult.rows[0].user_id;

      // Record referral usage
      const usageQuery = `
        INSERT INTO referral_usage (referral_code, referred_user_id, created_at)
        VALUES ($1, $2, NOW())
      `;
      await pool.query(usageQuery, [referralCode, newUserId]);

      // Increment referral count
      const updateQuery = `
        UPDATE referral_codes 
        SET usage_count = usage_count + 1 
        WHERE code = $1
      `;
      await pool.query(updateQuery, [referralCode]);

      console.log(
        `Credited referrer ${referrerId} for user ${newUserId} using code ${referralCode}`,
      );
    } catch (error) {
      console.error('Error crediting referrer:', error);
      // Don't throw - referral credit failure shouldn't block subscription
    }
  }
}
