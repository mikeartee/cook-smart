# Fix Subscription Payment Error

## Problem
Users getting error: `invalid input syntax for type integer: "user_1763712874120_6phqexvv2"`

## Root Cause
- Users table has `id VARCHAR(255)` (string IDs like `user_1763712874120_6phqexvv2`)
- Subscriptions table has `user_id INTEGER` (expects numeric IDs)
- Type mismatch causes PostgreSQL error when inserting subscription records

## Solution
Changed `subscriptions.user_id` and `subscription_transactions.user_id` from `INTEGER` to `VARCHAR(255)` to match the users table.

## Files Changed

### 1. Database Migration
- `backend/migrations/012_fix_subscriptions_user_id_type.sql` - Changes column types and adds foreign keys

### 2. TypeScript Type Updates
- `backend/src/models/Subscription.ts` - Updated interfaces and method signatures
- `backend/src/services/SubscriptionPricingService.ts` - Updated all user_id parameters
- `backend/src/controllers/SubscriptionPricingController.ts` - Updated Request user type
- `backend/src/controllers/AdminSubscriptionsController.ts` - Updated billing history filters

### 3. Migration Script
- `backend/run-subscription-fix-migration.js` - Automated migration runner

## Deployment Steps

### Step 1: Run the Migration

```bash
cd backend
node run-subscription-fix-migration.js
```

Expected output:
```
Starting subscription user_id type fix migration...
✅ Migration completed successfully!
✅ subscriptions.user_id changed from INTEGER to VARCHAR(255)
✅ subscription_transactions.user_id changed from INTEGER to VARCHAR(255)
✅ Foreign key constraints added
```

### Step 2: Rebuild Backend

```bash
cd backend
npm run build
```

### Step 3: Restart Backend Server

```bash
# If using PM2
pm2 restart backend

# If using systemd
sudo systemctl restart cooksmart-backend

# If running manually
npm start
```

### Step 4: Test Subscription Flow

1. Open the app
2. Navigate to Profile → Subscribe
3. Select "Yearly Premium" plan
4. Complete payment
5. Verify subscription is created successfully

## Verification

Check that the migration worked:

```sql
-- Connect to your database
psql $DATABASE_URL

-- Check column types
\d subscriptions
\d subscription_transactions

-- Should show:
-- user_id | character varying(255) | not null
```

## Rollback (if needed)

If you need to rollback (NOT RECOMMENDED after users have subscribed):

```sql
BEGIN;

-- Remove foreign keys
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE subscription_transactions DROP CONSTRAINT IF EXISTS subscription_transactions_user_id_fkey;

-- Change back to INTEGER (will fail if string IDs exist)
ALTER TABLE subscriptions ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
ALTER TABLE subscription_transactions ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;

COMMIT;
```

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Backend builds successfully
- [ ] Backend starts without errors
- [ ] User can view subscription plans
- [ ] User can subscribe to yearly plan
- [ ] Subscription record is created in database
- [ ] User subscription status is updated
- [ ] No console errors in app or backend logs

## Notes

- This fix is backward compatible - existing subscriptions (if any) will continue to work
- The migration adds proper foreign key constraints for data integrity
- All TypeScript types have been updated to accept both string and number user IDs for flexibility

