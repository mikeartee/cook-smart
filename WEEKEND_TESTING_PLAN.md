# Weekend Testing Plan - BETA Launch Preparation

## 🎯 Goal
Test all critical features before BETA launch to ensure:
- No legal issues (GDPR compliance)
- No money issues (payment handling)
- No user frustration (error handling)

**Estimated Time**: 4-6 hours total (can be split across weekend)

---

## 📅 Testing Schedule

### **Saturday Morning (2-3 hours)**
- ☐ Session 1: Account & Authentication Testing
- ☐ Session 2: Payment & Subscription Testing

### **Saturday Afternoon (1-2 hours)**
- ☐ Session 3: Error Handling & Edge Cases

### **Sunday (1-2 hours)**
- ☐ Session 4: Final Verification & Bug Fixes
- ☐ Session 5: Real User Testing (optional)

---

## 🧪 SESSION 1: Account & Authentication Testing (1 hour)

### **Test 1.1: Account Creation**
**Time**: 10 minutes

1. ☐ Open Cook Smart app
2. ☐ Tap "Sign Up"
3. ☐ Create account with test email: `test1@cooksmartapp.com`
4. ☐ Verify account is created
5. ☐ Log out
6. ☐ Log back in
7. ☐ Verify login works

**Expected Result**: ✅ Account created, can log in/out

**If It Fails**: Document error message, take screenshot

---

### **Test 1.2: Password Reset**
**Time**: 10 minutes

1. ☐ Log out
2. ☐ Tap "Forgot Password?"
3. ☐ Enter: `services.cooksmart@gmail.com` (verified email)
4. ☐ Check email for reset code
5. ☐ Enter reset code in app
6. ☐ Set new password
7. ☐ Log in with new password

**Expected Result**: ✅ Receive email, reset works, can log in

**If It Fails**: 
- Check spam folder
- Verify AWS SES production access is approved
- Check backend logs

---

### **Test 1.3: Account Deletion (CRITICAL - GDPR)**
**Time**: 20 minutes

1. ☐ Log in as test user
2. ☐ Add some data:
   - Add 2-3 ingredients
   - Add 2-3 shopping list items
   - Save dietary preferences
   - Favorite a recipe
3. ☐ Go to Profile screen
4. ☐ Look for "Delete Account" option
5. ☐ If found: Tap it and follow prompts
6. ☐ If NOT found: **CRITICAL BUG - Document this**
7. ☐ After deletion, try to log in again
8. ☐ Should fail with "Account not found" or similar

**Expected Result**: ✅ Account deleted, cannot log in, data removed

**If It Fails**: 
- **HIGH PRIORITY BUG**
- Document what happens
- We need to implement account deletion

