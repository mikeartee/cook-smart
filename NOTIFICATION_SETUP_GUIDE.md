# Notification System Setup Guide

## Overview
This guide will help you set up Firebase Cloud Messaging for push notifications in Cook Smart.

## Prerequisites
- Firebase project already created (cook-smart-97568)
- `google-services.json` already in place ✅
- Access to Firebase Console

---

## Part 1: Backend Setup (Do This First)

### Step 1: Install Firebase Admin SDK

SSH into your server and run:

```bash
cd /home/ubuntu/cook-smart/backend
npm install firebase-admin
```

### Step 2: Download Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **cook-smart-97568**
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-service-account.json`

### Step 3: Upload Service Account Key to Server

From your local machine:

```bash
scp firebase-service-account.json ubuntu@api.cooksmartapp.com:/home/ubuntu/cook-smart/backend/config/
```

Or manually:
1. Copy the JSON content
2. SSH to server: `ssh ubuntu@api.cooksmartapp.com`
3. Create file: `nano /home/ubuntu/cook-smart/backend/config/firebase-service-account.json`
4. Paste content and save (Ctrl+X, Y, Enter)

### Step 4: Update Backend Environment Variables

```bash
ssh ubuntu@api.cooksmartapp.com
cd /home/ubuntu/cook-smart/backend
nano .env
```

Add this line:
```
FIREBASE_SERVICE_ACCOUNT_PATH=/home/ubuntu/cook-smart/backend/config/firebase-service-account.json
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Replace Old Notification Service

```bash
cd /home/ubuntu/cook-smart/backend/src/services
mv PushNotificationService.ts PushNotificationService.old.ts
mv PushNotificationService.firebase.ts PushNotificationService.ts
```

### Step 6: Rebuild and Restart Backend

```bash
cd /home/ubuntu/cook-smart/backend
npm run build
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 50
```

Look for: `✅ Firebase Admin SDK initialized`

---

## Part 2: App Setup (Build New APK)

### Step 1: Verify Gradle Changes

The following files have been updated:
- ✅ `android/build.gradle` - Added Google Services plugin
- ✅ `android/app/build.gradle` - Applied Google Services plugin

### Step 2: Clean and Build

```bash
cd android
gradlew clean
cd ..
```

### Step 3: Build Release APK

```bash
cd android
gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Install and Test

1. Transfer APK to your phone
2. Install the new version
3. Open app and go to Settings → Notifications
4. Click "Enable Notifications"
5. Grant permission when prompted
6. Check if status changes to "Enabled"

---

## Part 3: Testing Notifications

### Test 1: Check Token Registration

After enabling notifications in the app, check server logs:

```bash
ssh ubuntu@api.cooksmartapp.com
pm2 logs cook-smart-backend --lines 100 | grep "FCM token"
```

You should see: `✅ Registered FCM token for user X`

### Test 2: Send Test Notification

Create a test endpoint or use the database:

```sql
-- Get your user ID
SELECT id FROM users WHERE email = 'your-email@gmail.com';

-- Check if token is registered
SELECT * FROM push_notification_tokens WHERE user_id = YOUR_USER_ID;
```

### Test 3: Trigger Expiry Alert

Add an ingredient that expires soon and wait for the daily check (or manually trigger).

---

## Troubleshooting

### Issue: "Firebase not initialized"

**Check:**
```bash
ssh ubuntu@api.cooksmartapp.com
cat /home/ubuntu/cook-smart/backend/.env | grep FIREBASE
ls -la /home/ubuntu/cook-smart/backend/config/firebase-service-account.json
```

**Fix:** Ensure path is correct and file exists

### Issue: "Permission denied" in app

**Check:**
- AndroidManifest.xml has `POST_NOTIFICATIONS` permission ✅
- User granted permission in system settings
- Try: Settings → Apps → Cook Smart → Notifications → Enable

### Issue: Notifications not received

**Check:**
1. Token registered in database
2. User preferences allow notifications
3. Firebase service account key is valid
4. Server logs show notification sent
5. Phone has internet connection

### Issue: "Invalid registration token"

**Cause:** Token expired or app was reinstalled

**Fix:** App will automatically re-register on next launch

---

## Verification Checklist

### Backend
- [ ] `firebase-admin` installed
- [ ] Service account key uploaded
- [ ] Environment variable set
- [ ] Backend restarted
- [ ] Logs show "Firebase Admin SDK initialized"

### App
- [ ] Google Services plugin added to gradle
- [ ] New APK built with Firebase
- [ ] App installed on device
- [ ] Notifications enabled in app
- [ ] Token registered (check logs)

### End-to-End
- [ ] Test notification sent
- [ ] Notification received on device
- [ ] Preferences can be changed
- [ ] Different notification types work

---

## Cost Verification

✅ **Firebase Cloud Messaging:** FREE (unlimited)
✅ **Firebase Admin SDK:** FREE
✅ **No additional costs**

---

## Next Steps

Once everything is working:
1. Test all notification types (expiry, recipe, achievement, daily)
2. Verify notification preferences work
3. Test on multiple devices
4. Monitor server logs for errors
5. Update app in production

---

## Quick Commands Reference

```bash
# Check backend logs
pm2 logs cook-smart-backend

# Restart backend
pm2 restart cook-smart-backend

# Check Firebase initialization
pm2 logs cook-smart-backend | grep Firebase

# Check token registrations
pm2 logs cook-smart-backend | grep "FCM token"

# Build new APK
cd android && gradlew assembleRelease
```

