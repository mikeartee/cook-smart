# Notification System Audit & Fix Plan

## Current Status

### ✅ What's Working
1. **Frontend (App)**
   - Firebase dependencies installed (`@react-native-firebase/app`, `@react-native-firebase/messaging`)
   - `google-services.json` exists with valid Firebase project config
   - AndroidManifest has POST_NOTIFICATIONS permission
   - Firebase Messaging service configured in AndroidManifest
   - NotificationSettingsScreen UI implemented
   - Using `notificationService.ts` (full Firebase implementation)

2. **Backend**
   - Notification routes exist (`/api/v1/notifications/*`)
   - Database tables for tokens and preferences
   - Daily notification service for scheduled alerts
   - Preference management working

### ❌ Critical Issues Found

#### Issue #1: Firebase Google Services Plugin Missing
**Problem:** `android/build.gradle` doesn't include the Firebase plugin
**Impact:** Firebase SDK won't initialize properly, tokens can't be generated
**Fix Required:** Add Google Services plugin to gradle files

#### Issue #2: Backend Uses Expo Push API, App Uses Firebase
**Problem:** Backend sends notifications to `https://exp.host/--/api/v2/push/send` (Expo)
**Impact:** Notifications will NEVER be delivered because:
- App generates Firebase FCM tokens
- Backend tries to send to Expo API with FCM tokens
- Expo API rejects FCM tokens (expects Expo tokens)
**Fix Required:** Backend must use Firebase Admin SDK to send FCM notifications

#### Issue #3: No Firebase Admin SDK on Backend
**Problem:** Backend has no `firebase-admin` package
**Impact:** Can't send FCM notifications from server
**Fix Required:** Install and configure Firebase Admin SDK

#### Issue #4: No Firebase Service Account Key
**Problem:** Backend needs Firebase service account JSON for authentication
**Impact:** Can't authenticate with Firebase to send notifications
**Fix Required:** Download service account key from Firebase Console

## Fix Plan (Step-by-Step)

### Phase 1: Fix Android Firebase Configuration (App Side)
1. Add Google Services plugin to `android/build.gradle`
2. Apply plugin in `android/app/build.gradle`
3. Verify Firebase initialization

### Phase 2: Fix Backend Notification Service
1. Install `firebase-admin` package
2. Download Firebase service account key
3. Store service account key securely
4. Replace Expo API calls with Firebase Admin SDK
5. Update `PushNotificationService.ts` to use FCM

### Phase 3: Deploy Backend Changes
1. Upload service account key to server
2. Set environment variable for key path
3. Restart backend service
4. Test notification sending

### Phase 4: Test End-to-End
1. Build new APK with Firebase plugin
2. Install on device
3. Enable notifications
4. Verify token registration
5. Send test notification from backend
6. Confirm notification received

## Cost Analysis
- **Firebase Cloud Messaging:** FREE (unlimited notifications)
- **Firebase Admin SDK:** FREE
- **No additional costs**

## Next Steps
Ready to start Phase 1?

