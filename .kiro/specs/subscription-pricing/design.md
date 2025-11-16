# Subscription Pricing System Design

## Overview

The subscription pricing system manages tiered subscription plans with promotional pricing for beta users and referrals. It integrates with Stripe for payment processing and implements logic to handle initial promotional pricing with standard renewal rates. The system provides phase-based availability (beta vs post-beta) and ensures proper price transitions during subscription renewals.

## Architecture

### High-Level Components

```
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Subscription API Layer             │
│  - Get Available Plans              │
│  - Create Subscription              │
│  - Validate Referral Code           │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Subscription Service               │
│  - Phase Management                 │
│  - Price Selection Logic            │
│  - Renewal Price Configuration      │
└────────┬────────────────────────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Stripe       │ │ Database     │ │ Referral     │
│ Service      │ │ (PostgreSQL) │ │ Service      │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Database Schema Extensions

**subscriptions table** (existing, add columns):
```sql
- promotional_price_used: BOOLEAN (tracks if user got promotional pricing)
- referral_code_used: VARCHAR(50) (tracks which referral code was used)
- initial_price: DECIMAL(10,2) (price paid initially)
- renewal_price: DECIMAL(10,2) (price for renewals)
```

**subscription_plans table** (new):
```sql
- id: SERIAL PRIMARY KEY
- plan_name: VARCHAR(50) (yearly, monthly, weekly)
- stripe_product_id: VARCHAR(100)
- promotional_price_id: VARCHAR(100) (for $24.99 yearly)
- standard_price_id: VARCHAR(100) (for $34.99 yearly, $6.99 monthly, $2.99 weekly)
- billing_interval: VARCHAR(20) (year, month, week)
- available_in_beta: BOOLEAN
- trial_days: INTEGER
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**app_configuration table** (new):
```sql
- id: SERIAL PRIMARY KEY
- config_key: VARCHAR(50) UNIQUE (e.g., 'beta_phase')
- config_value: VARCHAR(255)
- updated_by: INTEGER (admin user id)
- updated_at: TIMESTAMP
```

## Components and Interfaces

### 1. SubscriptionPricingService

**Purpose**: Manages subscription plan selection, pricing logic, and Stripe integration

**Methods**:

```typescript
interface SubscriptionPricingService {
  // Get available subscription plans based on current phase
  getAvailablePlans(userId?: number): Promise<SubscriptionPlan[]>;
  
  // Create a subscription with appropriate pricing
  createSubscription(
    userId: number,
    planType: 'yearly' | 'monthly' | 'weekly',
    referralCode?: string
  ): Promise<SubscriptionResult>;
  
  // Determine which price to use based on context
  determinePricing(
    planType: string,
    isBetaPhase: boolean,
    hasReferralCode: boolean
  ): PricingDecision;
  
  // Initialize Stripe products and prices
  initializeStripeProducts(): Promise<void>;
  
  // Handle subscription renewal with correct pricing
  handleSubscriptionRenewal(subscriptionId: string): Promise<void>;
}

interface SubscriptionPlan {
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

interface PricingDecision {
  initialPriceId: string;
  renewalPriceId: string;
  initialAmount: number;
  renewalAmount: number;
  hasPromotion: boolean;
}

interface SubscriptionResult {
  subscriptionId: string;
  clientSecret: string;
  initialPrice: number;
  renewalPrice: number;
  trialEndDate?: Date;
}
```

### 2. PhaseManagementService

**Purpose**: Manages beta/post-beta phase configuration

**Methods**:

```typescript
interface PhaseManagementService {
  // Check if app is in beta phase
  isBetaPhase(): Promise<boolean>;
  
  // Update phase status (admin only)
  setPhase(phase: 'beta' | 'post-beta', adminId: number): Promise<void>;
  
  // Get phase configuration
  getPhaseConfig(): Promise<PhaseConfig>;
}

interface PhaseConfig {
  isBeta: boolean;
  updatedAt: Date;
  updatedBy: number;
}
```

### 3. StripeService Extensions

**Purpose**: Handle Stripe-specific subscription operations with promotional pricing

**New Methods**:

