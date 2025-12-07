# Recipe Caching System Improvements

**Date:** December 6, 2025
**Status:** ✅ Deployed to Production

## Overview

Enhanced the recipe caching system with duplicate prevention, FatSecret integration for trending recipes, and automatic refresh scheduling.

## Key Improvements

### 1. Duplicate Prevention ✅

**Problem:** Recipes could be cached multiple times from different sources, wasting database space.

**Solution:**
- Added title-based duplicate check before caching
- If recipe with same title exists, only update timestamp
- ON CONFLICT clause prevents duplicate recipe_ids
- Maintains view_count on updates (uses GREATEST to preserve engagement)

**Code:**
```typescript
// Check if recipe already exists by title
const existingRecipe = await pool.query(
  'SELECT recipe_id FROM recipe_cache WHERE LOWER(title) = LOWER($1) LIMIT 1',
  [title],
);

if (existingRecipe.rows.length > 0) {
  // Just update timestamp, don't create duplicate
  await pool.query(
    'UPDATE recipe_cache SET updated_at = CURRENT_TIMESTAMP WHERE recipe_id = $1',
    [existingRecipe.rows[0].recipe_id],
  );
  return;
}
```

**Benefits:**
- No duplicate recipes in database
- Cleaner search results
- Better database performance
- Preserves engagement metrics

### 2. FatSecret as Primary for Everything ✅

**Why FatSecret:**
- Largest database (1M+ recipes)
- Comprehensive nutrition data
- Generous free tier
- Better recipe variety
- Best for user searches

**Implementation:**
- FatSecret is PRIMARY for all user searches (via FatSecretProviderAdapter)
- FatSecret used directly in RecipeCacheService for trending/popular recipes
- Spoonacular as fallback (good multi-ingredient search)
- TheMealDB as final fallback (free unlimited)

**Strategy:**
```
Search Flow:
1. Check cache first
2. Try FatSecret (largest database - PRIMARY)
3. Fallback to Spoonacular (good search)
4. Final fallback to TheMealDB (unlimited)

Trending Flow:
1. FatSecret popular recipes (largest database)
2. Cache with initial engagement boost
3. Calculate trending scores
```

**Adapter Pattern:**
- Created FatSecretProviderAdapter to implement IRecipeProvider interface
- Allows FatSecret to work seamlessly with RecipeProviderService
- Maintains consistent API across all providers

### 3. Automatic Trending Refresh ✅

**Problem:** Trending recipes become stale, what's popular changes over time.

**Solution:**
- Scheduled refresh twice daily (6 AM and 6 PM)
- Rotates through categories and popular searches
- Reduces scores for older recipes to make room for fresh content
- Fetches 65+ recipes per refresh for variety

**Schedule:**
```typescript
// Runs every hour, executes at 6 AM and 6 PM
const refreshTrending = () => {
  const now = new Date();
  const hour = now.getHours();
  if (hour === 6 || hour === 18) {
    RecipeCacheService.fetchTrendingFromFatSecret(true);
  }
};
```

**Refresh Process:**
1. Reduce scores for recipes older than 7 days (multiply by 0.5)
2. Fetch fresh recipes from 5 categories (dinner, dessert, breakfast, lunch, snack)
3. Fetch recipes from 5 popular searches (chicken, pasta, salad, soup, cake)
4. Give new recipes initial engagement (100 views, 10 saves)
5. Recalculate all trending scores

**Benefits:**
- Always fresh trending content
- Variety across meal types
- Reflects current popularity
- Automatic with no manual intervention

### 4. Enhanced Recipe Parsing ✅

**Improvements:**
- Handles multiple API formats (FatSecret, Spoonacular, TheMealDB)
- Robust ingredient parsing for all formats
- Comprehensive instruction parsing
- Graceful fallbacks for missing data

