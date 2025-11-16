# Create Stripe Products - Quick Guide

**Status:** ✅ API Keys Configured | ⏳ Need to Create Products

## Your Stripe Dashboard
Go to: https://dashboard.stripe.com/test/products

## Create These 5 Products:

### 1. Cook Smart Pre-Purchase in BETA Yearly (MOST IMPORTANT!)
**This is your main BETA offering - 30% discount**

1. Click "Add product"
2. **Name:** Cook Smart Pre-Purchase in BETA Yearly
3. **Description:** Pre-purchase yearly subscription at 30% discount during BETA. Lock in this price forever!
4. **Pricing Model:** Standard pricing
5. **Price:** $24.99
6. **Billing period:** Yearly
7. **Currency:** USD
8. Click "Save product"
9. **COPY THE PRICE ID** (starts with `price_`) 
10. Paste it in `backend/.env` as `STRIPE_BETA_PRICE_ID=price_...`

---

### 2. Cook Smart Yearly Referral
**Same price as BETA, but for referred users**

1. Click "Add product"
2. **Name:** Cook Smart Yearly Referral
3. **Description:** Yearly subscription with referral discount (30% off)
4. **Price:** $24.99
5. **Billing period:** Yearly
6. **Currency:** USD
7. Click "Save product"
8. **COPY THE PRICE ID** → `STRIPE_YEARLY_REFERRAL_PRICE_ID=price_...`

---

### 3. Cook Smart Yearly Full Price
**Regular price after BETA ends**

1. Click "Add product"
2. **Name:** Cook Smart Yearly Full Price
3. **Description:** Yearly subscription with 7-day free trial
4. **Price:** $34.99
5. **Billing period:** Yearly
6. **Currency:** USD
7. **Add trial:** 7 days free
8. Click "Save product"
9. **COPY THE PRICE ID** → `STRIPE_YEARLY_PRICE_ID=price_...`

---

### 4. Cook Smart Monthly
**Monthly option after BETA**

1. Click "Add product"
2. **Name:** Cook Smart Monthly
3. **Description:** Monthly subscription with 7-day free trial
4. **Price:** $6.99
5. **Billing period:** Monthly
6. **Currency:** USD
7. **Add trial:** 7 days free
8. Click "Save product"
9. **COPY THE PRICE ID** → `STRIPE_MONTHLY_PRICE_ID=price_...`

---

### 5. Cook Smart Weekly
**Weekly option after BETA**

1. Click "Add product"
2. **Name:** Cook Smart Weekly
3. **Description:** Weekly subscription with 7-day free trial
4. **Price:** $2.99
5. **Billing period:** Weekly
6. **Currency:** USD
7. **Add trial:** 7 days free
8. Click "Save product"
9. **COPY THE PRICE ID** → `STRIPE_WEEKLY_PRICE_ID=price_...`

---

## After Creating Products

1. Update `backend/.env` with all 4 price IDs
2. Restart your backend server
3. Test with: `curl http://localhost:3000/api/v1/payments/plans`

## Test Card for BETA Pre-Purchases

When testing, use this test card:
- **Card Number:** 4242 4242 4242 4242
- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

## Important Notes

- You're in **TEST MODE** - no real money will be charged
- BETA users can "pre-purchase" with test cards
- When you launch, switch to live mode and process real payments
- The $24.99 BETA price is 30% off the regular $34.99 yearly price

---

**Once you create the products and add the price IDs, Stripe will be fully functional!** 🚀