```typescript
interface StripeServiceExtensions {
  // Create subscription with promotional pricing and renewal price
  createSubscriptionWithPromotion(
    customerId: string,
    initialPriceId: string,
    renewalPriceId: string,
    trialDays?: number
  ): Promise<Stripe.Subscription>;
  
  // Create or retrieve Stripe products and prices
  setupSubscriptionProducts(): Promise<ProductSetup>;
  
  // Update subscription renewal price
  updateSubscriptionRenewalPrice(
    subscriptionId: string,
    newPriceId: string
  ): Promise<void>;
}

interface ProductSetup {
  yearlyProduct: {
    productId: string;
    promotionalPriceId: string; // $24.99
    standardPriceId: string;    // $34.99
  };
  monthlyProduct: {
    productId: string;
    priceId: string;            // $6.99
  };
  weeklyProduct: {
    productId: string;
    priceId: string;            // $2.99
  };
}
```

### 4. API Endpoints

**GET /api/subscriptions/plans**
- Returns available subscription plans based on current phase
- Query params: `referralCode` (optional)
- Response: Array of SubscriptionPlan objects

**POST /api/subscriptions/create**
- Creates a new subscription
- Body: `{ planType, referralCode? }`
- Response: SubscriptionResult with client secret for payment

**GET /api/subscriptions/phase**
- Returns current phase status
- Response: `{ isBeta: boolean }`

**POST /api/admin/subscriptions/phase** (admin only)
- Updates phase status
- Body: `{ phase: 'beta' | 'post-beta' }`
- Response: Updated phase config

**POST /api/webhooks/stripe**
- Handles Stripe webhook events
- Processes subscription renewals and updates

## Data Models

### SubscriptionPlan Model

```typescript
class SubscriptionPlan {
  id: number;
  planName: string;
  stripeProductId: string;
  promotionalPriceId: string | null;
  standardPriceId: string;
  billingInterval: 'year' | 'month' | 'week';
  availableInBeta: boolean;
  trialDays: number;
  createdAt: Date;
  updatedAt: Date;
  
  static async getAvailablePlans(isBeta: boolean): Promise<SubscriptionPlan[]>;
  static async findByName(name: string): Promise<SubscriptionPlan | null>;
}
```

### Subscription Model Extensions

```typescript
// Add to existing Subscription model
class Subscription {
  // ... existing fields
  promotionalPriceUsed: boolean;
  referralCodeUsed: string | null;
  initialPrice: number;
  renewalPrice: number;
  
  async updateRenewalPrice(newPrice: number): Promise<void>;
  async applyPromotion(referralCode?: string): Promise<void>;
}
```

## Error Handling

### Error Types

1. **InvalidPhaseError**: Thrown when trying to access unavailable subscription tiers
2. **InvalidReferralCodeError**: Thrown when referral code is invalid or expired
3. **StripeProductSetupError**: Thrown when Stripe product initialization fails
4. **SubscriptionCreationError**: Thrown when subscription creation fails
5. **RenewalPriceUpdateError**: Thrown when renewal price update fails

### Error Responses

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  message: string;
  details?: any;
}
```

**Example Error Codes**:
- `INVALID_PHASE`: Subscription tier not available in current phase
- `INVALID_REFERRAL`: Referral code is invalid or expired
- `STRIPE_ERROR`: Stripe API error occurred
- `SUBSCRIPTION_EXISTS`: User already has an active subscription
- `PAYMENT_FAILED`: Payment processing failed

## Pricing Logic Flow

### Beta Phase Subscription Creation

```
1. User requests subscription
2. Check phase → isBeta = true
3. Check referral code → N/A (all beta users get $24.99)
4. Select pricing:
   - initialPriceId = promotional ($24.99)
   - renewalPriceId = standard ($34.99)
5. Create Stripe subscription with schedule:
   - Period 1: $24.99 (1 year)
   - Period 2+: $34.99 (recurring)
6. Store subscription with promotional flag
7. Return client secret for payment
```

### Post-Beta Subscription with Referral

```
1. User requests yearly subscription with referral code
2. Check phase → isBeta = false
3. Validate referral code → valid
4. Select pricing:
   - initialPriceId = promotional ($24.99)
   - renewalPriceId = standard ($34.99)
   - trialDays = 7
5. Create Stripe subscription with schedule:
   - Trial: 7 days (free)
   - Period 1: $24.99 (1 year)
   - Period 2+: $34.99 (recurring)
6. Store subscription with referral code
7. Credit referrer account
8. Return client secret
```

### Post-Beta Subscription without Referral

```
1. User requests subscription (yearly/monthly/weekly)
2. Check phase → isBeta = false
3. No referral code
4. Select pricing:
   - initialPriceId = standard price
   - renewalPriceId = standard price
   - trialDays = 7
