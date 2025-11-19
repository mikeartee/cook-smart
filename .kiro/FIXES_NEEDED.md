# Fixes Needed - November 19, 2025

## Issues Identified

### 1. ✅ Recipe Click Crashes App (FIXED)
**Problem**: App crashes when clicking on recipes from TheMealDB
**Root Cause**: RecipeDetailScreen expects `extendedIngredients` and `analyzedInstructions` but TheMealDB returns `ingredients` (array) and `instructions` (string)
**Fix Applied**: Updated RecipeDetailScreen.tsx to handle both data formats
**Status**: Code fixed, needs testing

### 2. ⏳ Points System Not Tracking (PARTIALLY FIXED)
**Problem**: Points not showing for users
**Root Cause**: 
- Backend tracking is working (points awarded on ingredient add and recipe search)
- Frontend is using mock data instead of fetching real points
**Fix Applied**: Created `src/services/pointsService.ts`
**Still Needed**: Update ProfileScreen to use real points data instead of mock data
**Status**: Service created, needs integration

### 3. ❌ Privacy Policy & Terms of Service Missing (NOT FIXED)
**Problem**: No actual Privacy Policy or Terms of Service documents
**Current State**: Screens reference them but they don't exist
**Needed**: 
- Create PrivacyPolicyScreen.tsx
- Create TermsOfServiceScreen.tsx
- Add legal documents content
- Link from signup/login screens
**Status**: Not started

### 4. ✅ Special User Pages Not Showing (VERIFIED WORKING)
**Problem**: Briana and mom's special pages not appearing
**Root Cause Check**: 
- Backend correctly checks emails:
  - Briana: brianaolszewski1@gmail.com (is_co_founder)
  - Mom: dwoodswoods2@gmail.com (is_special_user)
- Frontend has special buttons in HomeScreen
- Special welcome screens exist
**Possible Issue**: Users may need to log out and log back in for flags to update
**Status**: Code is correct, may be user session issue

### 5. ❌ Subscription Pre-Purchase Not Working (NEEDS INVESTIGATION)
**Problem**: Yearly subscription at discounted rate not working
**Current State**: 
- Frontend has subscription service
- Backend has subscription endpoints
- Stripe integration exists
**Needed**: 
- Test subscription flow end-to-end
- Check Stripe webhook configuration
- Verify payment processing
**Status**: Needs testing and debugging

## Priority Order

1. **HIGH**: Recipe crash fix (DONE - needs APK)
2. **HIGH**: Points system integration (service created, needs ProfileScreen update)
3. **MEDIUM**: Privacy/TOS documents (legal requirement)
4. **LOW**: Special user verification (likely just needs re-login)
5. **MEDIUM**: Subscription testing (needs investigation)

## Next Steps

1. Update ProfileScreen to use real points data
2. Create Privacy Policy and Terms of Service screens
3. Test special user login with correct emails
4. Test subscription flow with Stripe
5. Build new APK when all fixes are complete

## Files Modified

- ✅ src/screens/recipes/RecipeDetailScreen.tsx
- ✅ src/services/pointsService.ts (created)
- ⏳ src/screens/ProfileScreen.tsx (needs update)
- ❌ src/screens/PrivacyPolicyScreen.tsx (needs creation)
- ❌ src/screens/TermsOfServiceScreen.tsx (needs creation)

---

**Last Updated**: November 19, 2025, 5:30 PM