**Supported Formats:**
```typescript
// Ingredients
- FatSecret: recipe.ingredients.ingredient[]
- Spoonacular: recipe.ingredients[] (array)
- TheMealDB: recipe.strIngredient1-20

// Instructions
- FatSecret: recipe.directions.direction[]
- Spoonacular: recipe.instructions (string or array)
- Spoonacular: recipe.analyzedInstructions[] (detailed)
- TheMealDB: recipe.strInstructions
```

## Technical Details

### Database Schema

**recipe_cache table:**
- `recipe_id` (PRIMARY KEY) - Format: `{source}_{id}`
- `title` - Used for duplicate detection
- `source` - API source (fatsecret, spoonacular, themealdb)
- `trending_score` - Calculated engagement score
- `view_count`, `save_count`, `share_count` - Engagement metrics
- `updated_at` - Last update timestamp

### Trending Score Formula

```sql
trending_score = (
  (view_count * 1.0) + 
  (save_count * 3.0) + 
  (share_count * 5.0)
) * time_decay_factor

time_decay_factor:
- < 7 days: 1.0
- 7-14 days: 0.7
- 14-30 days: 0.4
- > 30 days: 0.2
```

### Caching Strategy

**When recipes are cached:**
1. User searches for recipes → Cache results
2. User views recipe details → Cache if not present
3. Trending refresh (6 AM, 6 PM) → Cache popular recipes
4. Seasonal fetch → Cache seasonal recipes

**Cache Priority:**
- Seasonal recipes: Priority 10
- Regular recipes: Priority 5
- Trending recipes: Initial boost (100 views, 10 saves)

## Performance Impact

### Before
- Duplicate recipes wasting space
- Stale trending content
- Manual trending updates needed
- Limited recipe variety

### After
- ✅ No duplicates (title-based check)
- ✅ Fresh trending content (twice daily)
- ✅ Automatic updates (no manual work)
- ✅ 65+ new recipes per refresh
- ✅ Variety across categories and searches

## API Usage

### FatSecret Usage
- Trending refresh: ~70 API calls per refresh
- Twice daily: ~140 calls/day
- Well within free tier limits
- Largest recipe database available

### Spoonacular Usage
- User searches only
- Cache-first strategy reduces calls
- 150 free requests/day limit
- Used for better search capabilities

### TheMealDB Usage
- Fallback only
- Free unlimited
- Rarely needed with cache-first strategy

## Monitoring

**Check trending refresh:**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 logs cook-smart-backend --lines 100 --nostream" | grep -i "trending"
```

**Check cache stats:**
```sql
SELECT 
  source,
  COUNT(*) as recipe_count,
  AVG(trending_score) as avg_score,
  MAX(updated_at) as last_updated
FROM recipe_cache
GROUP BY source;
```

**Check duplicates:**
```sql
SELECT title, COUNT(*) as count
FROM recipe_cache
GROUP BY title
HAVING COUNT(*) > 1;
```

## Future Enhancements

### Potential Improvements
1. User-specific trending (based on preferences)
2. Regional trending (popular in user's location)
3. Seasonal trending (adjust by current season)
4. Time-of-day trending (breakfast in morning, dinner in evening)
5. Dietary-specific trending (vegan, keto, etc.)

### Monitoring Additions
1. Track trending refresh success rate
2. Monitor duplicate prevention effectiveness
3. Measure cache hit rate improvements
4. Track API usage per source

## Deployment

**Files Modified:**
- ✅ `backend/src/services/RecipeCacheService.ts` - Duplicate prevention, trending refresh
- ✅ `backend/src/server.ts` - Scheduled trending refresh
- ✅ `backend/src/routes/recipes.ts` - Updated comments

**Deployed:** December 6, 2025
**Status:** Production stable
**Next Refresh:** 6 PM today (automatic)

## Summary

Successfully implemented a robust recipe caching system that:
- Prevents duplicates automatically
- Uses FatSecret's massive database for trending content
- Refreshes trending recipes twice daily
- Handles multiple API formats seamlessly
- Requires zero manual intervention

The system now provides fresh, varied, and popular recipe content automatically while minimizing API usage through intelligent caching.

