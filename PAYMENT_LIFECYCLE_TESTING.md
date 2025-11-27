# Payment & Subscription Lifecycle Testing Plan

## 🎯 Purpose
Test all critical payment scenarios to ensure:
- No unauthorized charges
- Proper refund handling
- Account deletion removes payment data (GDPR)
- Failed payments handled gracefully
- Subscription cancellations work correctly
- No billing after cancellation

**Priority**: CRITICAL - Must pass before BETA launch
**Estimated Time**: 3-4 hours

---

## 🧪 Test Categories

### Category A: Payment Processing (1 hour)
### Category B: Subscription Lifecycle (1 hour)
### Category C: Account Deletion & Data Privacy (45 min)
### Category D: Edge Cases & Error Handling (45 min)

---

## 💳 CATEGORY A: Payment Processing Tests

### Test A1: Successful Payment Flow
**Priority**: CRITICAL
**Time**: 15 minutes

**Steps**:
1. ☐ Create test account: `payment-test-1@cooksmartapp.com`
2. ☐ Navigate to subscription plans
3. ☐ Select "Weekly Premium" ($2.99/week)
4. ☐ Use Stripe test card: `4242 4242 4242 4242`
5. ☐ Expiry: `12/25`, CVC: `123`
6. ☐ Complete payment

**Verify**:
- ☐ Payment succeeds
- ☐ Subscription status shows "Active"
- ☐ Premium features unlocked immediately
- ☐ Receipt/confirmation shown
- ☐ Check database: subscription record created
- ☐ Check Stripe dashboard: payment recorded

