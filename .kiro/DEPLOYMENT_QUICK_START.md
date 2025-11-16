# 🚀 Deployment Quick Start Guide

## Your System is Ready to Deploy! ✅

Everything is coded, tested, and committed to git. Follow these steps to deploy.

---

## Option 1: Automated Deployment (Recommended)

### Windows:
```bash
cd backend
deploy-production.bat
```

### Mac/Linux:
```bash
cd backend
chmod +x deploy-production.sh
./deploy-production.sh
```

This script will:
- ✅ Verify your environment is ready
- ✅ Run database migrations
- ✅ Create Stripe products
- ✅ Verify database tables
- ✅ Build the backend

---

## Option 2: Manual Step-by-Step

### 1. Verify Readiness (2 minutes)
```bash
cd backend
node scripts/verify-deployment-readiness.js
```

### 2. Run Migrations (1 minute)
```bash
node run-all-migrations.js
```

### 3. Create Stripe Products (2 minutes)
**⚠️ Switch to Stripe LIVE mode first!**
```bash
node scripts/setup-stripe-products.js
```
**Save all the product IDs from the output!**

### 4. Configure Stripe Webhook (3 minutes)
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-api-domain.com/api/webhooks/stripe`
3. Select events: `subscription.*`, `invoice.*`
4. Copy webhook secret to `.env`

### 5. Deploy Code (5 minutes)
```bash
# Build
npm run build

# Deploy to your server (Docker, PM2, etc.)
# Example with PM2:
pm2 restart cook-smart-backend
```

### 6. Verify (2 minutes)
```bash
# Health check
curl https://your-api-domain.com/api/health

# Check phase
curl https://your-api-domain.com/api/v1/subscriptions/phase

# Check plans
curl https://your-api-domain.com/api/v1/subscriptions/plans
```

### 7. Test (5 minutes)
Create a test subscription with Stripe test card: `4242 4242 4242 4242`

---

## What You Need Before Starting

### Required:
- ✅ Production Stripe keys (sk_live_... and pk_live_...)
- ✅ Database connection (AWS RDS PostgreSQL)
- ✅ Discord webhook URLs
- ✅ Production server access

### Nice to Have:
- ✅ Domain name configured
- ✅ SSL certificate installed
- ✅ Monitoring tools set up

---

## Environment Variables Checklist

Copy this to your production `.env` file:

```env
# Database
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/cooksmartdb

# Stripe (PRODUCTION)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Discord
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_ERROR_WEBHOOK_URL=your_error_webhook_url

# JWT
JWT_SECRET=your_secure_random_string

# Server
PORT=3000
NODE_ENV=production
```

---

## After Deployment

### Immediate (First Hour):
- [ ] Monitor server logs
- [ ] Watch Discord notifications
- [ ] Test subscription creation
- [ ] Verify webhooks working

### First Day:
- [ ] Monitor first real subscriptions
- [ ] Check database for any errors
- [ ] Verify pricing is correct
- [ ] Test referral codes

### First Week:
- [ ] Monitor renewal pricing
- [ ] Check subscription lifecycle
- [ ] Verify automated transitions
- [ ] Plan beta → post-beta switch

---

## Quick Commands Reference

### Check System Status
```bash
# Health
curl https://your-api.com/api/health

# Phase
curl https://your-api.com/api/v1/subscriptions/phase

# Plans
curl https://your-api.com/api/v1/subscriptions/plans
```

### Switch Phase (Admin Only)
```bash
# To post-beta (enables all tiers + trials)
curl -X POST https://your-api.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"phase": "post-beta"}'

# Back to beta (yearly only, no trials)
curl -X POST https://your-api.com/api/v1/subscriptions/phase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"phase": "beta"}'
```

### Database Queries
```bash
# Recent subscriptions
psql $DATABASE_URL -c "SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;"

# Subscription events
psql $DATABASE_URL -c "SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;"

# App configuration
psql $DATABASE_URL -c "SELECT * FROM app_configuration;"
```

---

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify server IP is whitelisted in RDS security group
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### "Stripe webhook signature invalid"
- Verify STRIPE_WEBHOOK_SECRET matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Ensure webhook is enabled in Stripe

### "Subscriptions not creating"
- Check Stripe product IDs in database
- Verify Stripe keys are LIVE mode
- Check server logs for errors
- Test with Stripe test card first

### "Plans not showing in app"
- Verify API URL in mobile app
- Check CORS settings on backend
- Test API endpoint directly with curl

---

## Support

**Documentation:**
- Full checklist: `.kiro/PRE_DEPLOYMENT_CHECKLIST.md`
- Deployment guide: `.kiro/SUBSCRIPTION_PRICING_DEPLOYMENT.md`

**Monitoring:**
- Server logs: `pm2 logs cook-smart-backend`
- Discord notifications (automatic)
- Stripe Dashboard

**Emergency Rollback:**
```bash
# Revert to previous version
git checkout v1.0.0-beta
# Redeploy

# Or just switch phase back to beta
curl -X POST https://your-api.com/api/v1/subscriptions/phase \
  -d '{"phase": "beta"}'
```

---

## Estimated Time

**Total deployment time: ~20-30 minutes**

- Verification: 2 min
- Migrations: 1 min
- Stripe setup: 2 min
- Webhook config: 3 min
- Code deployment: 5 min
- Testing: 5 min
- Monitoring: 10 min

---

## You're Ready! 🎉

Your subscription system is complete and ready to go live. All the code is tested, documented, and committed to git.

**Next step:** Run the automated deployment script or follow the manual steps above.

Good luck with your launch! 🚀
