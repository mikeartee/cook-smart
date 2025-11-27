# Social & Advanced Features Testing Checklist

**Date:** December 2024  
**Status:** Pre-Deployment Testing

## 🎯 Testing Strategy

1. **Deploy Backend First** - Run migrations and restart server
2. **Test Backend APIs** - Verify all endpoints work
3. **Test Frontend Locally** - Run app and test each feature
4. **Fix Any Issues** - Address problems before APK build
5. **Build APK** - Only after all tests pass

---

## Phase 1: Backend Deployment & Testing

### Step 1.1: Deploy Backend to Production

```bash
# SSH into server
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24

# Navigate to backend
cd /home/ubuntu/cook-smart/backend

# Pull latest code
git pull origin fresh-project-migration

# Run migrations
node run-social-migrations.js

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Restart server
pm2 restart cook-smart-backend

# Check status
pm2 status
pm2 logs cook-smart-backend --lines 50
```

**Expected Results:**
- [ ] Git pull successful
- [ ] Migrations run without errors
- [ ] Build completes successfully
- [ ] PM2 restart successful
- [ ] No errors in logs

### Step 1.2: Test Backend Health

```bash
# Health check
curl https://api.cooksmartapp.com/health

# Expected: {"status":"OK",...}
```

**Expected Results:**
- [ ] Health endpoint returns 200 OK
- [ ] Database connected: true

---

## Phase 2: Backend API Testing

### 2.1 Social API - Trending Recipes

```bash
# Test trending endpoint (no auth required)
curl https://api.cooksmartapp.com/api/v1/social/trending
```

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Returns JSON with `success: true`
- [ ] Returns empty array or trending recipes

**Possible Issues:**
- 500 error → Check database connection
- 404 error → Route not registered
- Empty response → Normal if no data yet

### 2.2 Social API - Comments (Requires Auth)

```bash
# Get comments for a recipe (no auth required)
curl https://api.cooksmartapp.com/api/v1/social/comments/52772

# Expected: {"success":true,"comments":[]}
```

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Returns empty array (no comments yet)

### 2.3 Advanced Recipes API - Seasonal

```bash
# Get current seasonal recipes
curl https://api.cooksmartapp.com/api/v1/advanced-recipes/seasonal/current/recipes
```

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Returns current season (spring/summer/fall/winter)
- [ ] Returns empty array or seasonal recipes

### 2.4 Advanced Recipes API - Nutrition

```bash
# Get nutrition for a recipe
curl https://api.cooksmartapp.com/api/v1/advanced-recipes/nutrition/52772
```

**Expected Results:**
- [ ] Returns 200 OK
- [ ] Returns null or nutrition data

---

## Phase 3: Frontend Local Testing

### Step 3.1: Start Frontend