**Database Check** (I'll help):
```sql
SELECT * FROM subscriptions WHERE user_id = [user_id];
SELECT * FROM subscription_transactions WHERE user_id = [user_id];
```

**Expected**: ✅ Payment succeeds, subscription active, transaction recorded

---

### Test A2: Declined Card
**Priority**: CRITICAL
**Time**: 10 minutes

**Steps**:
1. ☐ Create test account: `payment-test-2@cooksmartapp.com`
2. ☐ Try to subscribe with declined card: `4000 0000 0000 0002`
3. ☐ Expiry: `12/25`, CVC: `123`

**Verify**:
- ☐ Payment fails with clear error message
- ☐ Error message is user-friendly (not technical jargon)
- ☐ User is NOT charged
- ☐ Subscription is NOT created
- ☐ User can try again with different card
- ☐ No transaction record in database

**Expected**: ✅ Clear error, no charge, no subscription created

---

### Test A3: Insufficient Funds
**Priority**: CRITICAL
**Time**: 10 minutes

**Steps**:
1. ☐ Create test account: `payment-test-3@cooksmartapp.com`
2. ☐ Try to subscribe with insufficient funds card: `4000 0000 0000 9995`

**Verify**:
- ☐ Payment fails with appropriate error
- ☐ Error mentions insufficient funds
- ☐ User is NOT charged
- ☐ Subscription is NOT created
- ☐ User can try different payment method

**Expected**: ✅ Clear error, no charge, no subscription

---

### Test A4: Expired Card
**Priority**: HIGH
**Time**: 10 minutes

**Steps**:
1. ☐ Create test account: `payment-test-4@cooksmartapp.com`
2. ☐ Try to subscribe with expired card: `4000 0000 0000 0069`

**Verify**:
- ☐ Payment fails with "card expired" error
- ☐ User is NOT charged
- ☐ Subscription is NOT created

**Expected**: ✅ Clear error, no charge

---

### Test A5: Duplicate Payment Prevention
**Priority**: HIGH
**Time**: 15 minutes

**Steps**:
1. ☐ Use account from Test A1 (already has active subscription)
2. ☐ Try to subscribe again to same plan
3. ☐ Try to subscribe to different plan

**Verify**:
- ☐ App prevents duplicate subscription to same plan
- ☐ Shows message: "You already have an active subscription"
- ☐ OR allows upgrade/downgrade with proper handling
- ☐ No duplicate charges

**Expected**: ✅ Duplicate subscriptions prevented OR handled properly

---

## 🔄 CATEGORY B: Subscription Lifecycle Tests

### Test B1: Subscription Cancellation (Immediate)
**Priority**: CRITICAL - LEGAL REQUIREMENT
**Time**: 20 minutes

**Steps**:
1. ☐ Use account from Test A1 (has active subscription)
2. ☐ Go to Profile → Subscription Details
3. ☐ Find "Cancel Subscription" button
4. ☐ Click cancel
5. ☐ Select "Cancel immediately" (if option exists)
6. ☐ Confirm cancellation

**Verify**:
- ☐ Subscription status changes to "Canceled"
- ☐ Access to premium features removed immediately
- ☐ No future charges scheduled
- ☐ Cancellation confirmation shown
- ☐ Check Stripe dashboard: subscription canceled
- ☐ Check database: canceled_at timestamp set

**Database Check**:
```sql
SELECT status, canceled_at, cancellation_reason 
FROM subscriptions 
WHERE user_id = [user_id];
```

**Stripe Check**:
- Go to Stripe Dashboard → Subscriptions
- Find subscription ID
- Verify status = "Canceled"
- Verify no upcoming invoices

**Expected**: ✅ Subscription canceled, no future charges, access removed

---

### Test B2: Subscription Cancellation (End of Period)
**Priority**: CRITICAL
**Time**: 20 minutes

**Steps**:
1. ☐ Create new test account: `payment-test-5@cooksmartapp.com`
2. ☐ Subscribe to Weekly plan
3. ☐ Immediately cancel but select "Cancel at end of period"

**Verify**:
- ☐ Subscription shows "Active until [date]"
- ☐ Premium features still work until period end
- ☐ No future charges scheduled after period end
- ☐ Check Stripe: `cancel_at_period_end = true`

**Database Check**:
```sql
SELECT status, cancel_at_period_end, current_period_end 
FROM subscriptions 
WHERE user_id = [user_id];
```

**Expected**: ✅ Access until period end, then canceled, no renewal

---

### Test B3: Recurring Payment Success
**Priority**: CRITICAL
**Time**: 10 minutes (+ webhook simulation)

**Note**: This tests webhook handling for recurring payments

**Steps**:
1. ☐ I'll simulate a Stripe webhook for `invoice.payment_succeeded`
2. ☐ Check if subscription renews properly

**Verify**:
- ☐ Subscription status remains "Active"
- ☐ `current_period_end` updated to next period
- ☐ Transaction recorded in `subscription_transactions`
- ☐ User maintains premium access

**Expected**: ✅ Subscription renews, transaction recorded

---

### Test B4: Recurring Payment Failure
**Priority**: CRITICAL
**Time**: 10 minutes

**Steps**:
1. ☐ I'll simulate a Stripe webhook for `invoice.payment_failed`
2. ☐ Check how app handles failed renewal

**Verify**:
- ☐ Subscription status changes to "Past Due"
- ☐ User notified of payment failure
- ☐ User given option to update payment method
- ☐ Premium access handled appropriately (grace period or immediate removal)
- ☐ Failed transaction recorded

**Database Check**:
```sql
SELECT * FROM subscription_transactions 
WHERE status = 'failed' AND user_id = [user_id];
```

**Expected**: ✅ Status = past_due, user notified, transaction recorded

---

## 🗑️ CATEGORY C: Account Deletion & Data Privacy

### Test C1: Delete Account with Active Subscription
**Priority**: CRITICAL - GDPR COMPLIANCE
**Time**: 25 minutes

**Steps**:
1. ☐ Create test account: `payment-test-6@cooksmartapp.com`
2. ☐ Subscribe to Monthly plan ($6.99)
3. ☐ Add some data (ingredients, recipes, etc.)
4. ☐ Go to Profile → Delete Account
5. ☐ Confirm deletion

**Verify**:
- ☐ Account deletion succeeds
- ☐ Subscription is canceled in Stripe
- ☐ User data deleted from database
- ☐ Payment methods removed from Stripe
- ☐ Cannot log in with deleted account
- ☐ No future charges scheduled

**Database Check**:
```sql
-- Should return 0 rows
SELECT * FROM users WHERE email = 'payment-test-6@cooksmartapp.com';
SELECT * FROM subscriptions WHERE user_id = [deleted_user_id];
```

**Stripe Check**:
- Verify subscription canceled
- Verify customer marked as deleted or subscription canceled
- Verify no upcoming invoices

**Expected**: ✅ Account deleted, subscription canceled, no future charges

---

### Test C2: Delete Account After Canceling Subscription
**Priority**: HIGH
**Time**: 20 minutes

**Steps**:
1. ☐ Create test account: `payment-test-7@cooksmartapp.com`
2. ☐ Subscribe to Weekly plan
3. ☐ Cancel subscription (end of period)
4. ☐ Wait for period to end OR immediately delete account
5. ☐ Delete account

**Verify**:
- ☐ Account deletion succeeds
- ☐ All user data removed
- ☐ Canceled subscription data handled properly
- ☐ No orphaned records in database

**Expected**: ✅ Clean deletion, no orphaned data

---

## 🔧 CATEGORY D: Edge Cases & Error Handling

### Test D1: Webhook Failure Handling
**Priority**: HIGH
**Time**: 15 minutes

**Steps**:
1. ☐ I'll send invalid webhook signature
2. ☐ I'll send malformed webhook data
3. ☐ Check error handling

**Verify**:
- ☐ Invalid webhooks rejected (400 error)
- ☐ Errors logged properly
- ☐ App doesn't crash
- ☐ Valid webhooks still work after invalid ones

**Expected**: ✅ Invalid webhooks rejected, app stable

---

### Test D2: Subscription Status Sync Issues
**Priority**: MEDIUM
**Time**: 15 minutes

**Scenario**: Database and Stripe get out of sync

**Steps**:
1. ☐ I'll manually change subscription status in database
2. ☐ User tries to access premium features
3. ☐ Check if app detects mismatch

**Verify**:
- ☐ App handles status mismatch gracefully
- ☐ User sees appropriate message
- ☐ Option to refresh/sync status

**Expected**: ✅ Mismatch detected and handled

---

### Test D3: Payment Method Update
**Priority**: MEDIUM
**Time**: 15 minutes

**Steps**:
1. ☐ Use account with active subscription
2. ☐ Go to Payment Methods
3. ☐ Add new card: `4242 4242 4242 4242`
4. ☐ Set as default
5. ☐ Remove old card

**Verify**:
- ☐ New card added successfully
- ☐ Can set as default
- ☐ Can remove old card
- ☐ Next payment uses new card

**Expected**: ✅ Payment method updated successfully

---

### Test D4: Refund Handling
**Priority**: HIGH
**Time**: 15 minutes

**Note**: This requires manual Stripe dashboard action

**Steps**:
1. ☐ Use account with completed payment
2. ☐ I'll issue refund from Stripe dashboard
3. ☐ Check if webhook updates app

**Verify**:
- ☐ Refund webhook received
- ☐ Transaction status updated to "refunded"
- ☐ Subscription status handled appropriately
- ☐ User notified of refund (if implemented)

**Database Check**:
```sql
SELECT * FROM subscription_transactions 
WHERE status = 'refunded' AND user_id = [user_id];
```

**Expected**: ✅ Refund recorded, status updated

---

## 📊 Test Results Summary

### Critical Tests (Must Pass):
- ☐ A1: Successful Payment
- ☐ A2: Declined Card
- ☐ A3: Insufficient Funds
- ☐ B1: Immediate Cancellation
- ☐ B2: End-of-Period Cancellation
- ☐ B3: Recurring Payment Success
- ☐ B4: Recurring Payment Failure
- ☐ C1: Delete Account with Active Subscription

### High Priority Tests (Should Pass):
- ☐ A4: Expired Card
- ☐ A5: Duplicate Payment Prevention
- ☐ C2: Delete Account After Cancellation
- ☐ D1: Webhook Failure Handling
- ☐ D4: Refund Handling

### Medium Priority Tests (Nice to Pass):
- ☐ D2: Status Sync Issues
- ☐ D3: Payment Method Update

---

## 🐛 Bug Tracking

For each issue found:

```
BUG #[number]
Test: [Test ID - e.g., A1, B2, C1]
Priority: [CRITICAL/HIGH/MEDIUM/LOW]
Type: [Payment/Subscription/Data/UI]

Description:
[What went wrong]

Steps to Reproduce:
1. 
2. 
3. 

Expected:
[What should happen]

Actual:
[What actually happened]

Impact:
[Legal/Financial/User Experience]

Screenshot/Logs:
[If applicable]
```

---

## ✅ Launch Decision Criteria

### READY TO LAUNCH:
- ✅ All 8 Critical tests pass
- ✅ At least 4 of 5 High Priority tests pass
- ✅ No critical bugs found
- ✅ Stripe webhooks working
- ✅ Account deletion works properly

### NEEDS FIXES:
- ❌ Any Critical test fails
- ❌ More than 1 High Priority test fails
- ❌ Account deletion doesn't work
- ❌ Webhooks not working

### NEEDS MORE TESTING:
- ⚠️ Unclear results
- ⚠️ Intermittent failures
- ⚠️ Need to retest after fixes

---

## 🔍 What I'll Help With

### During Testing:
1. **Database Queries** - I'll run SQL to verify data
2. **Stripe Dashboard Checks** - I'll verify Stripe side
3. **Webhook Simulation** - I'll trigger test webhooks
4. **Log Analysis** - I'll check backend logs for errors
5. **Bug Fixes** - I'll fix any issues we find

### After Each Test:
- Document results
- Check database state
- Verify Stripe dashboard
- Identify any issues

---

## 🚨 Critical Scenarios to Watch For

### Financial Issues:
- ❌ User charged after cancellation
- ❌ User charged twice for same subscription
- ❌ User charged without active subscription
- ❌ Refund not processed properly

### Legal Issues (GDPR):
- ❌ Account deletion doesn't cancel subscription
- ❌ Payment data not removed after account deletion
- ❌ User data remains after deletion

### User Experience Issues:
- ❌ No way to cancel subscription
- ❌ Unclear error messages
- ❌ Can't update payment method
- ❌ No confirmation of cancellation

---

## 📞 Support During Testing

**When you're ready to test**:
1. Let me know which test you're starting
2. I'll prepare database queries
3. I'll monitor backend logs
4. I'll check Stripe dashboard
5. We'll document results together

**If something goes wrong**:
- Don't panic - finding bugs now is good!
- Document exactly what happened
- Take screenshots
- I'll help diagnose and fix

---

## 🎯 Next Steps

1. **Review this plan** - Any questions or concerns?
2. **Schedule testing time** - When do you want to test?
3. **Prepare test accounts** - I can create them
4. **Set up monitoring** - I'll prepare database queries
5. **Start testing** - We'll go through each test together

**Remember**: Every bug we find now is one less issue for real users! 🚀

