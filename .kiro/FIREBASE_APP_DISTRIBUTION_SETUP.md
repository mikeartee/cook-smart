# Firebase App Distribution Setup Guide

## Complete Setup: AWS Backend + Firebase App Distribution

### Overview

**What we're building:**
- AWS ECS/App Runner: Hosts your Node.js backend
- AWS RDS: Hosts your PostgreSQL database
- AWS S3 + CloudFront: Hosts your admin dashboard
- Firebase App Distribution: Distributes your mobile app to testers

**Cost:** $0 (AWS covered by credits, Firebase is free)

---

## Part 1: Firebase Setup (15 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `cook-smart` (or whatever you prefer)
4. Click "Continue"
5. Disable Google Analytics (not needed for app distribution)
6. Click "Create project"
7. Wait for project creation (~30 seconds)
8. Click "Continue"

### Step 2: Add Android App to Firebase

1. In Firebase Console, click the Android icon (robot)
2. Register your app:
   - **Android package name:** `com.cooksmart` (must match your app)
   - **App nickname:** Cook Smart
   - **Debug signing certificate:** Leave blank for now
3. Click "Register app"
4. Download `google-services.json`
5. Click "Next" → "Next" → "Continue to console"

### Step 3: Add google-services.json to Your Project

```bash
# Move the downloaded file to your android/app folder
# Windows:
move %USERPROFILE%\Downloads\google-services.json android\app\

# Verify it's in the right place
dir android\app\google-services.json
```

### Step 4: Update Android Build Files

**File: `android/build.gradle`**

Add Google services classpath:

```gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 21
        compileSdkVersion = 33
        targetSdkVersion = 33
        ndkVersion = "23.1.7779620"
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:7.3.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
        classpath("com.google.gms:google-services:4.3.15")  // ADD THIS LINE
    }
}
```

**File: `android/app/build.gradle`**

Add plugin at the bottom:

```gradle
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

// ... rest of your config ...

dependencies {
    // ... your existing dependencies ...
}

apply plugin: 'com.google.gms.google-services'  // ADD THIS LINE AT THE VERY BOTTOM
```

### Step 5: Enable App Distribution in Firebase

1. In Firebase Console, go to "Release & Monitor" → "App Distribution"
2. Click "Get started"
3. You'll see the App Distribution dashboard

### Step 6: Create Tester Group

1. In App Distribution, click "Testers & Groups" tab
2. Click "Add group"
3. Group name: `beta-testers`
4. Click "Create group"
5. Click "Add testers"
6. Enter tester emails (one per line):
   ```
   your-email@example.com
   tester1@example.com
   tester2@example.com
   ```
7. Click "Add testers"

---

## Part 2: Install Firebase CLI (5 minutes)

### Step 1: Install Firebase Tools

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Step 2: Login to Firebase

```bash
# Login (opens browser)
firebase login

# Follow the prompts:
# 1. Allow Firebase to collect CLI usage data? (Y/n): n
# 2. Browser opens - select your Google account
# 3. Click "Allow"
# 4. Return to terminal - you should see "Success!"
```

### Step 3: Get Your Firebase App ID

```bash
# List your Firebase projects
firebase projects:list

# You should see your cook-smart project
```

**Or get it from Firebase Console:**
1. Go to Firebase Console
2. Click gear icon → Project settings
3. Scroll down to "Your apps"
4. Copy the "App ID" (looks like `1:123456789:android:abc123def456`)

---

## Part 3: Build Your APK (5 minutes)

### Step 1: Update App Version

**File: `android/app/build.gradle`**

```gradle
android {
    defaultConfig {
        applicationId "com.cooksmart"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1          // Increment this for each release
        versionName "1.0.0"    // Update this for each release
    }
}
```

### Step 2: Update API URL for Production

