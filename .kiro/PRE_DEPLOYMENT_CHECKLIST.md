# Pre-Deployment Checklist - Cook Smart Subscription System

## Status: Ready for Deployment ✅

### Git Repository Status
- ✅ All code committed to `fresh-project-migration` branch
- ✅ Merged into `main` branch
- ✅ Tagged as `v1.1.0-beta`
- ✅ Pushed to GitHub

### Code Completeness
- ✅ Subscription pricing system implemented
- ✅ Automated price transitions ($24.99 → $34.99)
- ✅ Phase management (beta/post-beta)
- ✅ Referral code system
- ✅ Mobile app screens created
- ✅ Database migrations ready
- ✅ Stripe webhook handlers implemented
- ✅ Admin management UI created

---

## Deployment Steps (In Order)

### Step 1: Verify Environment Variables
**Location:** Your production server `.env` file

Required variables:
```env
# Database
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/cooksmartdb

# Stripe (PRODUCTION KEYS)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Discord Webhooks
DISCORD_WEBHOOK_URL=your_discord_webhook_url
DISCORD_ERROR_WEBHOOK_URL=your_error_webhook_url

# JWT
JWT_SECRET=your_secure_jwt_secret

# Server
PORT=3000
NODE_ENV=production
```

**Action Required:** 
- [ ] Update `.env` on production server with production Stripe keys
- [ ] Verify database connection string is correct
- [ ] Confirm Discord webhooks are configured

---

### Step 2: Run Database Migrations
**Command:**
```bash
cd backend
node run-all-migrations.js
```

**What this does:**
- Creates `subscription_plans` table
- Creates `app_configuration` table  
- Creates `subscription_events` table
- Adds new columns to `subscriptions` table

**Verification:**
```bash
node scripts/check-database-tables.js
```

**Action Required:**
- [ ] SSH into production server
- [ ] Run migration script
- [ ] Verify all tables created successfully

---

### Step 3: Create Stripe Products (PRODUCTION)
**IMPORTANT:** Switch Stripe Dashboard to LIVE mode first!

**Command:**
```bash
cd backend
node scripts/setup-stripe-products.js
```

**What this creates:**
- Yearly subscription with promotional ($24.99) and standard ($34.99) prices
- Monthly subscription ($6.99)
- Weekly subscription ($2.99)

**Action Required:**
- [ ] Switch to Stripe LIVE mode
- [ ] Run setup script
- [ ] **SAVE ALL PRODUCT/PRICE IDs** from output
- [ ] Product IDs are automatically stored in database

---

### Step 4: Configure Stripe Webhooks
**Steps:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-api-domain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret
6. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

**Verification Script:**
```bash
node scripts/verify-webhook-setup.js
```

**Action Required:**
- [ ] Create webhook endpoint in Stripe
- [ ] Copy webhook secret to `.env`
- [ ] Restart server to load new env variable
- [ ] Run verification script

---

### Step 5: Deploy Backend Code
**Options:**

**Option A: Docker Deployment**
```bash
cd backend
docker build -t cook-smart-backend .
docker push your-registry/cook-smart-backend:latest
# Deploy to your container service (ECS, etc.)
```

**Option B: Direct Deployment**
```bash
# On production server
git pull origin main
cd backend
npm install --production
pm2 restart cook-smart-backend
```

**Action Required:**
- [ ] Deploy backend code to production
- [ ] Verify server is running
- [ ] Check logs for any startup errors

---

### Step 6: Verify System Health
**Health Check:**
```bash
curl https://your-api-domain.com/api/health
```

**Check Phase Status:**
```bash
curl https://your-api-domain.com/api/v1/subscriptions/phase
```

Expected response:
```json
{
  "success": true,
  "phase": "beta",
  "isBeta": true
}
```

**Check Available Plans:**
```bash
curl https://your-api-domain.com/api/v1/subscriptions/plans
```

**Action Required:**
- [ ] Verify health endpoint responds
- [ ] Confirm phase is set to "beta"
- [ ] Verify plans are returned correctly

