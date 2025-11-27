# Payment Testing - Session Results

**Date:** November 23, 2025  
**Status:** Ready to Test

---

## ✅ Setup Complete

### Infrastructure:
- ✅ HTTPS configured: `https://api.cooksmartapp.com`
- ✅ SSL certificate valid
- ✅ Stripe webhook configured and working
- ✅ Backend running and healthy

### Stripe Configuration:
- ✅ LIVE mode active
- ✅ Products created (Weekly $2.99, Monthly $6.99, Yearly $34.99, BETA $24.99)
- ✅ Price IDs configured
- ✅ Webhook secret set
- ✅ 6 events configured

---

## 🧪 Test Account Created

**Test A1: Successful Payment Flow**

### Account Details:
- **Email:** `payment-test-1@cooksmartapp.com`
- **Password:** `TestPassword123!`
- **User ID:** `user_1763871316917_jqoyeqqmq`
- **Status:** ✅ Account created and verified

### Available Plans:
- Yearly: $24.99/year (BETA pricing)

---

## 📱 Manual Testing Steps

Since payment requires Stripe Elements UI (can't be automated), here's how to test:

### Test A1: Successful Payment
1. Open Cook Smart app
2. Login with: `payment-test-1@cooksmartapp.com` / `TestPassword123!`
3. Navigate to subscription/payment screen
4. Select a plan (Weekly $2.99 recommended for testing)
5. Use Stripe test card: `4242 4242 4242 4242`
6. Expiry: `12/25`, CVC: `123`
7. Complete payment

**Expected Result:**
- ✅ Payment succeeds
- ✅ Subscription shows as "Active"
- ✅ Premium features unlocked
- ✅ Webhook received (check backend logs)
- ✅ Transaction recorded in database

---

## 🔍 Verification Commands

### Check Backend Logs:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
pm2 logs cook-smart-backend --lines 50
```

### Check Stripe Dashboard:
https://dashboard.stripe.com/payments

### Check Webhook Events:
https://dashboard.stripe.com/webhooks/we_1SWUdpKSbJqCZWWDsbVdUYIN

### Check Database:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
# Connect to database and check:
# SELECT * FROM subscriptions WHERE user_id = 'user_1763871316917_jqoyeqqmq';
# SELECT * FROM subscription_transactions WHERE user_id = 'user_1763871316917_jqoyeqqmq';
```

---

## 🧪 Additional Test Scenarios

### Test A2: Declined Card
- Use card: `4000 0000 0000 0002`
- Expected: Clear error message, no charge

### Test A3: Insufficient Funds
- Use card: `4000 0000 0000 9995`
- Expected: Clear error message, no charge

### Test A4: Expired Card
- Use card: `4000 0000 0000 0069`
- Expected: "Card expired" error

### Test B1: Subscription Cancellation
- After successful subscription, cancel it
- Expected: Status changes, no future charges

### Test C1: Account Deletion with Active Subscription
- Delete account while subscription is active
- Expected: Account deleted, subscription canceled, no future charges

---

## 📊 Test Results Template

For each test, document:

```
Test: [A1, A2, etc.]
Date: [Date/Time]
Result: [PASS/FAIL]
Details:
- Payment processed: [Yes/No]
- Error message (if any): [Message]
- Webhook received: [Yes/No]
- Database updated: [Yes/No]
- Issues found: [List any issues]
```

---

## 🚀 Ready to Test!

Everything is configured and ready. The test account is created. You can now:

1. Open the Cook Smart app
2. Login with the test account
3. Try making a payment
4. Verify everything works as expected

All webhooks will be received automatically and you can monitor everything in real-time!

