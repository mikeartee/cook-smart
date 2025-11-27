# 🚀 DEPLOY PRIVACY & SECURITY - Step by Step

## 🎯 YOU NEED TO DO THIS (I can't build APK without Java setup)

---

## PART 1: DEPLOY BACKEND TO PRODUCTION (15 minutes)

### Step 1: Upload Files to EC2

**Upload these files to your EC2 server:**

1. `backend/src/routes/userSettings.ts` → `/path/to/backend/src/routes/`
2. `backend/src/server.ts` → `/path/to/backend/src/`
3. `backend/run-production-migration.js` → `/path/to/backend/`
4. `backend/migrations/add_privacy_settings_to_users.sql` → `/path/to/backend/migrations/`

**How to upload:**
- Use FileZilla, WinSCP, or SCP command
- Or use Git: `git push` then `git pull` on EC2

### Step 2: SSH to EC2 and Run Migration

```bash
# SSH to your server
ssh -i your-key.pem ec2-user@3.237.38.24

# Navigate to backend
cd /path/to/cook-smart/backend

# Run the migration
node run-production-migration.js
# Type "YES" when prompted

# You should see:
# ✅ Migration completed successfully!
# ✅ Verified new columns: data_sharing, analytics_enabled, etc.
```

### Step 3: Restart Backend

```bash
# If using PM2:
pm2 restart cook-smart-backend

# Or if running with npm:
# Kill the current process and restart
npm run dev
```

### Step 4: Verify Backend is Working

```bash
# Test the new endpoint
curl http://3.237.38.24:3000/api/v1/settings/privacy

# Should return: {"error":"Unauthorized"} with status 401
# This means the endpoint exists and is working!
```

---

## PART 2: BUILD APK (10 minutes)

### Step 1: Open Android Studio

1. Open Android Studio
2. Open the `cook-smart` project
3. Wait for Gradle sync to complete

### Step 2: Build Release APK

**In Android Studio:**
1. Click **Build** menu
2. Select **Build Bundle(s) / APK(s)**
3. Click **Build APK(s)**
4. Wait for build to complete (5-10 minutes)

**OR use command line (if Java is set up):**
```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
```

### Step 3: Find the APK

**Location:**
```
android\app\build\outputs\apk\release\app-release.apk
```

**Rename it:**
```
CookSmart-v1.0.23-privacy-security.apk
```

---

## PART 3: TEST BEFORE DISTRIBUTING (5 minutes)

### Step 1: Install on Your Test Device

1. Copy APK to your phone
2. Install it (allow unknown sources if needed)
3. Open the app

### Step 2: Test Privacy & Security

1. Log in to the app
2. Go to **Profile** → **Privacy & Security**
3. Try these:
   - [ ] Toggle "Data Sharing" - should save
   - [ ] Toggle "Analytics" - should save
   - [ ] Tap "Export My Data" - should show success
   - [ ] Tap "Two-Factor Authentication" - should open new screen
   - [ ] Tap "Data Usage Policy" - should open policy

### Step 3: Verify Settings Persist

1. Toggle a switch ON
2. Close the app completely
3. Reopen the app
4. Go back to Privacy & Security
5. The switch should still be ON ✅

---

## PART 4: DISTRIBUTE TO TESTERS (5 minutes)

### Step 1: Upload APK

Upload to your distribution method:
- Google Drive
- TestFlight (if iOS)
- Firebase App Distribution
- Direct download link

### Step 2: Notify Testers

**Message to send:**

```
🎉 Cook Smart v1.0.23 is now available!

What's New:
✅ Privacy & Security features are now fully functional
✅ Control your data sharing preferences
✅ Export your data anytime
✅ Two-factor authentication available
✅ Account deletion option

Download: [your-link-here]

Please test the Privacy & Security section and report any issues!
```

---

## ✅ VERIFICATION CHECKLIST

Before distributing to testers, verify:

- [ ] Backend deployed to EC2
- [ ] Migration ran successfully
- [ ] Backend restarted
- [ ] Endpoint returns 401 (working): `curl http://3.237.38.24:3000/api/v1/settings/privacy`
- [ ] APK built successfully
- [ ] APK installed on test device
- [ ] Logged in successfully
- [ ] Privacy & Security screen loads
- [ ] Switches toggle and save
- [ ] Settings persist after app restart
- [ ] All navigation works (Two-Factor, Data Policy, etc.)

---

## 🆘 TROUBLESHOOTING

### Backend Issues

**Migration fails:**
- Check database credentials in `.env`
- Verify you have write access to database
- Check if columns already exist

**Endpoint returns 404:**
- Verify `userSettings.ts` was uploaded
- Check `server.ts` has the route registered
- Restart backend: `pm2 restart cook-smart-backend`

### APK Build Issues

**Gradle fails:**
- Open Android Studio
- Let it sync Gradle
- Try Build → Build APK again

**APK won't install:**
- Enable "Install from Unknown Sources"
- Check APK isn't corrupted
- Try rebuilding

### App Issues

**Switches don't save:**
- Check backend is running: `curl http://3.237.38.24:3000/health`
- Verify you're logged in
- Check app is using production URL (not localhost)

**401 Unauthorized errors:**
- Normal! Means endpoint exists
- Make sure you're logged in the app
- Token should be sent automatically

---

## 📊 WHAT'S DEPLOYED

### Backend Changes
✅ New route: `/api/v1/settings/*`
✅ 7 new endpoints for privacy settings
✅ Database migration with 6 new columns
✅ GDPR compliance features

### Frontend Changes
✅ Privacy & Security screen updated
✅ Data Policy screen added
✅ Two-Factor Auth screen added
✅ All switches connected to live data
✅ Export and delete account functional

---

## 🎉 DONE!

Once you complete these steps:
- Backend will be live with new features
- Testers will have working Privacy & Security
- All settings will save to database
- GDPR compliance features active

**Estimated total time: 35 minutes**

---

*Need help? Check the console logs or backend PM2 logs for errors*