```bash
# On local machine
cd c:\Users\toota\Documents\Projects\cook-smart

# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

**Expected Results:**
- [ ] Metro bundler starts without errors
- [ ] App builds successfully
- [ ] App launches on device/emulator
- [ ] No red screen errors

### Step 3.2: Check for Import Errors

**Watch for:**
- [ ] No "Cannot find module" errors
- [ ] No TypeScript errors
- [ ] No missing component errors
- [ ] App loads to home screen

**Common Issues:**
- Missing imports → Check file paths
- TypeScript errors → Check types
- Component not found → Check navigation

---

## Phase 4: Feature Testing

### 4.1 Home Screen - Quick Actions

**Test Steps:**
1. Open app
2. Check home screen loads
3. Verify new quick action buttons appear:
   - [ ] Trending (🔥 icon)
   - [ ] Seasonal (☀️ icon)
   - [ ] Community (👥 icon)

**Expected Results:**
- [ ] All buttons visible
- [ ] Icons display correctly
- [ ] Tap each button navigates to correct screen

**Possible Issues:**
- Buttons missing → Check HomeScreen.tsx
- Navigation error → Check MainTabNavigator.tsx
- Icons not showing → Check react-native-vector-icons

### 4.2 Trending Recipes Screen

**Test Steps:**
1. Tap "Trending" from home screen
2. Wait for recipes to load

**Expected Results:**
- [ ] Screen loads without errors
- [ ] Shows "No trending recipes yet" (if empty)
- [ ] Pull-to-refresh works
- [ ] Can navigate back

**Possible Issues:**
- Blank screen → Check API connection
- Error message → Check backend logs
- Can't go back → Check navigation

### 4.3 Seasonal Recipes Screen

**Test Steps:**
1. Tap "Seasonal" from home screen
2. Check season detection

**Expected Results:**
- [ ] Screen loads without errors
- [ ] Shows current season (spring/summer/fall/winter)
- [ ] Shows season emoji (🌸/☀️/🍂/❄️)
- [ ] Shows "No seasonal recipes yet" (if empty)

**Possible Issues:**
- Wrong season → Check date logic
- No emoji → Check season detection
- API error → Check backend

### 4.4 Community Feed Screen

**Test Steps:**
1. Tap "Community" from home screen
2. Check feed loads

**Expected Results:**
- [ ] Screen loads without errors
- [ ] Shows "No activity yet" (if empty)
- [ ] Shows "Follow users to see their activity" message
- [ ] Pull-to-refresh works

**Possible Issues:**
- Auth error → Check token
- Blank screen → Check API
- Can't refresh → Check service

### 4.5 Recipe Detail - Social Actions

**Test Steps:**
1. Navigate to any recipe (Recipes tab → Search → Select recipe)
2. Scroll to social actions section
3. Check like button
4. Check share button

**Expected Results:**
- [ ] Like button visible (heart icon)
- [ ] Like count shows (0 initially)
- [ ] Share button visible
- [ ] Tap like → heart fills, count increases
- [ ] Tap again → heart unfills, count decreases
- [ ] Tap share → native share dialog opens

**Possible Issues:**
- Buttons missing → Check RecipeDetailScreen integration
- Like doesn't work → Check auth token
- Share crashes → Check Share API
- Count doesn't update → Check API response

### 4.6 Recipe Detail - Comments

**Test Steps:**
1. On recipe detail screen
2. Scroll to comments section
3. Type a comment
4. Tap send button

**Expected Results:**
- [ ] Comments section visible
- [ ] Shows "Comments (0)"
- [ ] Input field works
- [ ] Send button enabled when text entered
- [ ] Comment appears after sending
- [ ] Shows username and timestamp

**Possible Issues:**
- Section missing → Check RecipeDetailScreen
- Can't type → Check TextInput
- Send fails → Check auth/API
- Comment doesn't appear → Check refresh

### 4.7 Recipe Detail - Step-by-Step Button

**Test Steps:**
1. On recipe detail screen
2. Find "Step-by-Step" button (next to "I Cooked This!")
3. Tap button

**Expected Results:**
- [ ] Button visible and styled correctly
- [ ] Tap opens StepByStepCookingScreen
- [ ] Shows first step
- [ ] Progress bar at 0%
- [ ] "Next" button works
- [ ] "Previous" button disabled on first step

**Possible Issues:**
- Button missing → Check RecipeDetailScreen
- Navigation fails → Check route registration
- Steps don't show → Check recipe data
- Progress bar broken → Check calculation

### 4.8 Step-by-Step Cooking Mode

**Test Steps:**
1. In step-by-step mode
2. Tap "Next" through all steps
3. Check progress bar updates
4. Check timer display (if recipe has timers)
5. Complete all steps

**Expected Results:**
- [ ] Steps navigate correctly
- [ ] Progress bar updates (e.g., "Step 2 of 5")
- [ ] Progress fill increases
- [ ] "Previous" button works
- [ ] Last step shows "Complete" button
- [ ] Completion shows success message

**Possible Issues:**
- Steps skip → Check currentStep state
- Progress wrong → Check calculation
- Timers missing → Normal if not added yet
- Complete fails → Check session API

### 4.9 Navigation Integration

**Test Steps:**
1. Test all navigation paths:
   - Home → Trending → Recipe Detail
   - Home → Seasonal → Recipe Detail
   - Home → Community → Recipe Detail
   - Recipe Detail → Step-by-Step → Back
   - Recipe Detail → Comments → Back

**Expected Results:**
- [ ] All navigation works smoothly
- [ ] Back button works everywhere
- [ ] No navigation stack issues
- [ ] No crashes

**Possible Issues:**
- Can't go back → Check navigation setup
- Wrong screen → Check route names
- Crash on navigate → Check params

---

## Phase 5: Error Scenarios

### 5.1 Network Errors

**Test Steps:**
1. Turn off WiFi/data
2. Try to like a recipe
3. Try to comment
4. Try to load trending

**Expected Results:**
- [ ] Shows error message (not crash)
- [ ] Can retry when network returns
- [ ] App doesn't freeze

### 5.2 Authentication Errors

**Test Steps:**
1. Log out and log back in
2. Try social features
3. Check token refresh

**Expected Results:**
- [ ] Features work after re-login
- [ ] Token persists correctly
- [ ] No auth errors

### 5.3 Empty States

**Test Steps:**
1. Check all empty states:
   - Trending with no recipes
   - Seasonal with no recipes
   - Community with no activity
   - Recipe with no comments

**Expected Results:**
- [ ] All show helpful empty messages
- [ ] Icons display correctly
- [ ] No blank screens

---

## Phase 6: Performance Testing

### 6.1 Load Times

**Test:**
- [ ] Home screen loads < 2 seconds
- [ ] Trending loads < 3 seconds
- [ ] Recipe detail loads < 2 seconds
- [ ] Comments load < 2 seconds

### 6.2 Smooth Scrolling

**Test:**
- [ ] Community feed scrolls smoothly
- [ ] Trending list scrolls smoothly
- [ ] Comments scroll smoothly
- [ ] No lag or stuttering

### 6.3 Memory Usage

**Test:**
- [ ] App doesn't crash after extended use
- [ ] No memory leaks
- [ ] Images load properly

---

## Phase 7: Integration Testing

### 7.1 Existing Features Still Work

**Test:**
- [ ] Ingredient management works
- [ ] Recipe search works
- [ ] Saved recipes work
- [ ] Shopping list works
- [ ] Profile works
- [ ] Meal planning works
- [ ] Holiday features work

### 7.2 No Regressions

**Test:**
- [ ] No new errors in console
- [ ] No broken layouts
- [ ] No missing features
- [ ] All buttons work

---

## Testing Results Template

### ✅ Passed Tests
- List all tests that passed

### ❌ Failed Tests
- List all tests that failed
- Include error messages
- Include steps to reproduce

### ⚠️ Issues Found
- List any bugs or problems
- Severity: Critical / High / Medium / Low
- Steps to fix

### 📝 Notes
- Any observations
- Performance issues
- UX improvements needed

---

## Quick Test Commands

### Backend Health
```bash
curl https://api.cooksmartapp.com/health
```

### Backend Logs
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 100"
```

### Frontend Logs
```bash
# In Metro bundler terminal
# Watch for errors in red
```

### Database Check
```bash
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>
\dt  # List tables
SELECT COUNT(*) FROM user_follows;
SELECT COUNT(*) FROM recipe_comments;
SELECT COUNT(*) FROM recipe_likes;
```

---

## Decision Points

### After Testing, Decide:

1. **All Tests Pass** ✅
   - Proceed to APK build
   - Document any minor issues for future

2. **Minor Issues Found** ⚠️
   - Fix issues
   - Re-test affected features
   - Then proceed to APK build

3. **Major Issues Found** ❌
   - Fix critical bugs
   - Re-test completely
   - Consider rollback if needed

---

## Next Steps After Testing

1. Document all test results
2. Fix any issues found
3. Re-test fixes
4. Build APK when all clear
5. Distribute to beta testers

**Ready to start testing!** 🚀
