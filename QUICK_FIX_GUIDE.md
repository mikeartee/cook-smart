# Quick Fix Guide - Subscription Payment Error

## The Problem

Users see: `Error: invalid input syntax for type integer: "user_1763712874120_6phqexvv2"`

## The Fix (3 Steps)

### 1. Run Migration

```bash
cd backend
node run-subscription-fix-migration.js
```

### 2. Rebuild Backend

```bash
npm run build
```

### 3. Restart Server

```bash
# Choose your method:
pm2 restart backend
# OR
npm start
```

## Test It Works

```bash
node test-subscription-fix.js
```

Should see: `✅ ALL TESTS PASSED!`

## What Changed

- Database: `subscriptions.user_id` changed from INTEGER to VARCHAR(255)
- Code: TypeScript types updated to accept string user IDs
- Result: Users can now subscribe successfully

## Need Help?

See `FIX_SUBSCRIPTION_PAYMENT_ERROR.md` for detailed instructions.

