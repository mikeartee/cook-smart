# Session Expiration Fix

## Problem
Users were experiencing "Session expired. Please log in again." errors when clicking on ingredients, even after logging out and back in. The app was not properly handling expired JWT tokens.

## Root Cause
JWT tokens expire after 7 days (configured in `backend/src/middleware/auth.ts`). When a token expires:
1. Backend correctly returns 401/403 status
2. Frontend shows error message
3. **BUT** the app doesn't automatically log the user out
4. User remains in a broken state where they appear logged in but can't access protected resources

## Solution
Added automatic session expiration handling:

### 1. Created Utility Functions (`src/utils/auth.ts`)
- `isSessionExpiredError()` - Detects session expiration from error messages
- `isSessionExpiredStatus()` - Detects session expiration from HTTP status codes

### 2. Updated IngredientContext (`src/contexts/IngredientContext.tsx`)
- Added `handleSessionExpired()` callback that:
  - Shows alert to user
  - Automatically logs them out
  - Redirects to login screen
- Integrated session check in all API calls:
  - `fetchIngredients()`
  - `addIngredient()`
  - `updateIngredient()`
  - `deleteIngredient()`

## How It Works Now
1. User's token expires (after 7 days)
2. User tries to access ingredients
3. Backend returns 401/403
4. Frontend detects session expiration
5. Shows alert: "Your session has expired. Please log in again."
6. Automatically logs user out
7. User is redirected to login screen
8. User logs in with fresh token
9. Everything works again

## Testing
1. Install updated app
2. Wait for token to expire OR manually delete token from backend
3. Try to access ingredients
4. Should see alert and be logged out automatically
5. Log back in
6. Ingredients should load normally

## Future Improvements
Consider implementing:
- Token refresh mechanism (refresh before expiration)
- Longer token expiration (30 days instead of 7)
- Remember me functionality
- Background token validation

## Files Modified
- `src/utils/auth.ts` - Added session expiration detection utilities
- `src/contexts/IngredientContext.tsx` - Added automatic logout on session expiration

