# Comprehensive Cleanup Plan

## Files to Delete

### Root Directory Test Files
- test-email-service.js
- test-payment-a1.js
- test-privacy-endpoints.js
- test-checkout-session.json

### Root Directory Test/Debug Screens (src/)
- src/screens/QATestingScreen.tsx
- src/screens/TestScreen.tsx
- src/utils/testingUtils.ts
- src/setupTests.ts

### Backend Test Files
- backend/test-admin-endpoint.js
- backend/test-admin-login.js
- backend/test-feedback-with-image.js
- backend/test-resend-email.js
- backend/test-subscription-fix.js
- backend/src/routes/__tests__/recipes.test.ts
- backend/src/services/__tests__/TheMealDBService.test.ts

### Unnecessary Documentation (Outdated/Redundant)
- APK_BUILD_IN_PROGRESS.md
- BUILD-NEW-APK.txt
- DEPLOY_BACKEND_COMMANDS.txt
- DEPLOY_BACKEND_NOW.md
- DEPLOY_HTTPS_COMPLETE.md
- DEPLOY_PASSWORD_RESET_NOW.md
- DEPLOY_POINTS_TABLES.md
- DEPLOYMENT_COMPLETE.md
- DEPLOYMENT_SUMMARY_v1.0.28.md
- EMAIL_SETUP_COMPLETE.md
- HTTPS_SETUP_COMPLETE.md
- INSTALL_THIS_APK_v1.0.21.txt
- INSTALL_v1.0.28.md
- PASSWORD_RESET_DEPLOYED.md
- PAYMENT_INTEGRATION_MISSING.md
- PAYMENT_LIFECYCLE_TESTING.md
- PAYMENT_TESTING_SETUP.md
- PAYMENT_TEST_RESULTS.md
- SESSION_SUMMARY_NOV23.md
- SESSION_SUMMARY_NOV27.md
- TODAY_SUMMARY.md
- WEEKEND_TESTING_PLAN.md
- WHAT_NEEDS_FIXING.md

### Old Release Notes (Keep only latest)
- RELEASE_NOTES_v1.0.20.md
- RELEASE_NOTES_v1.0.22.md
- RELEASE_NOTES_v1.0.24.md

### Deployment Scripts (Outdated)
- deploy-admin-fixes.bat
- deploy-backend-fixes.ps1
- deploy-password-reset.bat
- deploy-password-reset.ps1
- deploy-payment-fix.bat
- deploy-resend-email.bat
- deploy-shopping-fix-manual.bat
- deploy-shopping-list-fix.bat
- deploy-stripe-checkout.bat
- deploy-subscription-fix.bat
- quick-deploy-password-reset.ps1
- setup-password-reset-env.ps1

### Build Scripts (Outdated)
- build-password-reset-apk.bat

### Old APK Files
- CookSmart-v1.0.21-admin-all-live-data.apk
- CookSmart-v1.0.22-debug.apk
- CookSmart-v1.0.22-substitution-selection.apk
- CookSmart-v1.0.23-step2-stripe-provider.apk

### Backup Files
- App.tsx.backup

### Test Assets Folder
- test-assets/ (entire folder)

### Setup/Config Files (Completed)
- add-resend-dns-records.json
- create-dns-record.json
- configure-ses.sh
- setup-https-automated.bat
- setup-https-manual.bat
- setup-https-on-ec2.sh
- test-checkout-session.json

### Redundant Documentation
- RESEND_QUICK_START.md
- RESEND_SETUP_INSTRUCTIONS.md
- SETUP_AWS_SES_EMAIL.md
- SETUP_HTTPS_NOW.md
- SETUP_LIVE_WEBHOOK.md
- SETUP_WEBHOOK_NOW.md
- setup-stripe-webhook.md

### Feature-Specific Docs (Completed Features)
- COMPREHENSIVE_FEATURE_AUDIT.md
- DIETARY_ALLERGY_FIX.md
- DIETARY_SYSTEM_VERIFICATION.md
- FEEDBACK_IMAGE_FIX.md
- FEEDBACK_IMAGE_VERIFICATION.md
- FIX_NAVIGATION_BUTTONS.md
- FIX_SUBSCRIPTION_PAYMENT_ERROR.md
- INGREDIENT_QUANTITY_UPDATE_FIX.md
- INGREDIENT_SUBSTITUTION_SELECTION_PLAN.md
- SHOPPING_CART_CRASH_FIX.md
- SHOPPING_CART_FINAL_FIX.md
- SHOPPING_LIST_CHECKBOX_FIX.md
- SHOPPING_LIST_TO_PANTRY_FEATURE.md
- SPANISH_CATEGORY_FIX.md
- STRIPE_CHECKOUT_IMPLEMENTATION.md
- STRIPE_CHECKOUT_STATUS.md
- STRIPE_LIVE_STATUS.md
- STRIPE_PAYMENT_FIX_PLAN.md
- SUBSCRIPTION_FIX_SUMMARY.md
- SUBSTITUTION_SELECTION_COMPLETE.md
- TEST_SHOPPING_TOGGLE.md
- WEBHOOK_SOLUTION.md

## Files to Keep

### Essential Documentation
- README.md
- CHANGELOG.md
- LICENSE
- DESCRIPTION.md
- TODO.md
- QUICK_REFERENCE.md
- QUICK_FIX_GUIDE.md
- QUICK_START_v1.0.20.md
- MUSIC_SETUP_GUIDE.md
- RELEASE_NOTES_v1.0.28.md (latest)

### Legal/Policy Documents
- ACCEPTABLE_USE_POLICY.md
- ACCESSIBILITY_STATEMENT.md
- COMMUNITY_GUIDELINES.md
- COOKIE_POLICY.md
- COPYRIGHT.md
- DATA_PROCESSING_AGREEMENT.md
- DMCA_POLICY.md
- EULA.md
- PRIVACY_POLICY.md
- REFUND_POLICY.md
- TERMS_OF_SERVICE.md

### Essential Build Scripts
- build-apk.bat
- build-apk.ps1
- run-android.bat
- restart-app-fresh.ps1

### Configuration Files
- .env.example
- .eslintignore
- .eslintrc.js
- .gitignore
- .prettierrc.js
- app.json
- babel.config.js
- eslint.config.js
- jest.config.js
- metro.config.js
- package.json
- package-lock.json
- react-native.config.js
- tsconfig.json

### Source Code
- App.tsx
- index.js
- src/ (except test files)
- backend/ (except test files)
- android/
- assets/
- infrastructure/
- admin-dashboard/

### Special User Screen (Keep - it's a feature)
- src/screens/SpecialUserWelcomeScreen.tsx

## Total Files to Delete: ~100+

