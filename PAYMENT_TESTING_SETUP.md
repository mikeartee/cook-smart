# Payment Testing Setup - DO THIS FIRST! 🚨

## ⚠️ CRITICAL: You Have LIVE Keys Active!

Your `.env` file has **LIVE Stripe keys** which means any test payments will charge REAL MONEY!

We need to switch to TEST mode first.

---

## Step 1: Get Your TEST Mode Keys (5 minutes)

### Go to Stripe Dashboard:
https://dashboard.stripe.com/test/apikeys

### Toggle to TEST MODE:
- Look for the toggle switch in top right
- Make sure it says "Test mode" (not "Live mode")

### Copy Your TEST Keys:
1. **Publishable key** (starts with `pk_test_`)
2. **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### Update backend/.env:
```bash
# Replace these lines:
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE
```

---

## Step 2: Create Test Products (10 minutes)

### Go to Products (in TEST mode):
https://dashboard.stripe.com/test/products

### Create 5 Products:

#### Product 1: Weekly Plan
- Name: `Cook Smart Weekly`
- Price: `$2.99`
- Billing: `Weekly`
- Click "Add product"
- **Copy the Price ID** (starts with `price_`)
- Save as: `STRIPE_WEEKLY_PRICE_ID=price_xxxxx`

#### Product 2: Monthly Plan
- Name: `Cook Smart Monthly`
- Price: `$6.99`
- Billing: `Monthly`
- **Copy the Price ID**
- Save as: `STRIPE_MONTHLY_PRICE_ID=price_xxxxx`

#### Product 3: Yearly Plan (Full Price)
- Name: `Cook Smart Yearly`
- Price: `$34.99`
- Billing: `Yearly`
- **Copy the Price ID**
- Save as: `STRIPE_YEARLY_PRICE_ID=price_xxxxx`

#### Product 4: BETA Pre-Purchase
- Name: `Cook Smart BETA Pre-Purchase`
- Price: `$24.99`
- Billing: `Yearly`
- **Copy the Price ID**
- Save as: `STRIPE_BETA_PRICE_ID=price_xxxxx`

#### Product 5: Yearly Referral
- Name: `Cook Smart Yearly Referral`
- Price: `$24.99`
- Billing: `Yearly`
- **Copy the Price ID**
- Save as: `STRIPE_YEARLY_REFERRAL_PRICE_ID=price_xxxxx`

---

## Step 3: Update .env File

Open `backend/.env` and update these lines:

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Stripe Product Price IDs (from Step 2)
STRIPE_BETA_PRICE_ID=price_xxxxx
STRIPE_YEARLY_REFERRAL_PRICE_ID=price_xxxxx
STRIPE_YEARLY_PRICE_ID=price_xxxxx
STRIPE_MONTHLY_PRICE_ID=price_xxxxx
STRIPE_WEEKLY_PRICE_ID=price_xxxxx
```

---

## Step 4: Set Up Webhook (10 minutes)

### Go to Webhooks:
https://dashboard.stripe.com/test/webhooks

### Add Endpoint:
1. Click "Add endpoint"
2. **Endpoint URL**: `https://your-backend-url.com/api/webhooks/stripe`
   - Replace with your actual backend URL
   - Example: `https://api.cooksmartapp.com/api/webhooks/stripe`
3. **Description**: `Cook Smart Payment Webhooks`
4. **Events to send**: Select these:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`

5. Click "Add endpoint"
6. **Copy the Signing Secret** (starts with `whsec_`)
7. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxxxx`

---

## Step 5: Restart Backend

```bash
cd backend
npm start
```

---

## Step 6: Verify Setup

### Test 1: Check if backend can connect to Stripe
```bash
curl http://localhost:3000/api/subscriptions/plans
```

Should return your 5 plans with price IDs.

### Test 2: Check webhook endpoint
```bash
curl http://localhost:3000/api/webhooks/stripe
```

Should return 400 (expected - needs valid webhook signature).

---

## ✅ Ready to Test When:

- ✅ TEST mode keys in `.env`
- ✅ 5 products created in Stripe
- ✅ All 5 price IDs in `.env`
- ✅ Webhook endpoint configured
- ✅ Webhook secret in `.env`
- ✅ Backend restarted

---

## 🧪 Test Cards to Use

Once setup is complete, use these test cards:

### Successful Payment:
- Card: `4242 4242 4242 4242`
- Expiry: `12/25`
- CVC: `123`

### Declined Card:
- Card: `4000 0000 0000 0002`

### Insufficient Funds:
- Card: `4000 0000 0000 9995`

### Expired Card:
- Card: `4000 0000 0000 0069`

More test cards: https://stripe.com/docs/testing

---

## 🚨 IMPORTANT REMINDERS

1. **NEVER test with LIVE keys** - you'll charge real money!
2. **Always use TEST mode** for development
3. **Switch to LIVE mode** only when ready for production
4. **Test thoroughly** before going live

---

## Need Help?

Let me know when you've completed each step and I'll help verify everything is working!

