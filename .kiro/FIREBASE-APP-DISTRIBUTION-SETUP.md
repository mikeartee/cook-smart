# Firebase App Distribution Setup Guide

## What You've Accomplished So Far

✅ Backend deployed to AWS EC2
✅ Database connected and working
✅ Stripe configured for payments
✅ Subscription system fully operational

## Next: Distribute App to Beta Testers

Firebase App Distribution lets you share your app with testers without going through app stores.

---

## Prerequisites

Before building the app, you need:

**For Android:**
- Java JDK 11 or higher
- Android Studio (or just Android SDK)

**For iOS:**
- Mac computer
- Xcode installed
- Apple Developer account ($99/year)

---

## Step 1: Build the App

### Android Build

1. **Install Java JDK** (if not installed):
   - Download from: https://adoptium.net/
   - Install JDK 11 or 17
   - Set JAVA_HOME environment variable

2. **Build the APK:**
   ```powershell
   cd android
   .\gradlew assembleRelease
   ```

3. **Find your APK:**
   - Location: `android/app/build/outputs/apk/release/app-release.apk`

### iOS Build (requires Mac)

1. **Open in Xcode:**
   ```bash
   cd ios
   open CookSmart.xcworkspace
   ```

2. **Archive the app:**
   - Product → Archive
   - Export as Ad Hoc distribution

---

## Step 2: Set Up Firebase Project

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/

2. **Create New Project:**
   - Click "Add project"
   - Name: "Cook Smart"
   - Disable Google Analytics (optional for beta)
   - Click "Create project"

3. **Add Android App:**
   - Click Android icon
   - Package name: `com.cooksmart` (check android/app/build.gradle)
   - App nickname: "Cook Smart Android"
   - Download `google-services.json`
   - Place in `android/app/` folder

4. **Add iOS App** (if building for iOS):
   - Click iOS icon
   - Bundle ID: (check in Xcode)
   - Download `GoogleService-Info.plist`
   - Add to Xcode project

---

## Step 3: Set Up App Distribution

1. **In Firebase Console:**
   - Click "App Distribution" in left menu
   - Click "Get started"

2. **Upload Your App:**
   - Click "Distribute app"
   - Upload your APK (Android) or IPA (iOS)
   - Add release notes: "Beta v1.0 - Initial release"

3. **Add Testers:**
   - Click "Add testers"
   - Enter email addresses of your beta testers
   - Click "Send invitation"

---

## Step 4: Testers Download the App

**Android:**
1. Testers receive email invitation
2. Click link to install Firebase App Tester app
3. Open Firebase App Tester
4. Download Cook Smart from there

**iOS:**
1. Testers receive email invitation
2. Install TestFlight (if not already installed)
3. Click invitation link
4. Download Cook Smart from TestFlight

---

## Alternative: Quick Test Without Firebase

If you just want to test on your own device quickly:

**Android:**
1. Build APK: `cd android && .\gradlew assembleRelease`
2. Copy APK to your phone
3. Enable "Install from unknown sources"
4. Install the APK

**iOS:**
1. Connect iPhone to Mac
2. Open project in Xcode
3. Select your device
4. Click Run (▶️)

---

## Troubleshooting

**"JAVA_HOME not set":**
- Install Java JDK from https://adoptium.net/
- Set environment variable:
  ```powershell
  [System.Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-17.0.x-hotspot', 'Machine')
  ```

**"Android SDK not found":**
- Install Android Studio
- Or install Android SDK command-line tools

**"Signing key not configured":**
- For testing, you can use debug signing
- For production, generate a release keystore

---

## What's Next After Distribution

Once testers have the app:

1. **Collect Feedback:**
   - Use your Discord webhook for bug reports
   - Track issues in a spreadsheet or GitHub Issues

2. **Iterate:**
   - Fix bugs
   - Add features
   - Build new version
   - Upload to Firebase again

3. **Prepare for Launch:**
   - Get domain name
   - Set up SSL
   - Add Stripe webhook
   - Submit to App Store / Play Store

---

## Cost Summary

- Firebase App Distribution: **FREE**
- AWS Backend: ~$20-30/month
- Apple Developer Account: $99/year (only if doing iOS)
- Google Play Developer: $25 one-time (only when ready for Play Store)
- Domain name: ~$12/year (when ready)

---

## Need Help?

If you get stuck on any step, just ask! The main things you need are:
1. Java installed (for Android builds)
2. Firebase project created
3. APK built and uploaded

You're so close! 🚀
