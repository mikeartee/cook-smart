# Payment & Subscription Considerations

## ✅ Already Implemented

1. **Payment Processing**
   - Stripe integration working
   - Browser checkout (reliable)
   - Webhook handling
   - Payment failure notifications

2. **Subscription Management**
   - Multiple pricing tiers
   - Automatic renewals
   - Cancellation handling
   - Grace period (7 days)

3. **User Communication**
   - Expiry reminders (7, 3, 1 days)
   - Payment failure emails
   - Grace period warnings
   - Access restriction notices

4. **Access Control**
   - Subscription status checking
   - Restricted mode for expired users
   - Protected routes

## ⚠️ Additional Considerations Needed

### 1. Legal & Compliance

#### A. Terms of Service Updates Needed
**Current gaps:**
- ❌ No mention of automatic renewal terms
- ❌ No grace period policy documented
- ❌ No clear cancellation policy
- ❌ No subscription modification terms

**Add to TOS:**
```markdown
### 6.5 Automatic Renewal
Subscriptions automatically renew at the end of each billing period unless canceled. 
You will be charged the then-current rate.

### 6.6 Cancellation Policy
- Cancel anytime from account settings
- Cancellation effective at end of current billing period
- No refunds for partial periods
- Access continues until period end

### 6.7 Grace Period
If payment fails, you have 7 days to update payment method while maintaining 
full access. After 7 days, access is restricted to account management only.

### 6.8 Price Changes
We may change subscription prices with 30 days notice. Existing subscribers 
maintain current rate until next renewal.
```

#### B. Refund Policy Updates Needed
**Add:**
```markdown
### Grace Period Refunds
No refunds during 7-day grace period. Update payment method to continue service.

### Failed Payment Fees
No additional fees charged for failed payments. Standard subscription rate applies.

### Disputed Charges
Contact support within 30 days. Refunds evaluated case-by-case.
```

### 2. Tax Compliance

**Issues:**
- ❌ No sales tax collection
- ❌ No VAT handling (EU users)
- ❌ No tax ID collection for business users

**Solutions:**
- Enable Stripe Tax (automatic tax calculation)
- Add tax collection to checkout
- Store tax information in database

**Implementation:**
```typescript
// In Stripe checkout session creation
tax_id_collection: {
  enabled: true
},
automatic_tax: {
  enabled: true
}
```

### 3. Subscription Features

#### A. Proration
**Current:** Not implemented
**Needed:** When user upgrades/downgrades mid-cycle

**Example:** User on monthly ($6.99) upgrades to yearly ($34.99)
- Should credit unused monthly time
- Charge prorated yearly amount

#### B. Subscription Pausing
**Current:** Not available
**Consider:** Allow users to pause subscription (1-3 months)
- Useful for vacations
- Reduces churn
- Industry standard

#### C. Downgrade Path
**Current:** User must cancel then resubscribe
**Better:** Allow in-app plan changes
- Weekly → Monthly → Yearly
- Immediate or at period end

### 4. Payment Methods

#### A. Multiple Payment Methods
**Current:** One payment method per user
**Consider:** Allow multiple saved cards
- Primary + backup
- Reduces failed renewals

#### B. Payment Method Updates
**Current:** Must cancel and resubscribe
**Needed:** Update payment method endpoint
- Change card without canceling
- Update billing address

### 5. Billing & Invoices

**Missing:**
- ❌ No invoice generation
- ❌ No billing history download
- ❌ No receipt emails

**Add:**
- PDF invoice generation
- Email receipts automatically
- Billing history in app

### 6. Fraud Prevention

**Current:** Basic Stripe fraud detection
**Consider:**
- Rate limiting on subscription creation
- IP-based restrictions
- Unusual activity monitoring
- Chargeback handling process

### 7. Customer Support

**Needed:**
- Clear escalation path for payment issues
- Support ticket system for billing disputes
- FAQ for common payment problems
- Live chat or email support

### 8. Analytics & Monitoring

**Track:**
- Failed payment rate
- Churn rate by plan
- Grace period conversion rate
- Refund request rate
- Average customer lifetime value

### 9. Edge Cases

#### A. Duplicate Subscriptions
**Scenario:** User subscribes twice (different devices)
**Solution:** Already handled - check for existing subscription

#### B. Expired Card During Trial
**Scenario:** Card expires during free trial
**Solution:** Send reminder before trial ends

#### C. Subscription Transfer
**Scenario:** User wants to transfer subscription to new account
**Policy needed:** Allow/deny transfers

#### D. Family/Group Plans
**Future:** Multiple users under one subscription
**Not needed now** but plan for it

### 10. Regulatory Compliance

#### A. GDPR (EU Users)
- Right to data export ✅ (already have)
- Right to deletion ✅ (already have)
- Consent for marketing emails ❌ (need to add)

#### B. CCPA (California Users)
- Data disclosure ✅
- Opt-out of data sale ✅ (not selling data)

#### C. PCI Compliance
- ✅ Using Stripe (PCI compliant)
- ✅ Not storing card data

## Priority Recommendations

### HIGH PRIORITY (Before Launch)
1. ✅ Update Terms of Service with subscription terms
2. ✅ Update Refund Policy with grace period terms
3. ✅ Enable Stripe Tax for automatic tax collection
4. ✅ Add payment method update functionality
5. ✅ Implement invoice/receipt emails

### MEDIUM PRIORITY (Week 1 Post-Launch)
6. Add billing history download
7. Implement subscription upgrade/downgrade
8. Add backup payment method support
9. Create payment FAQ
10. Set up billing support email

### LOW PRIORITY (Month 1)
11. Subscription pausing feature
12. Proration for plan changes
13. Analytics dashboard for subscriptions
14. Family/group plan consideration

## Immediate Action Items

**Before you can launch:**
1. Update TERMS_OF_SERVICE.md with subscription clauses
2. Update REFUND_POLICY.md with grace period terms
3. Enable Stripe Tax in dashboard
4. Test full payment flow end-to-end
5. Create payment support email/process
