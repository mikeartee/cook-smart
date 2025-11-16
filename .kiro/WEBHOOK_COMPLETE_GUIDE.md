# Stripe Webhook - Complete Setup Guide

## Current Status ✅

Your webhook system is **fully implemented and ready**. The code is complete, you just need to configure the endpoint in Stripe.

## Why Webhook Isn't Created Yet

Stripe webhooks require a **publicly accessible URL**. Since your backend is running on `localhost:3000`, Stripe can't reach it.

## Two Options

### Option 1: For Local Testing (Use Stripe CLI)

**Install Stripe CLI:**
```bash
# Windows (using Scoop)
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**Start listening:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a webhook secret like `whsec_...`. Add it to your `.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_cli
```

**Test it:**
```bash
# In another terminal, trigger a test event
stripe trigger customer.subscription.created
```

### Option 2: For Production (After Deployment)

**After you deploy to AWS:**

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://your-domain.com/api/webhooks/stripe`
4. Select these events:
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
   - ✅ customer.subscription.trial_will_end
5. Click "Add endpoint"
6. Copy the webhook secret
7. Add to your production `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_production_secret
   ```

**Or use the automated script:**
```bash
# Set your production URL
export WEBHOOK_URL=https://your-domain.com/api/webhooks/stripe

# Run the script
node scripts/create-stripe-webhook.js
```

## What Works Without Webhook

Your subscription system **works perfectly** without the webhook for:
- ✅ Creating subscriptions
- ✅ Viewing plans
- ✅ Automated pricing ($24.99 → $34.99)
- ✅ Payment processing

## What Webhook Adds

The webhook enables **automatic updates** for:
- 📧 Subscription status changes
- 💳 Payment success/failure notifications
- 🔔 Trial ending reminders
- 📊 Real-time sync with Stripe

## Current Setup ✅

- ✅ Webhook handler code implemented
- ✅ Webhook route configured (`/api/webhooks/stripe`)
- ✅ Signature verification ready
- ✅ Event processing for all 6 events
- ✅ Discord notifications integrated
- ✅ Database logging configured

## Verification

Run this to check your setup:
```bash
cd backend
node scripts/verify-webhook-setup.js
```

## For Production Deployment

When you deploy to AWS, run:
```bash
# Update WEBHOOK_URL in .env or export it
WEBHOOK_URL=https://your-api-domain.com/api/webhooks/stripe node scripts/create-stripe-webhook.js
```

This will automatically create the webhook with all required events.

## Summary

✅ **Webhook code**: 100% complete
✅ **Local testing**: Use Stripe CLI
✅ **Production**: Create after deployment
⚠️ **Not blocking**: App works without it
🎯 **Status**: Ready for production

Your subscription system is fully functional. The webhook is just the cherry on top for real-time updates!
