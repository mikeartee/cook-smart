# 🚨 URGENT: Deploy Privacy & Security to Production

## ⚡ FASTEST DEPLOYMENT PATH

### Option A: If Backend is Already on EC2 with Git

```bash
# 1. Commit and push changes
git add .
git commit -m "feat: Privacy & Security features - LIVE"
git push origin main

# 2. SSH to EC2 and pull
ssh your-ec2-key "cd /path/to/cook-smart/backend && git pull && node run-migration.js && pm2 restart all"
```

### Option B: Manual File Upload (If No Git)

**Upload these 3 files to EC2:**
1. `backend/src/routes/userSettings.ts`
2. `backend/src/server.ts` 
3. `backend/run-migration.js`

**Then SSH and run:**
```bash
cd /path/to/backend
node run-migration.js
pm2 restart cook-smart-backend
```

### Option C: Backend Already Has the Code

If you already deployed backend code, just need to:
```bash
# Run migration on production database
node run-migration.js

# Restart backend
pm2 restart cook-smart-backend
```

---

## 📱 BUILD APK NOW

```bash
# Windows PowerShell
cd android
.\gradlew clean
.\gradlew assembleRelease

# APK will be at:
# android\app\build\outputs\apk\release\app-release.apk

# Rename and move to desktop
Copy-Item android\app\build\outputs\apk\release\app-release.apk ~\Desktop\CookSmart-v1.0.23.apk
```

---

## ✅ VERIFICATION STEPS

### 1. Test Production Backend
```bash
curl http://3.237.38.24:3000/api/v1/settings/privacy
```
Should return: `401 Unauthorized` (means it's working)

### 2. Install APK on Test Device
- Install the new APK
- Log in
- Go to Privacy & Security
- Toggle a switch
- Should save!

---

## 🎯 WHAT TESTERS WILL SEE

**New in v1.0.23:**
- Privacy & Security section fully functional
- All toggles save settings
- Export data works
- Two-factor authentication available
- Account deletion works

---

## 📞 NEED HELP?

**Backend not updating?**
- Check if files uploaded correctly
- Verify migration ran: `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='data_sharing';`
- Check PM2 logs: `pm2 logs`

**APK build failing?**
- Run: `cd android && ./gradlew clean`
- Try again: `./gradlew assembleRelease`

**Switches not saving?**
- Backend must be restarted after code upload
- Migration must run before restart
- Check production backend is at `3.237.38.24:3000`

---

*Time to deploy: ~10 minutes*
*Time to build APK: ~5 minutes*
*Total: ~15 minutes to live*

