# Notification Deployment Checklist

## Pre-Deployment

- [ ] Read `NOTIFICATION_FIX_SUMMARY.md` to understand what was fixed
- [ ] Have SSH access to server working
- [ ] Have Firebase Console access

---

## Step 1: Get Firebase Service Account Key

- [ ] Go to https://console.firebase.google.com/
- [ ] Select project: **cook-smart-97568**
- [ ] Click ⚙️ → Project Settings
- [ ] Go to Service Accounts tab
- [ ] Click "Generate New Private Key"
- [ ] Save as `firebase-service-account.json` in Downloads

---

## Step 2: Run Deployment Script

- [ ] Open Command Prompt in project root
- [ ] Run: `scripts\setup-notifications-complete.bat`
- [ ] When prompted, upload service account key:
  ```bash
  scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" firebase-service-account.json ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/config/
  ```
- [ ] Wait for backend deployment to complete
- [ ] Wait for APK build to complete

---

## Step 3: Verify Backend

- [ ] Check backend logs:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 50"
  ```
- [ ] Look for: `✅ Firebase Admin SDK initialized`
- [ ] No errors about Firebase or service account

---

## Step 4: Install APK on Device

- [ ] APK location: `android\app\build\outputs\apk\release\app-release.apk`
- [ ] Transfer to phone (USB, email, or cloud)
- [ ] Install APK
- [ ] Open app

---

## Step 5: Enable Notifications in App

- [ ] Go to: Settings → Notifications
- [ ] Click "Enable Notifications"
- [ ] Grant permission when Android prompts
- [ ] Status should show "Enabled" ✅

**If it doesn't enable:**
- [ ] Go to Phone Settings → Apps → Cook Smart → Notifications
- [ ] Enable manually
- [ ] Return to app and click "Refresh Status"

---

## Step 6: Verify Token Registration

- [ ] Check backend logs again:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 100 | grep FCM"
  ```
- [ ] Look for: `✅ Registered FCM token for user X`
- [ ] X should be your user ID

---

## Step 7: Test Notification Preferences

- [ ] In app, toggle each notification type:
  - [ ] Expiry Alerts
  - [ ] Recipe Suggestions
  - [ ] Achievement Notifications
  - [ ] Daily Reminders
- [ ] Each toggle should save without errors
- [ ] Check backend logs for preference updates

---

## Step 8: Test Notification Delivery (Optional)

### Option A: Wait for Natural Notification
- [ ] Add ingredient expiring in 2 days
- [ ] Wait for daily check (9 AM server time)
- [ ] Should receive notification

### Option B: Manual Test (Requires Database Access)
- [ ] SSH to server
- [ ] Connect to database
- [ ] Manually trigger notification
- [ ] Verify received on device

---

## Troubleshooting

### Backend Issues

**"Firebase not initialized"**
- [ ] Check service account key exists:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "ls -la /home/ubuntu/cook-smart/backend/config/firebase-service-account.json"
  ```
- [ ] Check environment variable:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cat /home/ubuntu/cook-smart/backend/.env | grep FIREBASE"
  ```
- [ ] Restart backend:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 restart cook-smart-backend"
  ```

**Build errors**
- [ ] Check backend logs for specific error
- [ ] Verify `firebase-admin` installed:
  ```bash
  ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend && npm list firebase-admin"
  ```

### App Issues

**Notifications won't enable**
- [ ] Check Android version (needs Android 13+ for runtime permission)
- [ ] Enable manually in phone settings
- [ ] Reinstall app if needed
- [ ] Check backend logs for errors

**Token not registering**
- [ ] Check app logs (if accessible)
- [ ] Verify internet connection
- [ ] Check backend is running
- [ ] Verify API endpoint is accessible

---

## Success Criteria

All of these should be true:

- [x] Backend logs show "Firebase Admin SDK initialized"
- [ ] App shows "Notifications Enabled"
- [ ] Backend logs show "Registered FCM token for user X"
- [ ] Notification preferences can be toggled
- [ ] No errors in backend logs
- [ ] No errors in app

---

## Post-Deployment

- [ ] Monitor backend logs for 24 hours
- [ ] Test on multiple devices if available
- [ ] Verify daily notifications work (wait for 9 AM)
- [ ] Document any issues found
- [ ] Update production app when confirmed working

---

## Rollback Plan (If Needed)

If something goes wrong:

```bash
# Restore old notification service
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend/src/services && mv PushNotificationService.ts PushNotificationService.firebase.ts && mv PushNotificationService.old.ts PushNotificationService.ts"

# Rebuild and restart
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend && npm run build && pm2 restart cook-smart-backend"
```

---

## Notes

- Firebase Cloud Messaging is **FREE** - no costs
- Service account key is sensitive - keep secure
- Tokens expire if app is uninstalled
- Backend auto-removes invalid tokens

---

## Questions?

Refer to:
- `NOTIFICATION_FIX_SUMMARY.md` - What was fixed
- `NOTIFICATION_DEPLOYMENT_STEPS.md` - Detailed steps
- `NOTIFICATION_SETUP_GUIDE.md` - Complete guide