**Database Verification** (I'll help with this):
```sql
-- Check if user data is actually deleted
SELECT * FROM users WHERE email = 'test1@cooksmartapp.com';
-- Should return 0 rows
```

---

### **Test 1.4: Two-Factor Authentication (Optional)**
**Time**: 10 minutes

1. ☐ Create new test account
2. ☐ Go to Profile → Security Settings
3. ☐ Look for "Enable 2FA" option
4. ☐ If found: Enable it and test
5. ☐ If NOT found: Skip (not critical for BETA)

**Expected Result**: ✅ 2FA works or doesn't exist (both OK)

---

## 💳 SESSION 2: Payment & Subscription Testing (1.5 hours)

### **Test 2.1: Successful Subscription**
**Time**: 15 minutes

1. ☐ Create new test account: `test2@cooksmartapp.com`
2. ☐ Go to Profile → Subscribe
3. ☐ Select "Weekly Premium" plan
4. ☐ Use Stripe test card: `4242 4242 4242 4242`
5. ☐ Expiry: Any future date (e.g., 12/25)
6. ☐ CVC: Any 3 digits (e.g., 123)
7. ☐ Complete payment
8. ☐ Verify subscription shows as "Active"
9. ☐ Verify premium features are unlocked

**Expected Result**: ✅ Payment succeeds, subscription active

**If It Fails**: Document error message, check backend logs

---

### **Test 2.2: Declined Card**
**Time**: 10 minutes

1. ☐ Create new test account: `test3@cooksmartapp.com`
2. ☐ Try to subscribe with declined card: `4000 0000 0000 0002`
3. ☐ Verify app shows error message
4. ☐ Verify error message is helpful (not just "Error")
5. ☐ Verify subscription is NOT created
6. ☐ Verify user is NOT charged

**Expected Result**: ✅ Clear error message, no charge, no subscription

**If It Fails**: 
- Document what happens
- Check if user was charged
- Check if subscription was created

---

### **Test 2.3: Expired Card**
**Time**: 10 minutes

1. ☐ Create new test account: `test4@cooksmartapp.com`
2. ☐ Try to subscribe with expired card: `4000 0000 0000 0069`
3. ☐ Verify app shows "Card expired" error
4. ☐ Verify no charge, no subscription

**Expected Result**: ✅ Clear error message, no charge

---

### **Test 2.4: Insufficient Funds**
**Time**: 10 minutes

1. ☐ Create new test account: `test5@cooksmartapp.com`
2. ☐ Try to subscribe with insufficient funds card: `4000 0000 0000 9995`
3. ☐ Verify app shows appropriate error
4. ☐ Verify no charge, no subscription

**Expected Result**: ✅ Clear error message, no charge

---

### **Test 2.5: Subscription Cancellation (CRITICAL)**
**Time**: 20 minutes

1. ☐ Use test2 account (has active subscription)
2. ☐ Go to Profile → Subscription Details
3. ☐ Look for "Cancel Subscription" button
4. ☐ If found: Tap it
5. ☐ If NOT found: **CRITICAL BUG - Document this**
6. ☐ Confirm cancellation
7. ☐ Verify subscription status changes to "Cancelled" or "Active until [date]"
8. ☐ Verify no future charges scheduled
9. ☐ Verify user still has access until period ends

**Expected Result**: ✅ Subscription cancelled, no future charges, access until period end

**If It Fails**:
- **HIGH PRIORITY BUG**
- Document what happens
- Check Stripe dashboard for subscription status

**Stripe Verification** (I'll help with this):
- Check Stripe dashboard
- Verify subscription shows as "Cancelled"
- Verify no future invoices scheduled

---

### **Test 2.6: Billing History**
**Time**: 10 minutes

1. ☐ Go to Profile → Billing History
2. ☐ Verify previous payment shows up
3. ☐ Verify amount is correct
4. ☐ Verify date is correct
5. ☐ Verify status shows "Paid"

**Expected Result**: ✅ Transaction history displays correctly

---

### **Test 2.7: Payment Method Management**
**Time**: 10 minutes

1. ☐ Go to Profile → Payment Methods
2. ☐ Verify current card shows (last 4 digits)
3. ☐ Try to add new card
4. ☐ Try to remove card (if allowed)
5. ☐ Verify changes save

**Expected Result**: ✅ Can view and manage payment methods

---

## 🔧 SESSION 3: Error Handling & Edge Cases (1 hour)

### **Test 3.1: Offline Behavior**
**Time**: 15 minutes

1. ☐ Open app with internet ON
2. ☐ Turn OFF WiFi and mobile data
3. ☐ Try to:
   - Load recipes
   - Add ingredient
   - Toggle shopping list item
   - View profile
4. ☐ Document what happens for each action
5. ☐ Turn internet back ON
6. ☐ Verify app recovers

**Expected Result**: ✅ App shows helpful error messages, doesn't crash

**If It Crashes**: 
- **MEDIUM PRIORITY BUG**
- Document which action caused crash
- We need to add offline handling

---

### **Test 3.2: Server Error Simulation**
**Time**: 10 minutes

1. ☐ I'll temporarily break the backend (return 500 errors)
2. ☐ You try to use the app
3. ☐ Document what happens
4. ☐ I'll fix the backend
5. ☐ Verify app recovers

**Expected Result**: ✅ App shows error message, doesn't crash, recovers when server is back

---

### **Test 3.3: Invalid Token**
**Time**: 10 minutes

1. ☐ Log in to app
2. ☐ I'll invalidate your session token in backend
3. ☐ Try to use app features
4. ☐ Should redirect to login screen
5. ☐ Log in again
6. ☐ Verify everything works

**Expected Result**: ✅ App detects invalid token, redirects to login

---

### **Test 3.4: Barcode Scanning Edge Cases**
**Time**: 15 minutes

1. ☐ Try to scan a barcode that doesn't exist in any database
2. ☐ Verify app handles it gracefully
3. ☐ Try to scan invalid barcode (random numbers)
4. ☐ Verify app shows helpful message
5. ☐ Verify can still add ingredient manually

**Expected Result**: ✅ App handles unknown barcodes, offers manual entry

---

### **Test 3.5: Recipe Filtering by Dietary Preferences**
**Time**: 10 minutes

1. ☐ Go to Dietary Preferences
2. ☐ Select "Vegan"
3. ☐ Save preferences
4. ☐ Go to Recipe Search
5. ☐ Search for recipes
6. ☐ Verify only vegan recipes show up (or all recipes if filtering not implemented)

**Expected Result**: ✅ Recipes filter by dietary preferences OR all recipes show (both OK for BETA)

---

## ✅ SESSION 4: Final Verification (1 hour)

### **Test 4.1: Fresh Install Test**
**Time**: 20 minutes

1. ☐ Uninstall Cook Smart app completely
2. ☐ Reinstall from APK
3. ☐ Go through complete user flow:
   - Sign up
   - Add ingredients
   - Create shopping list
   - Search recipes
   - Subscribe
   - Use app features
4. ☐ Document any issues

**Expected Result**: ✅ Fresh install works perfectly

---

### **Test 4.2: Data Persistence Test**
**Time**: 15 minutes

1. ☐ Add data to app (ingredients, shopping list, etc.)
2. ☐ Close app completely (force stop)
3. ☐ Reopen app
4. ☐ Verify all data is still there
5. ☐ Restart phone
6. ☐ Open app again
7. ☐ Verify data persists

**Expected Result**: ✅ Data persists across app restarts and phone restarts

---

### **Test 4.3: Stripe Webhook Verification**
**Time**: 15 minutes

1. ☐ I'll check Stripe webhook logs
2. ☐ Verify all payment events were received
3. ☐ Verify subscription status updates correctly
4. ☐ Test webhook failure scenario (I'll simulate)

**Expected Result**: ✅ Webhooks working, subscription status updates

---

### **Test 4.4: Bug Fix Verification**
**Time**: 10 minutes

1. ☐ Test ingredient quantity update (fixed today)
2. ☐ Verify Spanish categories are now English (fixed today)
3. ☐ Test shopping list checkbox (fixed previously)
4. ☐ Verify all previous bugs are still fixed

**Expected Result**: ✅ All previous fixes still working

---

## 👥 SESSION 5: Real User Testing (Optional - 1 hour)

### **Test 5.1: Friend/Family Testing**
**Time**: 30 minutes per person

1. ☐ Give APK to 2-3 friends/family members
2. ☐ Ask them to:
   - Sign up
   - Use the app naturally
   - Report any confusion or issues
3. ☐ Watch them use it (don't help unless stuck)
4. ☐ Document their feedback

**Expected Result**: ✅ Real users can use app without help

---

## 📋 BUG TRACKING TEMPLATE

For each bug found, document:

```
BUG #[number]
Priority: [HIGH/MEDIUM/LOW]
Screen: [Which screen]
Steps to Reproduce:
1. 
2. 
3. 
Expected: [What should happen]
Actual: [What actually happened]
Screenshot: [If applicable]
Error Message: [If any]
```

---

## 🎯 SUCCESS CRITERIA

### **Must Pass (Critical):**
- ✅ Account deletion works (GDPR)
- ✅ Payment failures handled gracefully
- ✅ Subscription cancellation works
- ✅ Stripe webhooks working
- ✅ App doesn't crash on common errors

### **Should Pass (Important):**
- ✅ Offline behavior is acceptable
- ✅ Error messages are helpful
- ✅ Data persists correctly
- ✅ Fresh install works

### **Nice to Pass (Optional):**
- ✅ Recipe filtering works
- ✅ 2FA works (if implemented)
- ✅ Real users can use without help

---

## 📊 RESULTS SUMMARY

After testing, fill this out:

### Critical Tests:
- Account Deletion: ☐ PASS ☐ FAIL
- Payment Failures: ☐ PASS ☐ FAIL
- Subscription Cancellation: ☐ PASS ☐ FAIL
- Stripe Webhooks: ☐ PASS ☐ FAIL

### Important Tests:
- Offline Behavior: ☐ PASS ☐ FAIL
- Error Handling: ☐ PASS ☐ FAIL
- Data Persistence: ☐ PASS ☐ FAIL

### Bugs Found: [number]
- High Priority: [number]
- Medium Priority: [number]
- Low Priority: [number]

### Launch Decision:
- ☐ READY TO LAUNCH - All critical tests passed
- ☐ NEEDS FIXES - Critical bugs found, fix before launch
- ☐ NEEDS MORE TESTING - Unclear results

---

## 🚀 AFTER TESTING

### If All Tests Pass:
1. ✅ Document results
2. ✅ Create launch checklist
3. ✅ Prepare for BETA launch
4. ✅ Celebrate! 🎉

### If Bugs Found:
1. ✅ Prioritize bugs (High/Medium/Low)
2. ✅ Fix high priority bugs first
3. ✅ Re-test after fixes
4. ✅ Document fixes

### If Major Issues Found:
1. ✅ Don't panic - we'll fix them
2. ✅ Document everything
3. ✅ We'll work through fixes together
4. ✅ Re-test until ready

---

## 💡 TIPS FOR TESTING

1. **Take screenshots** of any issues
2. **Document everything** - even small things
3. **Test like a user** - not like a developer
4. **Try to break it** - users will do unexpected things
5. **Don't rush** - thorough testing saves time later
6. **Take breaks** - fresh eyes catch more bugs
7. **Have fun** - you built something awesome!

---

## 📞 SUPPORT

**During Testing:**
- Document issues in this format
- Take screenshots
- Note error messages
- I'll help fix anything we find

**After Testing:**
- We'll review results together
- Prioritize any bugs found
- Create fix plan if needed
- Prepare for launch!

---

**Good luck with testing! You've got this! 🚀**

**Remember**: Finding bugs now is GOOD - it means we catch them before real users do!