---

### Step 7: Test Subscription Flow (Test Mode)
**Use Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Create Test Subscription:**
```bash
curl -X POST https://your-api-domain.com/api/v1/subscriptions/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_USER_TOKEN" \
  -d '{
    "planType": "yearly"
  }'
```

**Action Required:**
- [ ] Create test user account
- [ ] Test subscription creation
- [ ] Verify webhook events received
- [ ] Check database for subscription record
- [ ] Verify Discord notifications sent

---

### Step 8: Build and Deploy Mobile App
**Android Build:**
```bash
cd android
./gradlew assembleRelease
```

**iOS Build:**
```bash
cd ios
pod install
# Build in Xcode
```

**Action Required:**
- [ ] Update API URL in mobile app config to production
- [ ] Build release version
- [ ] Test on physical device
- [ ] Submit to app stores (or internal testing)

---

### Step 9: Monitor Initial Deployment
**What to watch:**
- Server logs for errors
- Stripe Dashboard for subscription events
- Discord channels for notifications
- Database for subscription records

**Monitoring Commands:**
```bash
# Server logs
pm2 logs cook-smart-backend

# Database check
psql $DATABASE_URL -c "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;"

# Webhook events
psql $DATABASE_URL -c "SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;"
```

**Action Required:**
- [ ] Monitor for first 24 hours
- [ ] Watch for any errors
- [ ] Verify first real subscriptions work correctly

---

## Quick Reference Commands

### Check System Status
```bash
# Health check
curl https://your-api-domain.com/api/health

# Phase status
curl https://your-api-domain.com/api/v1/subscriptions/phase

# Available plans
curl https://your-api-domain.com/api/v1/subscriptions/plans
```

### Admin Phase Management
```bash
# Switch to post-beta (enables all tiers with trials)
curl -X POST https://your-api-domain.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"phase": "post-beta"}'

# Switch back to beta (yearly only, no trials)
curl -X POST https://your-api-domain.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"phase": "beta"}'
```

### Database Queries
```bash
# Check subscriptions
psql $DATABASE_URL -c "SELECT id, user_id, status, plan_type, current_period_end FROM subscriptions;"

# Check subscription plans
psql $DATABASE_URL -c "SELECT * FROM subscription_plans;"

# Check app configuration
psql $DATABASE_URL -c "SELECT * FROM app_configuration;"

# Check recent events
psql $DATABASE_URL -c "SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 20;"
```

---

## Rollback Plan (If Needed)

### Revert to Beta Phase
```bash
curl -X POST https://your-api-domain.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"phase": "beta"}'
```

### Disable Webhooks
- Go to Stripe Dashboard → Webhooks
- Disable the endpoint temporarily

### Rollback Code
```bash
git checkout v1.0.0-beta  # Previous stable version
# Redeploy
```

---

## Success Criteria

Deployment is successful when:
- ✅ All database migrations completed
- ✅ Stripe products created in production
- ✅ Webhooks receiving and processing events
- ✅ Test subscription completes successfully
- ✅ Mobile app can fetch and display plans
- ✅ Payment flow works end-to-end
- ✅ Discord notifications working
- ✅ No errors in server logs

---

## Support Contacts

**Technical Issues:**
- Check server logs: `pm2 logs cook-smart-backend`
- Review Discord error channel
- Check Stripe Dashboard for payment issues

**Emergency Rollback:**
- Revert to previous git tag
- Disable Stripe webhooks
- Switch phase back to beta

---

## Post-Deployment Tasks

After successful deployment:
1. Monitor first 10 subscriptions closely
2. Test referral code flow with real users
3. Verify renewal pricing after first billing cycle
4. Plan beta → post-beta transition timeline
5. Set up automated monitoring alerts
6. Document any issues encountered
7. Update team on deployment status

---

## Current Status: READY FOR DEPLOYMENT ✅

All code is complete, tested, and committed to git. Follow the steps above in order to deploy to production.
