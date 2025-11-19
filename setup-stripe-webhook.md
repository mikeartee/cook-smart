# Stripe Webhook Setup Guide

## Step 1: Create Webhook in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: `http://3.237.38.24/api/webhooks/stripe`
4. Click "Select events"
5. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click "Add events"
7. Click "Add endpoint"

## Step 2: Copy Webhook Secret

After creating the endpoint:
1. Click on the webhook you just created
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)

## Step 3: Add Secret to EC2

Run this command (replace YOUR_SECRET with the actual secret):

```powershell
ssh -i "$HOME\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd ~/cook-smart-backend && echo 'STRIPE_WEBHOOK_SECRET=YOUR_SECRET' >> .env && pm2 restart cook-smart-backend"
```

## Step 4: Test Webhook

In Stripe Dashboard:
1. Go to your webhook
2. Click "Send test webhook"
3. Select any event type
4. Click "Send test webhook"
5. Check that it shows "Success"

Done! Your webhook is configured.
