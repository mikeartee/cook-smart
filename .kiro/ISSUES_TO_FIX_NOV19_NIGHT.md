# Issues to Fix - November 19, 2025 (Night)

## Issues Reported

### 1. User Feedback Still Showing Anonymous
**Problem**: Discord notifications show "Anonymous User" even after fix
**Possible Causes**:
- Using public feedback endpoint (no auth required)
- Discord webhook not configured in environment variables
- User not logged in when submitting feedback
**Status**: Need to verify which endpoint is being used

### 2. Points Not Tracking
**Problem**: Points not showing up for users
**Possible Causes**:
- Frontend not fetching points correctly
- Backend not awarding points
- Points API not being called
**Status**: Need to test points flow

### 3. Serving Size Adjustment Not Working
**Problem**: When adjusting servings, ingredient amounts don't update
**Root Cause**: 
- Scaling only works for `extendedIngredients` (Edamam format)
- TheMealDB recipes use simple `ingredients` array (strings)
- No scaling applied to string-based ingredients
**Fix Needed**: Apply scaling to TheMealDB ingredient strings

### 4. Ingredient Availability Indicators Not Working
**Problem**: Green/red indicators not showing for ingredients you have/don't have
**Root Cause**: Feature not implemented yet
**Fix Needed**: 
- Fetch user's ingredients
- Match against recipe ingredients
- Show green dot for ingredients you have
- Show red dot for ingredients you need

---

## Priority Order

1. **HIGH**: Serving size adjustment (affects usability)
2. **HIGH**: Ingredient availability indicators (core feature)
3. **MEDIUM**: Points tracking verification
4. **LOW**: Feedback anonymous issue (may be expected for public endpoint)

---

## Fixes to Implement

### Fix 1: Serving Size for TheMealDB Recipes
- Apply `getScaledAmount()` to TheMealDB ingredient strings
- Parse ingredient strings to extract amounts
- Scale and format properly

### Fix 2: Ingredient Availability Indicators
- Fetch user's ingredients in RecipeDetailScreen
- Create matching logic to compare recipe ingredients with user's pantry
- Update UI to show:
  - Green dot (✓) for ingredients you have
  - Red dot (✗) for ingredients you need
- Add visual distinction

### Fix 3: Verify Points Tracking
- Test adding ingredients → check if points awarded
- Test searching recipes → check if points awarded
- Verify points display in profile

### Fix 4: Feedback User Info
- Check if app is using authenticated endpoint
- Verify user is logged in when submitting feedback
- Check Discord webhook configuration

---

**Created**: November 19, 2025, 8:00 PM
**Status**: Ready to fix
