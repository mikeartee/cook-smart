# 🚀 Firebase Deployment Checklist

## Status: READY FOR DEPLOYMENT

## Pre-Deployment Checklist

### ✅ Code Complete
- [x] Ingredient management screens
- [x] Recipe search screen
- [x] Recipe detail screen
- [x] Saved recipes screen
- [x] Authentication system
- [x] Co-founder welcome screen
- [x] Music feature (needs DB testing)
- [x] Navigation flow
- [x] Context providers
- [x] Service layer

### ✅ Code Quality
- [x] No TypeScript errors
- [x] No ESLint errors
- [x] Test mode removed from App.tsx
- [x] Clean code structure
- [x] Proper error handling

### ⏳ Backend Setup
- [ ] Spoonacular API key added to `.env`
- [ ] Backend running and tested
- [ ] Database connected
- [ ] All endpoints working

### ⏳ Testing
- [ ] Test on Android device
- [ ] Test on iOS device (if available)
- [ ] Test all user flows
- [ ] Test offline functionality
- [ ] Test error states

## Firebase Setup Steps

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Project
```bash
firebase init
```

Select:
- [ ] Hosting
- [ ] Functions (if using Firebase Functions)
- [ ] Database (if using Firestore)

### 4. Configure Firebase for React Native

**Install Firebase SDK:**
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
```

**Android Setup:**
1. Download `google-services.json` from Firebase Console
2. Place in `android/app/`
3. Update `android/build.gradle`
4. Update `android/app/build.gradle`

**iOS Setup:**
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add to Xcode project
3. Update `ios/Podfile`
4. Run `cd ios && pod install`

### 5. Build Release APK

**Android:**
```bash
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

**iOS:**
```bash
cd ios
xcodebuild -workspace CookSmart.xcworkspace -scheme CookSmart -configuration Release
```

### 6. Deploy Backend

**Option 1: AWS EC2/ECS**
- Deploy Node.js backend
- Configure environment variables
- Set up PostgreSQL RDS
- Configure security groups

**Option 2: Firebase Functions**
- Convert Express app to Firebase Functions
- Deploy with `firebase deploy --only functions`

**Option 3: Heroku (Quick Test)**
```bash
heroku create cook-smart-api
git push heroku main
heroku config:set DATABASE_URL=...
heroku config:set SPOONACULAR_API_KEY=...
```

### 7. Update API URLs

**File:** `src/services/recipeService.ts`, `src/services/ingredientService.ts`, etc.

Change:
```typescript
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.12.196:3000' 
  : 'https://your-production-api-url.com';
```

To your actual production URL.

### 8. Test Production Build

**Android:**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**iOS:**
- Install via TestFlight
- Or install via Xcode

## Distribution Options

### Option 1: Internal Testing (Recommended First)

**Android:**
1. Share APK file directly
2. Users enable "Install from Unknown Sources"
3. Install APK

**iOS:**
1. Use TestFlight
2. Add testers via email
3. They install via TestFlight app

### Option 2: Google Play (Beta)

1. Create Google Play Developer account ($25 one-time)
2. Create app listing
3. Upload APK to Internal Testing track
4. Add testers
5. Distribute

### Option 3: App Store (Beta)

1. Create Apple Developer account ($99/year)
2. Create app in App Store Connect
3. Upload build via Xcode
4. Submit for TestFlight
5. Add testers

### Option 4: Firebase App Distribution (Easiest!)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize App Distribution
firebase init appdistribution

# Upload APK
firebase appdistribution:distribute \
  android/app/build/outputs/apk/release/app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups testers
```

**Benefits:**
- Free
- Easy tester management
- Automatic updates
- Works for both Android and iOS

## Post-Deployment Checklist

### Immediate Testing
- [ ] Test user signup
- [ ] Test user login
- [ ] Test ingredient management
- [ ] Test recipe search
- [ ] Test recipe details
- [ ] Test save/unsave recipes
- [ ] Test co-founder welcome (Briana)
- [ ] Test music feature (Briana)

### Monitor
- [ ] Check backend logs for errors
- [ ] Monitor API usage (Spoonacular)
- [ ] Check database connections
- [ ] Monitor app crashes

### User Feedback
- [ ] Share with Briana
- [ ] Share with beta testers
- [ ] Collect feedback
- [ ] Track issues

## Environment Variables Needed

### Backend `.env`:
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/cook_smart

# JWT
JWT_SECRET=your_secure_jwt_secret_here

# Spoonacular API
SPOONACULAR_API_KEY=your_spoonacular_key_here

# Environment
NODE_ENV=production
PORT=3000

# CORS (if needed)
ALLOWED_ORIGINS=https://your-app-url.com
```

### Frontend (if using .env):
```env
API_BASE_URL=https://your-production-api-url.com
```

## Rollback Plan

If something goes wrong:

1. **Keep old version available**
   - Don't delete previous APK
   - Keep old backend running

2. **Quick fixes**
   - Fix critical bugs
   - Rebuild and redeploy
   - Notify testers

3. **Full rollback**
   - Revert to previous version
   - Notify users
   - Fix issues offline

## Success Metrics

### Day 1:
- [ ] App installs successfully
- [ ] Users can sign up/login
- [ ] Core features work
- [ ] No critical crashes

### Week 1:
- [ ] 5+ active users
- [ ] Positive feedback
- [ ] Feature requests collected
- [ ] Bug list created

### Month 1:
- [ ] 20+ active users
- [ ] Recipe features used regularly
- [ ] Saved recipes growing
- [ ] Ready for public launch

## Cost Tracking

### Current Budget: $20/month

**Expected Costs:**
- AWS RDS (PostgreSQL): $10-15/month (t3.micro)
- AWS EC2 (Backend): $5-10/month (t3.micro)
- Spoonacular API: $0 (free tier)
- Firebase: $0 (free tier)
- **Total:** ~$15-25/month

**If over budget:**
- Use Heroku free tier for backend
- Use free PostgreSQL (ElephantSQL, Supabase)
- Optimize API calls
- Implement more caching

## Next Steps After Deployment

### Phase 2 Features:
1. Discord notifications (3 channels)
2. Feedback form in app
3. Admin dashboard
4. Barcode scanner

### Phase 3 Features:
1. Recipe filters
2. Meal planning
3. Shopping lists
4. Social features

---

**Estimated Deployment Time:** 2-4 hours
**Recommended Approach:** Firebase App Distribution for beta testing
**Status:** ✅ CODE READY - WAITING FOR API KEY & TESTING

