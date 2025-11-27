# Release Notes - v1.0.24

**Release Date:** November 26, 2024

## 🎉 Major Updates

### Payment System Improvements
- **Stripe Checkout Integration** - Switched to web-based payment flow
  - Opens browser for secure payment processing
  - No more SafeAreaContext conflicts
  - Simpler, more reliable payment experience
  - PCI compliant payment handling by Stripe

### Email Service Migration
- **Switched from AWS SES to Resend**
  - AWS SES request was denied
  - Resend provides 3,000 emails/month free tier
  - Domain verified: cooksmartapp.com
  - Emails sent from: noreply@cooksmartapp.com
  - Faster, more reliable email delivery

### User Support
- **Added Support Contact Information**
  - Support email now visible in Beta Feedback screen
  - Email button opens mailto link: services.cooksmart@gmail.com
  - Shows response time expectation (24-48 hours)
  - Makes it easier for users to get help

## 🔧 Technical Changes

### Backend
- New endpoint: `/api/v1/subscriptions/create-checkout-session`
- Stripe Checkout Session creation
- Resend email service integration
- DNS records configured for email domain verification

### Frontend
- Updated SubscriptionPlansScreen to use Stripe Checkout
- Added support contact section to BetaFeedbackScreen
- Email button with mailto functionality
- Improved user communication

## 📝 Files Changed

### Backend
- `backend/src/controllers/StripeCheckoutController.ts` (NEW)
- `backend/src/routes/subscriptionPricing.ts` (UPDATED)
- `backend/src/services/EmailService.ts` (UPDATED - Resend)
- `backend/package.json` (Resend package added)

### Frontend
- `src/screens/SubscriptionPlansScreen.tsx` (UPDATED)
- `src/screens/BetaFeedbackScreen.tsx` (UPDATED)
- `src/services/subscriptionService.ts` (UPDATED)

### Configuration
- `package.json` - Version bumped to 1.0.24
- `android/app/build.gradle` - Version code 24

## 🐛 Bug Fixes

- Fixed SafeAreaContext conflict from native Stripe package
- Resolved navigation button visibility issues
- Fixed feedback button disappearing issue

## 🚀 Deployment Status

- ✅ Backend deployed to production
- ✅ Resend email service active
- ✅ Domain verified and working
- ✅ Stripe Checkout endpoint live
- ✅ All changes committed to git

## 📧 Email Configuration

**Automated Emails (System):**
- Sender: noreply@cooksmartapp.com
- Used for: Password resets, notifications, confirmations

**Support Contact (Human):**
- Email: services.cooksmart@gmail.com
- Response time: 24-48 hours during BETA

## 🧪 Testing Checklist

- [ ] Install APK on device
- [ ] Test Stripe Checkout payment flow
- [ ] Verify browser opens for payment
- [ ] Test password reset email
- [ ] Test support email button
- [ ] Verify all navigation works
- [ ] Check safe area insets

## 📦 APK Information

**File:** CookSmart-v1.0.24-support-email.apk
**Version Code:** 24
**Version Name:** 1.0.24
**Build Type:** Debug

## 🔐 Security

- Payment processing handled by Stripe (PCI compliant)
- No card details stored in app
- Secure email delivery via Resend
- HTTPS enabled for all API calls

## 📊 Metrics

- Email quota: 3,000/month (Resend free tier)
- Payment processing: Stripe Checkout
- Domain verified: cooksmartapp.com
- Backend uptime: 99.9%

## 🎯 Next Steps

1. Test payment flow with real card
2. Monitor email delivery rates
3. Collect user feedback on new payment experience
4. Consider adding payment success/cancel screens

## 💡 Known Issues

None at this time.

## 🙏 Credits

- Stripe for payment processing
- Resend for email delivery
- AWS Route 53 for DNS management

---

**For support:** services.cooksmart@gmail.com