**File: `src/config/api.ts`** (create if doesn't exist)

```typescript
// src/config/api.ts
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.12.196:3000'  // Local development
  : 'https://your-aws-api.com';    // Production AWS URL (we'll set this up later)

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/api/auth`,
  ingredients: `${API_BASE_URL}/api/ingredients`,
  recipes: `${API_BASE_URL}/api/recipes`,
  feedback: `${API_BASE_URL}/api/feedback`,
  barcode: `${API_BASE_URL}/api/barcode`,
};
```

### Step 3: Build Release APK

```bash
# Navigate to android folder
cd android

# Clean previous builds
.\gradlew clean

# Build release APK
.\gradlew assembleRelease

# APK will be at:
# android\app\build\outputs\apk\release\app-release.apk
```

**Expected output:**
```
BUILD SUCCESSFUL in 2m 15s
```

### Step 4: Verify APK

```bash
# Check APK exists
dir app\build\outputs\apk\release\app-release.apk

# Check APK size (should be 20-40 MB)
```

---

## Part 4: Upload to Firebase (2 minutes)

### Step 1: Upload APK

```bash
# Navigate back to project root
cd ..

# Upload to Firebase App Distribution
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk ^
  --app YOUR_FIREBASE_APP_ID ^
  --groups "beta-testers" ^
  --release-notes "Cook Smart Beta v1.0.0 - Initial release with ingredient tracking, recipe search, and barcode scanning"
```

**Replace `YOUR_FIREBASE_APP_ID`** with your actual App ID from Step 3 above.

**Expected output:**
```
✔ uploading APK
✔ creating release
✔ adding testers/groups
✔ sending notifications

Release created successfully!
View release: https://console.firebase.google.com/...
```

### Step 2: Verify Upload

1. Go to Firebase Console → App Distribution
2. You should see your release listed
3. Status should be "Sent to testers"

---

## Part 5: Testers Download App (Tester Instructions)

### What Testers Will Receive

**Email from Firebase:**
```
Subject: You're invited to test Cook Smart

Cook Smart Beta v1.0.0 is ready to test!

Release notes:
Initial release with ingredient tracking, recipe search, and barcode scanning

[Download] button
```

### Tester Installation Steps

**Step 1: Enable Unknown Sources**
1. Open Settings on Android phone
2. Go to Security or Apps
3. Enable "Install unknown apps" or "Unknown sources"
4. Select your browser (Chrome, Firefox, etc.)
5. Toggle "Allow from this source"

**Step 2: Download APK**
1. Open email from Firebase
2. Click "Download" button
3. APK downloads to phone

**Step 3: Install App**
1. Open Downloads folder
2. Tap on `app-release.apk`
3. Tap "Install"
4. Wait for installation
5. Tap "Open"

**Step 4: Use App**
1. Create account or login
2. Start using Cook Smart!
3. Provide feedback via in-app feedback button

---

## Part 6: Releasing Updates

### When You Have a New Version

**Step 1: Update Version Numbers**

**File: `android/app/build.gradle`**

```gradle
android {
    defaultConfig {
        versionCode 2          // Increment by 1
        versionName "1.0.1"    // Update version
    }
}
```

**Step 2: Build New APK**

```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
cd ..
```

**Step 3: Upload to Firebase**

```bash
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk ^
  --app YOUR_FIREBASE_APP_ID ^
  --groups "beta-testers" ^
  --release-notes "v1.0.1 - Bug fixes and performance improvements"
```

**Step 4: Testers Get Notified**
- Firebase sends email to all testers
- Testers download and install update
- Automatic!

---

## Part 7: Managing Testers

### Add New Testers

**Via Firebase Console:**
1. Go to App Distribution → Testers & Groups
2. Click "beta-testers" group
3. Click "Add testers"
4. Enter email addresses
5. Click "Add testers"

**Via CLI:**
```bash
firebase appdistribution:testers:add tester@example.com --group beta-testers
```

### Remove Testers

**Via Firebase Console:**
1. Go to App Distribution → Testers & Groups
2. Click "beta-testers" group
3. Select tester
4. Click "Remove"

**Via CLI:**
```bash
firebase appdistribution:testers:remove tester@example.com
```

### View Tester Activity

1. Go to App Distribution → Releases
2. Click on a release
3. See who downloaded it and when

---

## Part 8: AWS Backend Deployment (Next Step)

### Overview

Now that app distribution is set up, you need to deploy your backend to AWS.

**What you'll deploy:**
1. Node.js backend to ECS or App Runner
2. PostgreSQL database to RDS
3. Admin dashboard to S3 + CloudFront

**We'll cover this in the next guide:** `.kiro/AWS_DEPLOYMENT_GUIDE.md`

---

## Troubleshooting

### Issue: "App not installed" error

**Solution:**
- Uninstall any previous version of the app
- Make sure "Unknown sources" is enabled
- Try downloading again

### Issue: Firebase CLI not found

**Solution:**
```bash
# Reinstall Firebase CLI
npm install -g firebase-tools

