# Set Up Stripe Webhook - Your Exact Steps

## Your Backend URL
**Production:** `http://3.237.38.24:3000`

---

## Step 1: Add Webhook in Stripe Dashboard (3 minutes)

### Go to Webhooks:
https://dashboard.stripe.com/webhooks

**Make sure you're in LIVE mode** (toggle in top right)

### Click "Add endpoint"

### Enter This Exact URL:
```
http://3.237.38.24:3000/api/webhooks/stripe
```

### Select These Events:
Click "Select events" and choose:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### Click "Add endpoint"

---

## Step 2: Get Signing Secret (1 minute)

1. Click on the webhook you just created
2. In the "Signing secret" section, click **"Reveal"**
3. Copy the secret (starts with `whsec_`)

---

## Step 3: Update .env on EC2 (2 minutes)

### SSH into your EC2 server:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@3.237.38.24
```

### Edit the .env file:
```bash
cd /path/to/backend
nano .env
```

### Update this line:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

Replace `whsec_YOUR_ACTUAL_SECRET_HERE` with the secret you copied.

### Save and exit:
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter`

---

## Step 4: Restart Backend (1 minute)

```bash
pm2 restart all
# or
npm start
```

---

## Step 5: Test Webhook (1 minute)

### From your local machine:
```bash
curl -X POST http://3.237.38.24:3000/api/webhooks/stripe
```

Should return 400 (expected - needs valid signature from Stripe).

### Or test from Stripe Dashboard:
1. Go to your webhook in Stripe Dashboard
2. Click "Send test webhook"
3. Select `customer.subscription.created`
4. Click "Send test webhook"
5. Check if it shows "Success"

---

## ✅ Done!

Your LIVE Stripe setup is now 100% complete:
- ✅ API keys configured
- ✅ Products created
- ✅ Price IDs set
- ✅ Webhook endpoint configured
- ✅ Ready for real payments!

---

## 🧪 Ready to Test

Now we can either:

**Option A:** Test with LIVE mode (real card, small charge, then refund)
**Option B:** Set up TEST mode and test safely with test cards

Which would you prefer?

