# 🚀 Quick Start Guide - Deploy Cook Smart Tonight!

## 30-Minute Path to Testing

### Step 1: Get Spoonacular API Key (5 min)
1. Go to https://spoonacular.com/food-api
2. Sign up (free)
3. Get your API key
4. Add to `backend/.env`:
   ```env
   SPOONACULAR_API_KEY=your_key_here
   ```

### Step 2: Start Backend (2 min)
```bash
cd backend
npm run dev
```

Verify it's running: http://localhost:3000

### Step 3: Test Backend (3 min)
```bash
# Test recipe search (replace TOKEN with your auth token)
curl -X GET "http://localhost:3000/api/v1/recipes/search?ingredients=chicken,rice" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return recipes!

### Step 4: Build Android APK (10 min)
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Step 5: Install on Device (5 min)
```bash
# Connect Android device via USB
adb install android/app/build/outputs/apk/release/app-release.apk
```

Or share APK file and install manually.

### Step 6: Test! (5 min)
1. Open app
2. Sign up or login
3. Add ingredients
4. Search recipes
5. View recipe details
6. Save a recipe
7. Check saved recipes

**Done!** 🎉

---

## Alternative: Test in Development Mode

### Faster for Testing (5 min)
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start Metro
npx react-native start

# Terminal 3: Run on device
npx react-native run-android
```

**Benefits:**
- Faster iteration
- Hot reload
- Debug mode
- Console logs

**Drawbacks:**
- Need USB connection
- Not "production" experience

---

## What to Test

### Critical Features:
- [ ] User signup
- [ ] User login
- [ ] Add ingredient
- [ ] View ingredients
- [ ] Delete ingredient
- [ ] Search recipes (needs API key!)
- [ ] View recipe details
- [ ] Save recipe
- [ ] View saved recipes
- [ ] Delete saved recipe

### Special Features:
- [ ] Co-founder welcome (Briana only)
- [ ] Music feature (Briana only, needs DB)
- [ ] BETA badge visible
- [ ] Crown badge for co-founder

### Edge Cases:
- [ ] No ingredients → empty state
- [ ] No recipes found → empty state
- [ ] No saved recipes → empty state
- [ ] Network error → error state
- [ ] Offline mode → saved recipes work

---

## Troubleshooting

### "API key invalid"
- Check `.env` file
- Restart backend
- Verify key on Spoonacular dashboard

### "No recipes found"
- Check backend logs
- Verify API key is working
- Try different ingredients

### "Build failed"
- Check Java is installed
- Check Android SDK is set up
- Run `npx react-native doctor`

### "App crashes on open"
- Check backend is running
- Check API URL is correct
- Check logs: `adb logcat`

---

## Share with Briana

### Option 1: APK File
1. Build APK (see Step 4 above)
2. Share file via email/drive
3. She installs manually
4. She tests and provides feedback

### Option 2: Development Mode
1. She connects device via USB
2. You run `npx react-native run-android`
3. App installs automatically
4. She tests with hot reload

### Option 3: Firebase App Distribution
1. Upload APK to Firebase
2. Add her email as tester
3. She gets email with install link
4. She installs and tests

**Recommended:** Option 1 (APK) for first test

---

## After Testing

### Collect Feedback:
- What works well?
- What's confusing?
- What's missing?
- Any bugs?
- Feature requests?

### Fix Critical Issues:
- Crashes
- Login problems
- Core feature bugs

### Plan Next Steps:
- Discord notifications
- Admin dashboard
- Barcode scanner
- Public launch

---

## Production Deployment (Later)

When ready for real users:

1. **Deploy Backend:**
   - AWS EC2/ECS
   - Or Heroku
   - Or Firebase Functions

2. **Update API URLs:**
   - Change in service files
   - Rebuild app

3. **Set Up Distribution:**
   - Firebase App Distribution
   - Or Google Play (Internal Testing)
   - Or TestFlight (iOS)

4. **Add Monitoring:**
   - Discord notifications
   - Error tracking
   - Usage analytics

5. **Scale:**
   - Add more testers
   - Collect feedback
   - Iterate
   - Public launch!

---

**Current Status:** ✅ Ready for testing
**Next Action:** Get Spoonacular API key
**Time to First Test:** 30 minutes
**Let's do this!** 🚀