# Verify
firebase --version
```

### Issue: Build failed

**Solution:**
```bash
# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleRelease
```

### Issue: Testers not receiving emails

**Solution:**
- Check spam folder
- Verify email addresses in Firebase Console
- Resend invitation from Firebase Console

### Issue: APK too large

**Solution:**
- Enable ProGuard (code shrinking)
- Remove unused resources
- Use APK splits for different architectures

---

## Quick Reference Commands

### Build APK
```bash
cd android
.\gradlew assembleRelease
cd ..
```

### Upload to Firebase
```bash
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk ^
  --app YOUR_FIREBASE_APP_ID ^
  --groups "beta-testers" ^
  --release-notes "Your release notes here"
```

### Add Tester
```bash
firebase appdistribution:testers:add tester@example.com --group beta-testers
```

### List Projects
```bash
firebase projects:list
```

### Login
```bash
firebase login
```

---

## Complete Workflow Summary

### Initial Setup (One Time)
1. ✅ Create Firebase project
2. ✅ Add Android app
3. ✅ Download google-services.json
4. ✅ Update build.gradle files
5. ✅ Install Firebase CLI
6. ✅ Login to Firebase
7. ✅ Create tester group

### Each Release
1. Update version numbers
2. Build APK
3. Upload to Firebase
4. Testers get notified automatically
5. Testers download and install

### Ongoing
- Add/remove testers as needed
- Monitor downloads and feedback
- Release updates regularly

---

## Next Steps

1. ✅ Complete Firebase App Distribution setup (this guide)
2. ⏭️ Deploy backend to AWS (next guide)
3. ⏭️ Deploy admin dashboard to S3
4. ⏭️ Update mobile app API URL
5. ⏭️ Build and distribute first beta
6. ⏭️ Collect feedback and iterate

---

## Cost Summary

**Firebase App Distribution:** $0 (FREE)
- Unlimited testers
- Unlimited releases
- Automatic notifications
- Tester management
- Release analytics

**AWS Backend:** $12/month → $0 with credits (9-10 months)
- ECS/App Runner for backend
- RDS for database
- S3 + CloudFront for admin dashboard

**Total Cost:** $0 for 9-10 months, then $12/month

---

## Support Resources

**Firebase Documentation:**
- [App Distribution Docs](https://firebase.google.com/docs/app-distribution)
- [CLI Reference](https://firebase.google.com/docs/cli)

**React Native:**
- [Building APK](https://reactnative.dev/docs/signed-apk-android)
- [Publishing](https://reactnative.dev/docs/publishing-to-google-play-store)

**Your Project:**
- Admin Dashboard: (will be deployed to S3)
- Backend API: (will be deployed to AWS)
- Discord Support: (your Discord webhooks)

---

## Success Checklist

- [ ] Firebase project created
- [ ] Android app added to Firebase
- [ ] google-services.json in android/app/
- [ ] build.gradle files updated
- [ ] Firebase CLI installed
- [ ] Logged into Firebase
- [ ] Tester group created
- [ ] APK built successfully
- [ ] APK uploaded to Firebase
- [ ] Testers received email
- [ ] Testers installed app
- [ ] App connects to backend (after AWS deployment)

**Once all checked, you're ready to deploy your backend to AWS!**
