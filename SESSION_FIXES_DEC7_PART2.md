# Session Fixes - December 7, 2025 (Part 2)

## Issues Fixed

### 1. Meal Type Filters Not Working ✅

**Problem**: When filtering recipes by meal type (Breakfast, Lunch, Dinner, Snack), the app was returning 0 results even though "All" filter showed recipes.

**Root Cause**: HTTP caching was interfering with filtered searches. The backend was returning HTTP 304 (Not Modified) responses, which meant the client was using cached results from previous searches instead of making fresh API calls with the new filters.

**Solution**: Disabled HTTP caching for the recipe search endpoint by adding cache-control headers:
```typescript
res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
res.set('Pragma', 'no-cache');
res.set('Expires', '0');
```

**Files Modified**:
- `backend/src/routes/recipes.ts` - Added cache-control headers to `/search` endpoint

**Status**: Deployed to production ✅

---

### 2. "I Cooked This" Button Failing ✅

**Problem**: When marking a recipe as cooked, the app showed an error and the action failed.

**Root Cause**: The code was trying to parse userId as an integer using `parseInt()`, but userId is actually a string like `user_1763454524090_w2r1tkuyb`. This resulted in `NaN` being inserted into the database, which violated the foreign key constraint.

**Solution**: Changed userId type from `number` to `string` in both the route handler and service methods:
- Removed `parseInt()` call in route handler
- Changed parameter type from `number` to `string` in service methods
- Removed unnecessary `.toString()` conversion

**Files Modified**:
- `backend/src/routes/recipeEnhancements.ts` - Fixed userId handling in cooking history endpoints
- `backend/src/services/RecipeEnhancementService.ts` - Changed userId parameter type to string

**Status**: Deployed to production ✅

---

## Testing Instructions

### Test Meal Type Filters:
1. Open the app
2. Go to Recipe Search
3. Tap the filter button (top right)
4. Select "Breakfast" and tap "Apply Filters"
5. **Expected**: Should show breakfast recipes (not 0 results)
6. Try other meal types (Lunch, Dinner, Snack)
7. **Expected**: Each should show relevant recipes

### Test "I Cooked This" Button:
1. Open any recipe detail page
2. Tap "I Cooked This" button
3. **Expected**: Success message, button changes to "Cooked ✓"
4. Check cooking history to verify it was recorded

---

## Technical Details

### Why HTTP Caching Was the Issue

The logs showed requests like:
```
GET /api/v1/recipes/search?ingredients=...&maxCalories=500&mealType=Main+Dishes HTTP/1.1" 304
```

The `304 Not Modified` response meant the HTTP client (OkHttp in React Native) was reusing cached responses based on ETag/Last-Modified headers. This bypassed our application-level cache logic entirely.

By adding `Cache-Control: no-store`, we ensure every filter change triggers a fresh API call to FatSecret.

### Why userId Was NaN

The authentication middleware sets `req.user.id` as a string (e.g., `user_1763454524090_w2r1tkuyb`), but the code was calling:
```typescript
const userId = parseInt(req.user!.id as string); // Results in NaN
```

The database table `recipe_cooking_history` has a foreign key constraint to the `users` table, which expects a valid user_id. Inserting `NaN` violated this constraint.

---

## Deployment

Both fixes deployed to production backend at `api.cooksmartapp.com`:
- Commit 7a51577: HTTP caching fix
- Commit d84f38d: userId type fix
- Backend rebuilt and PM2 restarted
- Changes are live immediately (no APK rebuild needed)

---

## Next Steps

User should test both fixes:
1. Try all meal type filters (Breakfast, Lunch, Dinner, Snack)
2. Try marking recipes as cooked
3. Report any remaining issues

If meal type filters still return 0 results, we may need to investigate FatSecret API's `recipe_types` parameter further or consider alternative filtering approaches.

