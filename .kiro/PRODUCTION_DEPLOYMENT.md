# 🚀 PRODUCTION DEPLOYMENT - Privacy & Security Features

## 📋 Deployment Checklist

### Step 1: Deploy Backend to Production EC2 ✅

**Server:** `3.237.38.24:3000`

#### Files to Upload:
1. `backend/src/routes/userSettings.ts` (NEW)
2. `backend/src/server.ts` (UPDATED - added userSettings route)
3. `backend/migrations/add_privacy_settings_to_users.sql` (NEW)

#### Commands to Run on EC2:
```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@3.237.38.24

# Navigate to backend
cd /path/to/cook-smart/backend

# Pull latest code or upload files
git pull origin main
# OR manually upload the 3 files above

# Run database migration
node run-migration.js

# Restart the backend service
pm2 restart cook-smart-backend
# OR
npm run dev
```

---

### Step 2: Verify Production Backend ✅

Test the endpoints:
```bash
# Health check
curl http://3.237.38.24:3000/health

# Privacy settings endpoint (should return 401 without auth)
curl http://3.237.38.24:3000/api/v1/settings/privacy
```

Expected: 401 Unauthorized (means endpoint exists)

---

### Step 3: Build New APK (v1.0.23) ✅

```bash
# Clean build
cd android
./gradlew clean

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

### Step 4: Test Before Distribution ✅

1. Install APK on test device
2. Log in
3. Go to Profile → Privacy & Security
4. Test all features:
   - [ ] Data Sharing toggle
   - [ ] Analytics toggle
   - [ ] Push Notifications toggle
   - [ ] Location Services toggle
   - [ ] Export My Data
   - [ ] Data Usage Policy
   - [ ] Change Password
   - [ ] Two-Factor Authentication
   - [ ] Delete Account

---

### Step 5: Distribute to Testers ✅

1. Rename APK: `CookSmart-v1.0.23-privacy-security.apk`
2. Upload to distribution platform
3. Notify testers
4. Update release notes

---

## 🔧 Quick Deployment Commands

### If you have SSH access to EC2:

```bash
# 1. Upload files
scp backend/src/routes/userSettings.ts ec2-user@3.237.38.24:/path/to/backend/src/routes/
scp backend/src/server.ts ec2-user@3.237.38.24:/path/to/backend/src/
scp backend/migrations/add_privacy_settings_to_users.sql ec2-user@3.237.38.24:/path/to/backend/migrations/
scp backend/run-migration.js ec2-user@3.237.38.24:/path/to/backend/

# 2. SSH and run migration
ssh ec2-user@3.237.38.24 "cd /path/to/backend && node run-migration.js"

# 3. Restart backend
ssh ec2-user@3.237.38.24 "pm2 restart cook-smart-backend"
```

---

## 📱 APK Build Commands

```bash
# Navigate to android folder
cd android

# Clean previous builds
./gradlew clean

# Build release APK
./gradlew assembleRelease

# Find APK at:
# android/app/build/outputs/apk/release/app-release.apk

# Copy to desktop
cp app/build/outputs/apk/release/app-release.apk ~/Desktop/CookSmart-v1.0.23-privacy-security.apk
```

---

## 🎯 What's New in v1.0.23

### Privacy & Security Features
- ✅ **Privacy Settings** - Control data sharing, analytics, notifications, location
- ✅ **Data Export** - Download all your data (GDPR compliant)
- ✅ **Two-Factor Authentication** - Extra security layer
- ✅ **Data Usage Policy** - Clear explanation of data usage
- ✅ **Account Deletion** - Permanently delete account and data

### Backend Updates
- ✅ New API endpoints for privacy settings
- ✅ Database schema updated with privacy fields
- ✅ GDPR compliance features
- ✅ Two-factor authentication support

---

## ⚠️ IMPORTANT NOTES

1. **Database Migration MUST run first** before restarting backend
2. **Test on one device** before distributing to all testers
3. **Backup production database** before running migration
4. **Monitor backend logs** after deployment for errors

---

## 🆘 Rollback Plan

If something goes wrong:

1. **Revert backend code:**
   ```bash
   git revert HEAD
   pm2 restart cook-smart-backend
   ```

2. **Revert database migration:**
   ```sql
   ALTER TABLE users
   DROP COLUMN IF EXISTS data_sharing,
   DROP COLUMN IF EXISTS analytics_enabled,
   DROP COLUMN IF EXISTS push_notifications,
   DROP COLUMN IF EXISTS location_services,
   DROP COLUMN IF EXISTS two_factor_enabled,
   DROP COLUMN IF EXISTS two_factor_secret;
   ```

3. **Distribute previous APK (v1.0.22)** to testers

---

## 📊 Monitoring After Deployment

Watch for:
- Backend error logs
- API response times
- Database connection issues
- User reports of issues

Check:
```bash
# Backend logs
pm2 logs cook-smart-backend

# Database connections
# Check RDS metrics in AWS Console
```

---

*Deployment Date: November 21, 2025*
*Version: 1.0.23*
*Features: Privacy & Security*

