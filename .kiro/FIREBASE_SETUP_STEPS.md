# Firebase App Distribution - Step-by-Step Guide

## 📍 Current Status
✅ APK built successfully: `android/app/build/outputs/apk/release/app-release.apk`
✅ Barcode scanner working with new library
✅ Backend deployed and running

---

## Step 1: Create Firebase Project (5 minutes)

### 1.1 Go to Firebase Console
Open your browser and go to: **https://console.firebase.google.com/**

### 1.2 Sign In
- Sign in with your Google account
- (Use the same account you want to manage the project with)

### 1.3 Create New Project
1. Click **"Add project"** or **"Create a project"**
2. **Project name**: Enter `Cook Smart`
3. Click **"Continue"**

### 1.4 Google Analytics (Optional)
1. You'll see "Enable Google Analytics for this project?"
2. **Toggle it OFF** (not needed for beta testing)
3. Click **"Create project"**
4. Wait ~30 seconds for project creation
5. Click **"Continue"** when ready

---

## Step 2: Add Android App to Firebase (3 minutes)

### 2.1 Add Android App
1. On the Firebase project overview page
2. Click the **Android icon** (looks like a robot)
3. Or click **"Add app"** → **"Android"**

### 2.2 Register App
Fill in the form:

**Android package name**: `com.cooksmartfresh`
- ⚠️ Must match exactly (case-sensitive)
- This is your app's unique identifier

**App nickname (optional)**: `Cook Smart Android`
- Just for your reference in Firebase

**Debug signing certificate SHA-1 (optional)**: Leave blank
- Not needed for App Distribution

Click **"Register app"**

### 2.3 Download google-services.json
1. Click **"Download google-services.json"**
2. Save the file to your Downloads folder
3. **IMPORTANT**: You'll need to move this file in the next step
4. Click **"Next"** (you can skip the SDK setup steps)
5. Click **"Next"** again
6. Click **"Continue to console"**

---

## Step 3: Add google-services.json to Your Project (2 minutes)

### 3.1 Locate the File
The file you just downloaded is in your Downloads folder: `google-services.json`

### 3.2 Copy to Project
**Copy** `google-services.json` to:
```
C:\Users\toota\Documents\Projects\cook-smart\android\app\
```

The file should be at:
```
cook-smart/
  android/
    app/
      google-services.json  ← HERE
      build.gradle
      src/
```

### 3.3 Verify
Open File Explorer and check that the file is in the right location.

---

## Step 4: Set Up App Distribution (3 minutes)

### 4.1 Navigate to App Distribution
1. In Firebase Console (left sidebar)
2. Click **"Release & Monitor"** section
3. Click **"App Distribution"**
4. Click **"Get started"**

### 4.2 Upload Your APK
1. Click **"Distribute app"** or **"Upload"** button
2. Click **"Select file"** or drag and drop
3. Navigate to: `C:\Users\toota\Documents\Projects\cook-smart\android\app\build\outputs\apk\release\`
4. Select **`app-release.apk`**
5. Click **"Open"**
6. Wait for upload to complete (~1-2 minutes for 103 MB file)

### 4.3 Add Release Notes
In the "Release notes" field, enter:
```
Beta v1.0 - Initial Release

Features:
- User authentication
- Recipe browsing and search
- Barcode scanning for products
- Meal planning
- Shopping lists
- Subscription system

This is a beta version for testing. Please report any issues!
```

Click **"Next"**

---

## Step 5: Add Beta Testers (2 minutes)

### 5.1 Add Testers by Email
1. You'll see "Add testers" section
2. Click **"Add testers"**
3. Enter email addresses (one per line or comma-separated):
   ```
   your.email@example.com
   tester1@example.com
   tester2@example.com
   ```
4. Click **"Add"**

### 5.2 Create Tester Group (Optional but Recommended)
1. Or click **"Create group"**
2. Group name: `Beta Testers`
3. Add emails to the group
4. Click **"Save"**
5. Select the group for this release

### 5.3 Distribute
1. Review everything
2. Click **"Distribute"** button
3. Wait for confirmation

---

## Step 6: Testers Receive and Install (Tester Instructions)

### 6.1 Testers Get Email
Your testers will receive an email from Firebase with subject:
**"You've been invited to test Cook Smart"**

### 6.2 Testers Install Firebase App Tester
**On Android Phone:**
1. Open the invitation email
2. Click **"Get started"** or **"Download the app"**
3. Install **"Firebase App Tester"** from Google Play Store
4. Open Firebase App Tester app
5. Sign in with the email that received the invitation

### 6.3 Testers Download Cook Smart
1. In Firebase App Tester, they'll see "Cook Smart"
2. Tap **"Download"**
3. Tap **"Install"** when download completes
4. Open Cook Smart and start testing!

---

## Alternative: Direct Install (For Quick Testing)

If you want to test on your own phone right now without Firebase:

### Option A: USB Transfer
1. Connect your Android phone to computer via USB
2. Copy `app-release.apk` to phone's Downloads folder
3. On phone: Open Files app → Downloads
4. Tap `app-release.apk`
5. Allow "Install from unknown sources" if prompted
6. Tap "Install"

### Option B: Cloud Transfer
1. Upload `app-release.apk` to Google Drive or Dropbox
2. On phone: Download the APK from Drive/Dropbox
3. Tap the downloaded file
4. Allow "Install from unknown sources" if prompted
5. Tap "Install"

---

## Troubleshooting

### "Package name doesn't match"
- Make sure you entered `com.cooksmartfresh` exactly
- Check `android/app/build.gradle` for `applicationId`

### "google-services.json not found"
- Verify file is in `android/app/` folder
- File name must be exactly `google-services.json`

### "Upload failed"
- Check internet connection
- Try uploading again
- File size is 103 MB, may take 1-2 minutes

### Testers don't receive email
- Check spam folder
- Verify email address is correct
- Resend invitation from Firebase Console

---

## What's Next?

After testers install:
1. **Collect feedback** - Ask testers to report bugs and suggestions
2. **Monitor usage** - Check Firebase Analytics (if enabled)
3. **Fix issues** - Make updates based on feedback
4. **Upload new version** - Repeat Step 4 with new APK

---

## Summary Checklist

- [ ] Create Firebase project
- [ ] Add Android app to Firebase
- [ ] Download google-services.json
- [ ] Copy google-services.json to android/app/
- [ ] Set up App Distribution
- [ ] Upload APK
- [ ] Add release notes
- [ ] Add tester emails
- [ ] Click Distribute
- [ ] Testers receive email and install

---

## Need Help?

If you get stuck on any step, just let me know which step number and I'll help you through it!

**Ready to start? Begin with Step 1!** 🚀
