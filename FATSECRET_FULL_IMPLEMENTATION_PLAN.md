# FatSecret Full Implementation Plan

## Goal
Utilize FatSecret Premier API to its full potential with all available features.

## Phase 1: Search Filters & Nutrition Display (Quick Wins)

### 1.1 Calorie Filter
- **Frontend**: Add calorie slider/input to recipe search
- **Backend**: Pass `max_calories` to FatSecret API
- **Impact**: Users can find recipes that fit their calorie goals
- **Files**: 
  - `src/screens/recipes/RecipeSearchScreen.tsx`
  - `backend/src/routes/recipes.ts`
  - `backend/src/services/FatSecretProviderAdapter.ts`

### 1.2 Meal Type Filter
- **Frontend**: Add meal type selector (breakfast, lunch, dinner, snack)
- **Backend**: Pass `recipe_types` to FatSecret API
- **Impact**: Better recipe organization
- **Files**: Same as 1.1

### 1.3 Prominent Nutrition Display
- **Frontend**: Show calories, protein, carbs, fat on recipe cards
- **Backend**: Already available in FatSecret response
- **Impact**: Users see nutrition at a glance
- **Files**: `src/screens/recipes/RecipeSearchScreen.tsx`

### 1.4 Trending Recipes Section
- **Frontend**: New "Trending" tab or section
- **Backend**: New endpoint using FatSecret trending API
- **Impact**: Discover popular recipes
- **Files**: 
  - `src/screens/TrendingRecipesScreen.tsx` (already exists, enhance it)
  - `backend/src/routes/recipes.ts`

## Phase 2: Recipe Detail Enhancements

### 2.1 Serving Size Adjuster
- **Frontend**: +/- buttons to adjust servings
- **Backend**: Calculate ingredient quantities based on serving multiplier
- **Impact**: Scale recipes up/down easily
- **Files**: `src/screens/recipes/RecipeDetailScreen.tsx`

### 2.2 Recipe Ratings Display
- **Frontend**: Show star rating from FatSecret
- **Backend**: Already in FatSecret response (`rating`)
- **Impact**: Users see recipe quality
- **Files**: 
  - `src/screens/recipes/RecipeSearchScreen.tsx`
  - `src/screens/recipes/RecipeDetailScreen.tsx`

### 2.3 Higher Quality Images
- **Frontend**: Use larger image URLs from FatSecret
- **Backend**: FatSecret provides multiple image sizes
- **Impact**: Better visual appeal
- **Files**: `backend/src/services/FatSecretProviderAdapter.ts`

## Phase 3: Advanced Features

### 3.1 Shopping List Auto-Generation
- **Frontend**: "Add to Shopping List" button on recipe detail
- **Backend**: Parse recipe ingredients and add to user's shopping list
- **Impact**: Seamless meal planning
- **Files**: 
  - `src/screens/recipes/RecipeDetailScreen.tsx`
  - `backend/src/routes/shoppingList.ts`

### 3.2 Meal Nutrition Summaries
- **Frontend**: Daily/weekly nutrition totals
- **Backend**: Aggregate nutrition from saved recipes and meal plans
- **Impact**: Track nutrition goals
- **Files**: 
  - `src/screens/NutritionSummaryScreen.tsx` (new)
  - `backend/src/routes/nutrition.ts` (new)

### 3.3 Recipe Collections by Cuisine
- **Frontend**: Browse by cuisine type (Italian, Mexican, Asian, etc.)
- **Backend**: Use FatSecret search with cuisine filters
- **Impact**: Discover new cuisines
- **Files**: 
  - `src/screens/recipes/CuisineCollectionsScreen.tsx` (new)
  - `backend/src/routes/recipes.ts`

## Implementation Order

### Sprint 1 (Today)
1. ✅ Calorie filter
2. ✅ Meal type filter
3. ✅ Nutrition display on cards

### Sprint 2 (Next)
4. ⏭️ Trending recipes enhancement (using cache - already works)
5. ✅ Serving size adjuster (ALREADY IMPLEMENTED!)
6. ✅ Recipe ratings display (ALREADY IMPLEMENTED!)

### Sprint 3 (Later)
7. ✅ Higher quality images
8. ✅ Shopping list auto-generation
9. ✅ Meal nutrition summaries
10. ✅ Recipe collections by cuisine

## Technical Notes

- FatSecret Premier: 500,000 calls/month FREE
- All features use existing API access
- No additional costs
- Build database while using features

## Success Metrics

- More relevant recipe results (filters)
- Better user engagement (nutrition display)
- Increased recipe saves (trending, ratings)
- Improved meal planning (shopping lists, summaries)

---

**Status**: Ready to implement
**Priority**: High - maximize free API usage
**Timeline**: 3 sprints (can be done faster if needed)

