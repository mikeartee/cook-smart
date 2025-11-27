# Payment Scenarios & Handling

## Critical "What If" Scenarios

### 1. Payment Fails
**What happens:**
- User clicks subscribe → Opens browser → Payment fails
- Stripe webhook sends `payment_intent.payment_failed`

**Current handling:**
- ❌ No webhook handler for failed payments
- ❌ User not notified in app
- ❌ No retry mechanism

**Need to add:**
- Webhook handler to update subscription status
- In-app notification of failure
- Retry payment option

### 2. User Closes Browser Mid-Payment
**What happens:**
- User opens checkout → Closes browser before completing

**Current handling:**
- ✅ No subscription created (good)
- ❌ User doesn't know what happened
- ❌ No way to resume

**Need to add:**
- Check subscription status when app resumes
- Show "complete payment" option if pending

### 3. Payment Succeeds But Webhook Fails
**What happens:**
- Stripe charges card successfully
- Webhook doesn't reach your server (network issue)

**Current handling:**
- ❌ User paid but subscription not activated
- ❌ No reconciliation system

**Need to add:**
- Manual webhook replay option
- Subscription status sync endpoint
- Admin tool to fix mismatches

### 4. User Pays Twice (Double Click)
**What happens:**
- User clicks subscribe multiple times
- Creates multiple checkout sessions

**Current handling:**
- ⚠️ Stripe prevents duplicate charges (good)
- ❌ Multiple pending sessions confusing

**Need to add:**
- Disable button after first click
- Check for existing pending subscription

### 5. Subscription Expires
**What happens:**
- User's subscription period ends
- Stripe attempts renewal

**Current handling:**
- ✅ Stripe handles renewal automatically
- ❌ No notification to user before expiry
- ❌ No grace period handling

**Need to add:**
- Email reminder 7 days before expiry
- Grace period (3 days) for failed renewals
- In-app expiry warning

### 6. Payment Method Declined on Renewal
**What happens:**
- Stripe tries to charge expired/declined card
- Renewal fails

**Current handling:**
- ❌ No notification system
- ❌ User loses access immediately
- ❌ No update payment method flow

**Need to add:**
- Email notification of failed renewal
- In-app prompt to update payment method
- Grace period before access removal

### 7. User Cancels During Trial
**What happens:**
- User on 7-day trial cancels subscription

**Current handling:**
- ⚠️ Unclear if trial continues or ends immediately

**Need to add:**
- Clear cancellation policy
- Trial continues until end date
- Confirmation message

### 8. Refund Request
**What happens:**
- User requests refund within 30 days

**Current handling:**
- ❌ No refund process
- ❌ Manual admin intervention required

**Need to add:**
- Admin refund tool
- Automatic subscription cancellation on refund
- Refund policy documentation

### 9. User Has Multiple Devices
**What happens:**
- User subscribes on phone
- Opens app on tablet

**Current handling:**
- ⚠️ Subscription tied to user account (good)
- ❌ May not sync immediately

**Need to add:**
- Subscription status check on app launch
- Force refresh subscription status

### 10. Webhook Receives Events Out of Order
**What happens:**
- `subscription.updated` arrives before `subscription.created`

**Current handling:**
- ❌ May cause database errors
- ❌ No idempotency handling

**Need to add:**
- Idempotency keys
- Event ordering logic
- Retry failed webhook processing

## Priority Fixes Needed

### HIGH PRIORITY (Before Release)
1. ✅ Webhook handler for payment failures
2. ✅ Subscription status sync endpoint
3. ✅ Disable subscribe button after click
4. ✅ Check for existing subscription before checkout

### MEDIUM PRIORITY (Week 1 Post-Release)
5. Email notifications for renewals/failures
6. Grace period for failed renewals
7. Update payment method flow
8. Refund process

### LOW PRIORITY (Month 1)
9. Subscription status force refresh
10. Webhook event ordering
11. Admin reconciliation tools
