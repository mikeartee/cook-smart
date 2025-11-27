# Deploy Payment System Updates

## Quick Deploy (Automated)

Run the deployment script:
```bash
deploy-payment-updates.bat
```

This will:
1. Run database migration
2. Build backend
3. Build frontend
4. Show next steps

## Manual Deploy (Step by Step)

### Step 1: Run Database Migration (5 min)

```bash
cd backend
node run-subscription-migration.js
```

**What this creates:**
- `subscription_reminders` table
- `subscription_status` column in users
- `grace_period_end` column in subscriptions

### Step 2: Build & Restart Backend (2 min)

```bash
cd backend
npm run build
npm start
```

**Or if using PM2:**
```bash
pm2 restart cook-smart-backend
```

### Step 3: Build Frontend (1 min)

```bash
npm run build
```

### Step 4: Build New APK (5 min)

```bash
npm run build-apk
```

**APK location:** `android/app/build/outputs/apk/release/app-release.apk`

### Step 5: Distribute to Beta Testers

Upload new APK to your distribution method (Firebase, email, etc.)

## What Activates Immediately

**After backend restart:**
- ✅ Subscription monitoring (runs every 6 hours)
- ✅ Email reminders (7, 3, 1 days before expiry)
- ✅ Grace period system (7 days for failed payments)
- ✅ Payment failure notifications
- ✅ Access restrictions after grace period
- ✅ Subscription sync endpoint
- ✅ Double subscription prevention

**After users update app:**
- ✅ Subscription status banner
- ✅ Support contact info
- ✅ Updated TOS/Refund Policy links

## Verify Deployment

### Check Backend
```bash
# Check if server is running
curl http://localhost:3000/health

# Check subscription monitoring logs
# Look for: "Subscription monitoring activated"
```

### Check Database
```bash
# Verify tables exist
psql -h your-host -U your-user -d cooksmartdb -c "\dt subscription_reminders"
```

### Check Frontend
- Open app
- Go to subscription screen
- Verify support email shows: services.cooksmart@gmail.com

## Rollback (If Needed)

If something goes wrong:

```bash
# Revert git commit
git revert HEAD

# Rebuild
cd backend && npm run build && npm start
cd .. && npm run build
```

## Monitoring After Deploy

**Watch for:**
1. Email notifications being sent (check services.cooksmart@gmail.com)
2. Subscription monitoring logs every 6 hours
3. Grace period warnings in Discord (if configured)
4. No errors in server logs

**Check logs:**
```bash
# If using PM2
pm2 logs cook-smart-backend

# Or check server console output
```

## Timeline

**Immediate (after backend restart):**
- Monitoring starts
- Webhooks active
- Access restrictions enforced

**Within 6 hours:**
- First subscription check runs
- Expiry reminders sent (if any due)

**Within 24 hours:**
- Grace period checks run
- Payment failure emails sent (if any)

## Support

If issues arise:
- Check server logs
- Verify database migration ran
- Confirm .env has SUPPORT_EMAIL set
- Test with a test subscription

## Success Checklist

- [ ] Database migration completed
- [ ] Backend built and restarted
- [ ] Frontend built successfully
- [ ] New APK created
- [ ] Server logs show "Subscription monitoring activated"
- [ ] No errors in console
- [ ] Test subscription flow works
- [ ] Support email visible in app
