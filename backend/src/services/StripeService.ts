import Stripe from 'stripe';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'week' | 'month' | 'year';
  features: string[];
  stripePriceId?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export class StripeService {
  private static stripeKey = process.env.STRIPE_SECRET_KEY || '';
  private static stripe: Stripe | null = null;

  private static getStripe(): Stripe {
    if (!this.stripe && this.stripeKey) {
      this.stripe = new Stripe(this.stripeKey);
    }
    if (!this.stripe) {
      throw new Error(
        'Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables.',
      );
    }
    return this.stripe;
  }

  static getPricingPlans(): PricingPlan[] {
    return [
      {
        id: 'beta-presale',
        name: 'Cook Smart Pre-Purchase in BETA Yearly',
        price: 2499, // $24.99
        interval: 'year',
        features: [
          'All features unlocked',
          'BETA discount - 30% off',
          'Lock in this price forever',
          'Support development',
          'Early access to new features',
        ],
        stripePriceId: process.env.STRIPE_BETA_PRICE_ID || '',
      },
      {
        id: 'yearly-referral',
        name: 'Cook Smart Yearly Referral',
        price: 2499, // $24.99
        interval: 'year',
        features: [
          'All features unlocked',
          'Referral discount - 30% off',
          'Lock in this price forever',
          'Support your friend',
          'Priority support',
        ],
        stripePriceId: process.env.STRIPE_YEARLY_REFERRAL_PRICE_ID || '',
      },
      {
        id: 'yearly',
        name: 'Cook Smart Yearly Full Price',
        price: 3499, // $34.99
        interval: 'year',
        features: [
          '7-day free trial',
          'Unlimited recipes',
          'Shopping lists',
          'Dietary filters',
          'Recipe ratings',
          'Priority support',
          'Best value',
        ],
        stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || '',
      },
      {
        id: 'monthly',
        name: 'Cook Smart Monthly',
        price: 699, // $6.99
        interval: 'month',
        features: [
          '7-day free trial',
          'Unlimited recipes',
          'Shopping lists',
          'Dietary filters',
          'Recipe ratings',
          'Cancel anytime',
        ],
        stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || '',
      },
      {
        id: 'weekly',
        name: 'Cook Smart Weekly',
        price: 299, // $2.99
        interval: 'week',
        features: [
          '7-day free trial',
          'Unlimited recipes',
          'Shopping lists',
          'Dietary filters',
          'Recipe ratings',
          'Most flexible',
        ],
        stripePriceId: process.env.STRIPE_WEEKLY_PRICE_ID || '',
      },
    ];
  }

  static async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: any,
  ): Promise<PaymentIntent> {
    try {
      const stripe = this.getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret || '',
      };
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  static async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
  ): Promise<Subscription> {
    try {
      const stripe = this.getStripe();
      const plan = this.getPricingPlans().find(p => p.id === planId);

      if (!plan || !plan.stripePriceId) {
        throw new Error('Invalid plan ID or missing Stripe price ID');
      }

      // Create or retrieve customer
      const customers = await stripe.customers.list({
        limit: 1,
        email: userId, // In production, use actual email
      });

      let customer: Stripe.Customer;
      if (customers.data.length > 0 && customers.data[0]) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          metadata: {userId},
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{price: plan.stripePriceId}],
        metadata: {userId, planId},
      });

      const sub = stripeSubscription as any; // Type assertion for Stripe SDK compatibility
      return {
        id: sub.id,
        userId,
        planId,
        status: sub.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true,
  ): Promise<boolean> {
    try {
      const stripe = this.getStripe();

      if (cancelAtPeriodEnd) {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      } else {
        await stripe.subscriptions.cancel(subscriptionId);
      }

      return true;
    } catch (error) {
      console.error('Stripe subscription cancellation error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  static async getSubscription(
    subscriptionId: string,
  ): Promise<Subscription | null> {
    try {
      const stripe = this.getStripe();
      const stripeSubscription =
        await stripe.subscriptions.retrieve(subscriptionId);

      const sub = stripeSubscription as any; // Type assertion for Stripe SDK compatibility
      return {
        id: sub.id,
        userId: sub.metadata?.userId || '',
        planId: sub.metadata?.planId || '',
        status: sub.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      };
    } catch (error) {
      console.error('Stripe subscription retrieval error:', error);
      return null;
    }
  }

  static async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    try {
      const stripe = this.getStripe();

      // Find customer by userId in metadata
      const customers = await stripe.customers.list({
        limit: 100,
      });

      const customer = customers.data.find(c => c.metadata.userId === userId);
      if (!customer) {
        return [];
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      });

      return subscriptions.data.map((sub: any) => ({
        // Type assertion for Stripe SDK compatibility
        id: sub.id,
        userId: sub.metadata?.userId || userId,
        planId: sub.metadata?.planId || '',
        status: sub.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }));
    } catch (error) {
      console.error('Stripe user subscriptions retrieval error:', error);
      return [];
    }
  }

  static async processWebhook(
    payload: Buffer,
    signature: string,
  ): Promise<void> {
    try {
      const stripe = this.getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn(
          'Stripe webhook secret not configured, skipping signature verification',
        );
        return;
      }

      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );

      console.log('Processing Stripe webhook:', event.type);

      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('Payment succeeded:', event.data.object.id);
          // Handle successful payment
          break;
        case 'customer.subscription.created':
          console.log('Subscription created:', event.data.object.id);
          // Handle subscription creation
          break;
        case 'customer.subscription.updated':
          console.log('Subscription updated:', event.data.object.id);
          // Handle subscription update
          break;
        case 'customer.subscription.deleted':
          console.log('Subscription canceled:', event.data.object.id);
          // Handle subscription cancellation
          break;
        case 'invoice.payment_succeeded':
          console.log('Invoice payment succeeded:', event.data.object.id);
          // Handle successful invoice payment
          break;
        case 'invoice.payment_failed':
          console.log('Invoice payment failed:', event.data.object.id);
          // Handle failed invoice payment
          break;
        default:
          console.log('Unhandled webhook type:', event.type);
      }
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      throw new Error('Webhook signature verification failed');
    }
  }

  private static calculatePeriodEnd(start: Date, interval: string): Date {
    const end = new Date(start);
    switch (interval) {
      case 'week':
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'year':
        end.setFullYear(end.getFullYear() + 1);
        break;
    }
    return end;
  }

  static isConfigured(): boolean {
    return !!this.stripeKey;
  }

  /**
   * Create subscription with promotional pricing and renewal price
   * Uses Stripe Subscription Schedules to handle price transitions
   * @param customerId - Stripe customer ID
   * @param initialPriceId - Price ID for first billing period
   * @param renewalPriceId - Price ID for subsequent billing periods
   * @param trialDays - Number of free trial days (0 for no trial)
   */
  static async createSubscriptionWithPromotion(
    customerId: string,
    initialPriceId: string,
    renewalPriceId: string,
    trialDays: number = 0,
  ): Promise<Stripe.Subscription> {
    try {
      const stripe = this.getStripe();

      // If initial and renewal prices are the same, create a regular subscription
      if (initialPriceId === renewalPriceId) {
        const subscriptionParams: any = {
          customer: customerId,
          items: [{price: initialPriceId}],
        };
        if (trialDays > 0) {
          subscriptionParams.trial_period_days = trialDays;
        }
        const subscription =
          await stripe.subscriptions.create(subscriptionParams);
        return subscription;
      }

      // Create subscription schedule for promotional → standard price transition
      const startDate =
        trialDays > 0
          ? Math.floor(Date.now() / 1000) + trialDays * 24 * 60 * 60
          : 'now';

      const schedule = await stripe.subscriptionSchedules.create({
        customer: customerId,
        start_date: startDate as any,
        end_behavior: 'release',
        phases: [
          {
            items: [{price: initialPriceId}],
            iterations: 1 as any, // Only first billing period
          },
          {
            items: [{price: renewalPriceId}],
            // iterations not specified = recurring indefinitely
          },
        ],
      } as any);

      // Retrieve the created subscription from the schedule
      if (schedule.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          schedule.subscription as string,
        );
        return subscription;
      }

      throw new Error('Failed to create subscription from schedule');
    } catch (error) {
      console.error(
        'Stripe subscription with promotion creation error:',
        error,
      );
      // Log the full error details for debugging
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error; // Throw the original error instead of a generic one
    }
  }

  /**
   * Update subscription renewal price
   * @param subscriptionId - Stripe subscription ID
   * @param newPriceId - New price ID for renewals
   */
  static async updateSubscriptionRenewalPrice(
    subscriptionId: string,
    newPriceId: string,
  ): Promise<void> {
    try {
      const stripe = this.getStripe();

      // Retrieve current subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription.items.data[0]) {
        throw new Error('Subscription has no items');
      }

      // Update the subscription item with new price
      await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'none', // Don't prorate when changing price
      });

      console.log(
        `Updated subscription ${subscriptionId} renewal price to ${newPriceId}`,
      );
    } catch (error) {
      console.error('Stripe subscription renewal price update error:', error);
      throw new Error('Failed to update subscription renewal price');
    }
  }

  /**
   * Setup subscription products in Stripe
   * This is typically run once during initial setup
   */
  static async setupSubscriptionProducts(): Promise<{
    yearlyProduct: {
      productId: string;
      promotionalPriceId: string;
      standardPriceId: string;
    };
    monthlyProduct: {
      productId: string;
      priceId: string;
    };
    weeklyProduct: {
      productId: string;
      priceId: string;
    };
  }> {
    try {
      const stripe = this.getStripe();

      // Create Yearly Product
      const yearlyProduct = await stripe.products.create({
        name: 'Cook Smart Premium - Yearly',
        description: 'Annual subscription to Cook Smart Premium features',
      });

      const yearlyPromoPrice = await stripe.prices.create({
        product: yearlyProduct.id,
        unit_amount: 2499, // $24.99
        currency: 'usd',
        recurring: {interval: 'year'},
      });

      const yearlyStandardPrice = await stripe.prices.create({
        product: yearlyProduct.id,
        unit_amount: 3499, // $34.99
        currency: 'usd',
        recurring: {interval: 'year'},
      });

      // Create Monthly Product
      const monthlyProduct = await stripe.products.create({
        name: 'Cook Smart Premium - Monthly',
        description: 'Monthly subscription to Cook Smart Premium features',
      });

      const monthlyPrice = await stripe.prices.create({
        product: monthlyProduct.id,
        unit_amount: 699, // $6.99
        currency: 'usd',
        recurring: {interval: 'month'},
      });

      // Create Weekly Product
      const weeklyProduct = await stripe.products.create({
        name: 'Cook Smart Premium - Weekly',
        description: 'Weekly subscription to Cook Smart Premium features',
      });

      const weeklyPrice = await stripe.prices.create({
        product: weeklyProduct.id,
        unit_amount: 299, // $2.99
        currency: 'usd',
        recurring: {interval: 'week'},
      });

      return {
        yearlyProduct: {
          productId: yearlyProduct.id,
          promotionalPriceId: yearlyPromoPrice.id,
          standardPriceId: yearlyStandardPrice.id,
        },
        monthlyProduct: {
          productId: monthlyProduct.id,
          priceId: monthlyPrice.id,
        },
        weeklyProduct: {
          productId: weeklyProduct.id,
          priceId: weeklyPrice.id,
        },
      };
    } catch (error) {
      console.error('Stripe product setup error:', error);
      throw new Error('Failed to setup Stripe products');
    }
  }
}
