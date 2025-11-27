# Stripe Testing Guide

## Overview

This guide walks through testing the complete Stripe payment integration for Cook Smart.

## Test Scripts

### 1. Integration Test (`test-stripe-integration.js`)

Tests the complete payment flow including:
- Stripe API configuration
- Price IDs verification
- User creation and authentication
- Checkout session creation
- Payment simulation (test mode only)
- Webhook endpoint verification
- Subscription status checking

**Run:**
```bash
cd backend
node test-stripe-integration.js
```

### 2. Webhook Test (`test-stripe-webhooks.js`)

Tests webhook handling:
- Webhook endpoint accessibility
- Webhook configuration verification
- Event simulation (test mode)
- Delivery history review

**Run:**
```bash
cd backend
node test-stripe-webhooks.js
```

## Manual Testing Steps

### Test Mode (Recommended First)

#### Step 1: Switch to Test Mode

1. Update `.env` with test keys:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

2. Create test price IDs in Stripe Dashboard (Test Mode)

3. Update webhook secret for test mode

#### Step 2: Run Automated Tests

```bash
cd backend
node test-stripe-integration.js
```

Review output for any failures.

#### Step 3: Test Payment Flow in App

1. Build and install app with test mode configuration
2. Create a test account
3. Navigate to subscription screen
4. Select a plan (Weekly recommended for testing)
5. Complete checkout with test card: `4242 4242 4242 4242`
6. Verify subscription activates

#### Step 4: Test Webhook Events

```bash
cd backend
node test-stripe-webhooks.js
```

Or use Stripe CLI:
```bash
stripe listen --forward-to https://api.cooksmartapp.com/api/webhooks/stripe
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Live Mode Testing

#### Step 1: Verify Configuration

1. Ensure live keys are in `.env`:
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

2. Verify live price IDs are configured
3. Verify webhook is configured for live mode

#### Step 2: Run Configuration Tests

```bash
cd backend
node test-stripe-integration.js
```

This will verify configuration without making payments.

#### Step 3: Test with Real Payment

⚠️ **This will charge a real card**

1. Use your own card or a test card that works in live mode
2. Complete a small payment (Weekly plan: $2.99)
3. Verify subscription activates
4. Check Stripe Dashboard for payment
5. Verify webhook events are received
6. Cancel subscription immediately if testing

#### Step 4: Test Refund (Optional)

1. Go to Stripe Dashboard → Payments
2. Find the test payment
3. Issue a full refund
4. Verify subscription status updates

## Test Cards

### Test Mode Cards

**Success:**
- `4242 4242 4242 4242` - Visa (always succeeds)
- `5555 5555 5555 4444` - Mastercard (always succeeds)

**Failure:**
- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

**Use any:**
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any postal code

### Live Mode

Use real cards only. Small amounts recommended for testing.

## Webhook Events to Test

### Critical Events

1. **checkout.session.completed**
   - Triggered when payment succeeds
   - Should create subscription in database

2. **customer.subscription.created**
   - Triggered when subscription is created
   - Should log subscription creation

3. **invoice.payment_succeeded**
   - Triggered when payment succeeds
   - Should activate subscription

4. **invoice.payment_failed**
   - Triggered when payment fails
   - Should mark subscription as past_due

5. **customer.subscription.deleted**
   - Triggered when subscription is canceled
   - Should update subscription status

### Optional Events

6. **customer.subscription.updated**
   - Triggered when subscription changes
   - Should update subscription details

7. **customer.subscription.trial_will_end**
   - Triggered 3 days before trial ends
   - Should send notification

## Verification Checklist

### Configuration

- [ ] Stripe API keys configured (test or live)
- [ ] Price IDs configured for all plans
- [ ] Webhook secret configured
- [ ] Webhook endpoint accessible from internet
- [ ] HTTPS enabled on webhook endpoint

### Payment Flow

- [ ] User can view subscription plans
- [ ] User can initiate checkout
- [ ] Checkout session creates successfully
- [ ] Payment page loads correctly
- [ ] Payment succeeds with test card
- [ ] Subscription activates after payment
- [ ] User sees active subscription in app

### Webhook Handling

- [ ] Webhook endpoint receives events
- [ ] Webhook signature verification works
- [ ] Subscription created event handled
- [ ] Payment succeeded event handled
- [ ] Payment failed event handled
- [ ] Subscription deleted event handled
- [ ] Database updates correctly

### Error Handling

- [ ] Payment failure handled gracefully
- [ ] Network errors handled
- [ ] Invalid card handled
- [ ] Duplicate subscription prevented
- [ ] Webhook failures logged

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify HTTPS is enabled
3. Check firewall/security groups allow Stripe IPs
4. Review webhook delivery attempts in Stripe Dashboard
5. Check backend logs for errors

### Payment Not Completing

1. Verify price IDs are correct
2. Check Stripe Dashboard for payment intent status
3. Review browser console for errors
4. Check network requests in browser dev tools
5. Verify API keys match environment (test/live)

### Subscription Not Activating

1. Check webhook events were received
2. Review backend logs for webhook processing
3. Verify database subscription record exists
4. Check subscription status in Stripe Dashboard
5. Ensure webhook handler updates database correctly

## Monitoring

### Stripe Dashboard

Monitor these sections:
- **Payments** - View all transactions
- **Subscriptions** - View active subscriptions
- **Webhooks** - View delivery attempts and failures
- **Logs** - View API requests and errors

### Backend Logs

Check for:
- Webhook event processing
- Database updates
- Error messages
- Payment confirmations

### Database

Verify these tables:
- `subscriptions` - Subscription records
- `subscription_transactions` - Payment history
- `subscription_events` - Webhook event log

## Test Results Documentation

After testing, document:

1. **Configuration Status**
   - Keys configured: ✅/❌
   - Prices configured: ✅/❌
   - Webhook configured: ✅/❌

2. **Payment Flow**
   - Checkout works: ✅/❌
   - Payment succeeds: ✅/❌
   - Subscription activates: ✅/❌

3. **Webhooks**
   - Events received: ✅/❌
   - Events processed: ✅/❌
   - Database updated: ✅/❌

4. **Issues Found**
   - List any issues
   - Steps to reproduce
   - Error messages

## Next Steps

After successful testing:

1. ✅ Document test results
2. ✅ Fix any issues found
3. ✅ Test again after fixes
4. ✅ Deploy to production
5. ✅ Monitor first real payments closely
6. ✅ Set up alerts for payment failures

## Support

If issues persist:
- Check Stripe documentation
- Review Stripe API logs
- Contact Stripe support
- Review backend error logs

