# Subscription Pricing System - Deployment Guide

## Overview
This guide walks you through deploying the subscription pricing system to production.

## Prerequisites
- ✅ Database access (AWS RDS PostgreSQL)
- ✅ Stripe account (test and production keys)
- ✅ Backend server deployed
- ✅ Admin access to the system

## Deployment Steps

### 1. Run Database Migrations

First, ensure you have database access. Then run the migrations:

```bash
cd backend
node run-all-migrations.js
```

This will create:
- `subscription_plans` table
- `app_configuration` table
- `subscription_events` table
- New columns on `subscriptions` table

**Verify migration success:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('subscription_plans', 'app_configuration', 'subscription_events');
```

### 2. Create Stripe Products (Production)

**Important:** Switch to production mode in Stripe Dashboard first!

Run the setup script with production keys:

```bash
cd backend
# Make sure STRIPE_SECRET_KEY in .env is set to production key (sk_live_...)
node scripts/setup-stripe-products.js
```

This will create:
- **Yearly Product**
  - Promotional price: $24.99/year
  - Standard price: $34.99/year
- **Monthly Product**
  - Price: $6.99/month
- **Weekly Product**
  - Price: $2.99/week

**Save the output!** The script will display all product and price IDs.

### 3. Update Environment Variables

Update your production `.env` file with the Stripe product IDs from step 2:

```env
# Stripe Configuration (PRODUCTION)
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# These are automatically stored in database, but keep for reference
STRIPE_YEARLY_PROMO_PRICE_ID=price_xxx
STRIPE_YEARLY_STANDARD_PRICE_ID=price_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_WEEKLY_PRICE_ID=price_xxx
```

### 4. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://your-api-domain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret
6. Add it to your `.env` as `STRIPE_WEBHOOK_SECRET`

### 5. Set Initial Phase to Beta

The migration automatically sets the phase to beta. Verify:

```bash
curl https://your-api-domain.com/api/v1/subscriptions/phase
```

Expected response:
```json
{
  "success": true,
  "phase": "beta",
  "isBeta": true,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6. Test Subscription Flow

**Test in Stripe Test Mode first!**

1. Get available plans:
```bash
curl https://your-api-domain.com/api/v1/subscriptions/plans
```

2. Create a test subscription:
```bash
curl -X POST https://your-api-domain.com/api/v1/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_USER_TOKEN" \
  -d '{
    "planType": "yearly"
  }'
```

3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### 7. Verify Webhook Processing

1. Create a test subscription in Stripe Dashboard
2. Check your server logs for webhook events
3. Verify subscription was created in database:

```sql
SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
```

### 8. Deploy Mobile App Updates

Update the mobile app with the new subscription screens:

1. Ensure `SubscriptionPlansScreen` is added to navigation
2. Wrap app with `SubscriptionProvider` in `App.tsx`:

```tsx
import { SubscriptionProvider } from './src/contexts/SubscriptionContext';

export default function App() {
  return (
    <SubscriptionProvider>
      {/* Your app content */}
    </SubscriptionProvider>
  );
}
```

3. Update API URL in mobile app to point to production

### 9. Admin Phase Management

Access the phase management UI:
```
https://your-api-domain.com/admin-phase-management.html
```

Or use the API directly:
```bash
curl -X POST https://your-api-domain.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"phase": "post-beta"}'
```

### 10. Monitor and Verify

**Check these after deployment:**

- [ ] Database migrations completed successfully
- [ ] Stripe products created in production
- [ ] Webhook endpoint receiving events
- [ ] Subscriptions being created correctly
- [ ] Promotional pricing working (beta users get $24.99)
- [ ] Referral codes applying discounts
- [ ] Renewal prices set correctly ($34.99 for yearly)
- [ ] Phase switching works (beta ↔ post-beta)
- [ ] Mobile app can fetch and display plans
- [ ] Payment flow completes successfully

## Pricing Summary

### Beta Phase (Current)
- **Yearly Only**: $24.99 → renews at $34.99
- **No trials**
- **Referral discount**: $24.99 → renews at $34.99

### Post-Beta Phase
- **Yearly**: $34.99/year (7-day trial)
- **Yearly with Referral**: $24.99 → renews at $34.99 (7-day trial)
- **Monthly**: $6.99/month (7-day trial)
- **Weekly**: $2.99/week (7-day trial)

## Rollback Plan

If issues occur, you can rollback:

1. **Revert phase to beta:**
```bash
curl -X POST https://your-api-domain.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"phase": "beta"}'
```

2. **Disable webhook endpoint** in Stripe Dashboard temporarily

3. **Rollback database migration** (if needed):
```sql
-- Remove new columns
ALTER TABLE subscriptions 
  DROP COLUMN IF EXISTS promotional_price_used,
  DROP COLUMN IF EXISTS referral_code_used,
  DROP COLUMN IF EXISTS initial_price,
  DROP COLUMN IF EXISTS renewal_price;

-- Drop new tables
DROP TABLE IF EXISTS subscription_events;
DROP TABLE IF EXISTS app_configuration;
DROP TABLE IF EXISTS subscription_plans;
```

## Support and Monitoring

**Monitor these metrics:**
- Subscription creation rate
- Payment success/failure rate
- Webhook processing errors
- Phase status
- Promotional pricing usage

**Discord Notifications:**
All subscription errors and important events are sent to your configured Discord webhooks.

**Logs to watch:**
- Subscription creation attempts
- Webhook event processing
- Payment failures
- Phase changes

## Troubleshooting

### Issue: Webhook signature verification fails
**Solution:** Verify `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret in Stripe Dashboard

### Issue: Subscriptions not creating
**Solution:** Check that Stripe price IDs in database match production Stripe products

### Issue: Promotional pricing not applying
**Solution:** Verify phase is set to beta and promotional_price_id exists in subscription_plans table

### Issue: Database connection timeout
**Solution:** Ensure your server's IP is whitelisted in AWS RDS security group

## Next Steps

After successful deployment:

1. Monitor first few subscriptions closely
2. Test referral code flow with real users
3. Verify renewal pricing after first billing cycle
4. Plan transition from beta to post-beta phase
5. Set up automated monitoring and alerts

## Contact

For issues or questions:
- Check server logs
- Review Discord error notifications
- Contact: support@cooksmartapp.com
