# Set Up LIVE Stripe Webhook - 5 Minutes

## What You Need

Your backend URL. What is it?
- If deployed on EC2: `http://your-ec2-ip:3000` or `https://api.cooksmartapp.com`
- If using ngrok for testing: `https://xxxx.ngrok.io`
- If local testing: We'll use Stripe CLI instead

---

## Option A: Production Webhook (If Backend is Deployed)

### Step 1: Go to Stripe Webhooks
https://dashboard.stripe.com/webhooks

Make sure you're in **LIVE mode** (toggle in top right).

### Step 2: Add Endpoint
1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://your-backend-url.com/api/webhooks/stripe`
   - Replace with your actual backend URL
   - Example: `https://api.cooksmartapp.com/api/webhooks/stripe`
   - Or: `http://your-ec2-ip:3000/api/webhooks/stripe`

### Step 3: Select Events
Click **"Select events"** and choose:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### Step 4: Add Endpoint
Click **"Add endpoint"**

### Step 5: Get Signing Secret
1. Click on the webhook you just created
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)

### Step 6: Update .env
Open `backend/.env` and update:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

### Step 7: Restart Backend
```bash
cd backend
npm start
```

---

## Option B: Local Testing with Stripe CLI

If your backend isn't deployed yet, use Stripe CLI for local testing:

### Step 1: Install Stripe CLI
**Windows:**
```bash
scoop install stripe
```

Or download from: https://github.com/stripe/stripe-cli/releases

### Step 2: Login to Stripe
```bash
stripe login
```

This will open your browser to authenticate.

### Step 3: Forward Webhooks to Local Backend
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook secret like: `whsec_xxxxx`

### Step 4: Copy the Secret
Add to `backend/.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 5: Keep Stripe CLI Running
Leave the `stripe listen` command running while testing.

---

## Verify Webhook is Working

### Test 1: Check Backend Endpoint
```bash
curl -X POST http://localhost:3000/api/webhooks/stripe
```

Should return 400 (expected - needs valid signature).

### Test 2: Trigger Test Event (Stripe CLI)
```bash
stripe trigger customer.subscription.created
```

Check your backend logs - should see webhook received.

---

## What's Your Backend URL?

Let me know and I can give you the exact webhook URL to use!

Options:
1. **Deployed on EC2/AWS** - Give me the URL
2. **Using ngrok** - Give me the ngrok URL
3. **Local testing only** - We'll use Stripe CLI
4. **Not deployed yet** - We'll set up for TEST mode first

