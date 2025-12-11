# Notification System Deployment - Quick Steps

## 🎯 Complete Automated Setup

Run this ONE command to do everything:

```bash
scripts\setup-notifications-complete.bat
```

This will:
1. ✅ Deploy Firebase backend
2. ✅ Build new APK
3. ✅ Show testing instructions

---

## 📋 Manual Step-by-Step (If Needed)

### Step 1: Get Firebase Service Account Key

1. Go to: https://console.firebase.google.com/
2. Select project: **cook-smart-97568**
3. Click ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save as: `firebase-service-account.json` (in your Downloads folder)

### Step 2: Deploy Backend

```bash
scripts\deploy-firebase-notifications.bat
```

When prompted, upload the service account key:
```bash
scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" firebase-service-account.json ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/config/
```

### Step 3: Build APK

```bash
scripts\build-apk.bat
```

APK will be at: `android\app\build\outputs\apk\release\app-release.apk`

### Step 4: Install & Test

1. Transfer APK to phone
2. Install the app
3. Open app → Settings → Notifications
4. Click "Enable Notifications"
5. Grant permission
6. Verify it shows "Enabled"

### Step 5: Verify Backend

Check logs for token registration:
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 50"
```

Look for:
- ✅ `Firebase Admin SDK initialized`
- ✅ `Registered FCM token for user X`

---

## 🔍 What Changed

### Android App
- ✅ Added Google Services plugin to gradle
- ✅ Firebase will now initialize properly
- ✅ Can generate FCM tokens

### Backend
- ✅ Installed `firebase-admin` package
- ✅ Replaced Expo API with Firebase Cloud Messaging
- ✅ Uses Firebase service account for authentication
- ✅ Sends notifications via FCM (not Expo)

---

## ✅ Verification Checklist

### Backend
- [ ] `firebase-admin` installed
- [ ] Service account key uploaded to `/home/ubuntu/cook-smart/backend/config/`
- [ ] `.env` has `FIREBASE_SERVICE_ACCOUNT_PATH`
- [ ] Backend restarted
- [ ] Logs show "Firebase Admin SDK initialized"

### App
- [ ] New APK built with Firebase plugin
- [ ] APK installed on device
- [ ] Notifications enabled in app
- [ ] Token registered (check backend logs)

### End-to-End
- [ ] Test notification sent
- [ ] Notification received on device

---

## 🐛 Troubleshooting

### "Firebase not initialized" in backend logs

**Check:**
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cat /home/ubuntu/cook-smart/backend/.env | grep FIREBASE"
```

**Fix:**
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "echo 'FIREBASE_SERVICE_ACCOUNT_PATH=/home/ubuntu/cook-smart/backend/config/firebase-service-account.json' >> /home/ubuntu/cook-smart/backend/.env && pm2 restart cook-smart-backend"
```

### Notifications won't enable in app

**Try:**
1. Phone Settings → Apps → Cook Smart → Notifications → Enable
2. Return to app and click "Refresh Status"
3. Reinstall app if needed

### Token not registering

**Check backend logs:**
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend"
```

**Common issues:**
- Service account key missing or invalid
- Environment variable not set
- Firebase project mismatch

---

## 💰 Cost

✅ **FREE** - Firebase Cloud Messaging is completely free with unlimited notifications

---

## 🚀 Quick Commands

```bash
# Deploy everything
scripts\setup-notifications-complete.bat

# Just backend
scripts\deploy-firebase-notifications.bat

# Just build APK
scripts\build-apk.bat

# Check backend logs
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend"

# Restart backend
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 restart cook-smart-backend"

# Install APK via USB
adb install android\app\build\outputs\apk\release\app-release.apk
```

---

## 📞 Next Steps After Deployment

1. Test all notification types:
   - Expiry alerts
   - Recipe suggestions
   - Achievement notifications
   - Daily reminders

2. Verify preferences work:
   - Toggle each notification type
   - Check they save correctly

3. Test on multiple devices if possible

4. Monitor backend logs for any errors

5. Update production app when confirmed working