5. Create Stripe subscription:
   - Trial: 7 days (free)
   - Recurring: standard price
6. Store subscription
7. Return client secret
```

## Stripe Integration Details

### Product Setup in Stripe

**Yearly Product**:
- Product Name: "Cook Smart Premium - Yearly"
- Prices:
  - Promotional: $24.99/year (recurring=false, one-time)
  - Standard: $34.99/year (recurring=true)

**Monthly Product**:
- Product Name: "Cook Smart Premium - Monthly"
- Price: $6.99/month (recurring=true)

**Weekly Product**:
- Product Name: "Cook Smart Premium - Weekly"
- Price: $2.99/week (recurring=true)

### Subscription Schedule for Promotional Pricing

For users getting promotional pricing ($24.99), use Stripe Subscription Schedules:

```typescript
const schedule = await stripe.subscriptionSchedules.create({
  customer: customerId,
  start_date: 'now',
  end_behavior: 'release',
  phases: [
    {
      items: [{ price: promotionalPriceId }],
      iterations: 1, // Only first year
    },
    {
      items: [{ price: standardPriceId }],
      iterations: null, // Recurring indefinitely
    },
  ],
});
```

### Webhook Handling

**Events to Handle**:

1. `customer.subscription.created`: Log new subscription
2. `customer.subscription.updated`: Update subscription status
3. `invoice.payment_succeeded`: Confirm payment, activate subscription
4. `invoice.payment_failed`: Notify user, suspend access
5. `customer.subscription.deleted`: Cancel subscription, revoke access
6. `customer.subscription.trial_will_end`: Notify user 3 days before trial ends

## Testing Strategy

### Unit Tests

1. **PricingLogic Tests**:
   - Test beta phase pricing selection
   - Test post-beta pricing selection
   - Test referral code pricing application
   - Test renewal price calculation

2. **Phase Management Tests**:
   - Test phase status retrieval
   - Test phase status updates
   - Test plan availability based on phase

3. **Stripe Integration Tests**:
   - Mock Stripe API calls
   - Test subscription creation with schedules
   - Test webhook event processing
   - Test error handling for Stripe failures

### Integration Tests

1. **End-to-End Subscription Flow**:
   - Beta user subscribes → verify $24.99 charged, $34.99 renewal set
   - Post-beta user with referral → verify trial, $24.99 first year, $34.99 renewal
   - Post-beta user without referral → verify trial, $34.99 recurring

2. **Phase Transition Tests**:
   - Switch from beta to post-beta → verify plan availability changes
   - Verify existing subscriptions unaffected by phase change

3. **Renewal Tests**:
   - Simulate subscription renewal → verify correct price charged
   - Test promotional subscription renewal → verify $34.99 charged

### Manual Testing Checklist

1. Create Stripe test products and prices
2. Test beta subscription purchase flow
3. Test referral code validation and application
4. Test phase switching (beta ↔ post-beta)
5. Test subscription renewal with Stripe test clock
6. Verify webhook processing for all events
7. Test error scenarios (invalid referral, payment failure, etc.)

## Security Considerations

1. **Admin-Only Phase Management**: Only authenticated admins can change phase status
2. **Referral Code Validation**: Validate referral codes server-side to prevent manipulation
3. **Price Verification**: Always verify prices server-side, never trust client input
4. **Webhook Signature Verification**: Verify Stripe webhook signatures to prevent spoofing
5. **Subscription Ownership**: Verify user owns subscription before allowing modifications

## Performance Considerations

1. **Cache Phase Status**: Cache beta/post-beta status with 5-minute TTL
2. **Cache Subscription Plans**: Cache available plans with 10-minute TTL
3. **Async Webhook Processing**: Process webhooks asynchronously to avoid timeouts
4. **Database Indexing**: Index subscriptions by user_id, stripe_subscription_id, status

## Migration Strategy

1. Create new database tables (subscription_plans, app_configuration)
2. Add new columns to subscriptions table
3. Initialize Stripe products and prices
4. Seed subscription_plans table with product/price IDs
5. Set initial phase to 'beta' in app_configuration
6. Deploy backend changes
7. Deploy mobile app with new subscription UI
8. Monitor Stripe webhooks and subscription creation
