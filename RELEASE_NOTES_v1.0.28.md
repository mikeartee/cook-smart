# Cook Smart v1.0.28 - Password Reset Feature

## Release Date
November 27, 2025

## What's New

### 🔐 Forgot Password Feature
Users can now reset their password if they forget it!

**How it works:**
1. Tap "Forgot Password?" on the login screen
2. Enter your email address
3. Receive a 6-digit verification code via email
4. Enter the code in the app
5. Set your new password
6. Login immediately with your new password

**Features:**
- ✅ Email-based password reset
- ✅ 6-digit verification codes
- ✅ Secure token system (1-hour expiration)
- ✅ Professional email templates
- ✅ Fast delivery (10-30 seconds)

### 🎨 New Screens
- **Forgot Password Screen** - Request password reset
- **Reset Password Screen** - Enter code and set new password

### 🔒 Security Improvements
- Verification codes expire after 1 hour
- Single-use tokens (can't reuse codes)
- Secure password hashing
- Rate limiting on reset requests
- No account enumeration (same response for all emails)

## Technical Details

### Backend Updates
- New API endpoints: `/api/v1/password/forgot-password` and `/api/v1/password/reset-password`
- Email service integration with Resend
- Database table for password reset tokens
- Email templates with Cook Smart branding

### Frontend Updates
- ForgotPasswordScreen component
- ResetPasswordScreen component
- Updated navigation flow
- Email validation
- Password strength requirements

## Bug Fixes
None - this is a new feature release

## Known Issues
None

## Upgrade Notes
- No data migration required
- Existing users can use forgot password immediately
- No breaking changes

## Testing
Tested with:
- Gmail, Outlook, Yahoo email providers
- Various email clients (web, mobile, desktop)
- Different network conditions
- Multiple password reset attempts

## Support
If you have issues with password reset:
1. Check your spam folder
2. Verify email address is correct
3. Wait 30 seconds for email delivery
4. Contact support if code doesn't arrive

## Version Info
- **Version:** 1.0.28
- **Build Date:** November 27, 2025
- **Min Android:** 5.0 (API 21)
- **Target Android:** 14 (API 34)

## Installation
1. Download: `CookSmart-v1.0.28-password-reset.apk`
2. Enable "Install from Unknown Sources"
3. Install the APK
4. Open Cook Smart
5. Try the forgot password feature!

---

**Previous Version:** 1.0.24  
**Changes:** Added forgot password feature with email verification

