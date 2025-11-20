# Remaining Issues - November 20, 2025

## ✅ FIXED - Subscription Login Issue
**Problem**: "User must be logged in" error when trying to subscribe
**Fix**: Changed `AsyncStorage.getItem('userToken')` to `AsyncStorage.getItem('auth_token')` in subscriptionService.ts
**Status**: Fixed in code, needs new APK build

## 🔧 TODO - Points Not Showing
**Problem**: Points aren't visible/tracking for users
**Location**: ProfileScreen.tsx shows points but backend may not be tracking
**Needs**:
- Verify backend points endpoints are working
- Check if points are being awarded for actions
- Test points display in profile

## 🔧 TODO - Add "Other" Option to Dietary/Allergies
**Problem**: Users need custom options for allergies/dietary restrictions not in the list
**Location**: DietaryPreferencesScreen.tsx
**Needs**:
- Add "Other" option with text input field
- Allow users to type custom allergies
- Allow users to type custom dietary restrictions
- Save custom entries to backend

## 🔧 TODO - Special Welcome Screen for Briana & Mom
**Problem**: Special welcome screen not showing for specific users
**Needs**:
- Find/create the special welcome screen component
- Check user detection logic (email/username matching)
- Verify navigation flow for these users

## Files Modified (Ready to Commit):
- ✅ src/services/subscriptionService.ts (auth_token fix)

## Next Steps:
1. Commit subscription fix
2. Add "Other" option to dietary preferences
3. Fix points tracking/display
4. Fix special welcome screen
5. Build new APK with all fixes

---

**Created**: November 20, 2025, 1:00 AM
