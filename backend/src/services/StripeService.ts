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
  
  static getPricingPlans(): PricingPlan[] {
    return [
      {
        id: 'weekly',
        name: 'Weekly Plan',
        price: 299, // cents
        interval: 'week',
        features: ['Unlimited recipes', 'Shopping lists', 'Dietary filters', 'Recipe ratings'],
        stripePriceId: process.env.STRIPE_WEEKLY_PRICE_ID
      },
      {
        id: 'monthly',
        name: 'Monthly Plan',
        price: 699, // cents
        interval: 'month',
        features: ['Unlimited recipes', 'Shopping lists', 'Dietary filters', 'Recipe ratings', 'Priority support'],
        stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID
      },
      {
        id: 'yearly',
        name: 'Yearly Plan',
        price: 3499, // cents
        interval: 'year',
        features: ['Unlimited recipes', 'Shopping lists', 'Dietary filters', 'Recipe ratings', 'Priority support', 'Advanced analytics'],
        stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID
      },
      {
        id: 'beta-presale',
        name: 'BETA Pre-Purchase',
        price: 2499, // cents (30% off yearly)
        interval: 'year',
        features: ['All yearly features', '30% discount', 'Lifetime BETA access', 'Early feature access'],
        stripePriceId: process.env.STRIPE_BETA_PRICE_ID
      }
    ];
  }

  static async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any): Promise<PaymentIntent> {
    // Mock Stripe payment intent creation
    const paymentIntent: PaymentIntent = {
      id: `pi_${Date.now()}`,
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log('Created payment intent:', paymentIntent);
    return paymentIntent;
  }

  static async createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<Subscription> {
    const plan = this.getPricingPlans().find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid plan ID');
    }

    // Mock subscription creation
    const subscription: Subscription = {
      id: `sub_${Date.now()}`,
      userId,
      planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: this.calculatePeriodEnd(new Date(), plan.interval),
      cancelAtPeriodEnd: false
    };

    console.log('Created subscription:', subscription);
    return subscription;
  }

  static async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<boolean> {
    // Mock subscription cancellation
    console.log(`Canceling subscription ${subscriptionId}, at period end: ${cancelAtPeriodEnd}`);
    return true;
  }

  static async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    // Mock subscription retrieval
    return {
      id: subscriptionId,
      userId: 'user123',
      planId: 'monthly',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false
    };
  }

  static async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    // Mock user subscriptions retrieval
    return [
      {
        id: `sub_${userId}`,
        userId,
        planId: 'monthly',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false
      }
    ];
  }

  static async processWebhook(payload: any, signature: string): Promise<void> {
    // Mock webhook processing
    console.log('Processing Stripe webhook:', payload.type);
    
    switch (payload.type) {
      case 'payment_intent.succeeded':
        console.log('Payment succeeded:', payload.data.object.id);
        break;
      case 'customer.subscription.created':
        console.log('Subscription created:', payload.data.object.id);
        break;
      case 'customer.subscription.deleted':
        console.log('Subscription canceled:', payload.data.object.id);
        break;
      default:
        console.log('Unhandled webhook type:', payload.type);
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
}