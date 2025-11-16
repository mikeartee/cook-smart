# Recipe API Migration - Testing Guide

## Overview

This guide covers testing the migration from Spoonacular to Edamam + TheMealDB.

## Prerequisites

1. **Edamam API Credentials** (see `.kiro/EDAMAM_REGISTRATION_GUIDE.md`)
   - APP_ID
   - APP_KEY
   
2. **Database Migration**
   - Run: `backend/src/migrations/create_api_usage_logs_table.sql`

3. **Environment Variables**
   ```env
   EDAMAM_APP_ID=your_app_id
   EDAMAM_APP_KEY=your_app_key
   ```

## Testing Checklist

### 6.1 Test Edamam API Integration

#### Test 1: Single Ingredient Search
```bash
# Start backend
cd backend
npm run dev

# Test API endpoint
curl "http://localhost:3000/api/v1/recipes/search?ingredients=chicken" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Status: 200
- Response contains `recipes` array
- Response contains `provider: "edamam"`
- Recipes have nutrition data
- Images are present

#### Test 2: Multiple Ingredients Search
```bash
curl "http://localhost:3000/api/v1/recipes/search?ingredients=chicken,rice,tomato" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Status: 200
- 10-20 recipes returned
- Recipes match ingredients
- Provider is "edamam"

#### Test 3: Recipe Details
```bash
# Get a recipe ID from search results, then:
curl "http://localhost:3000/api/v1/recipes/RECIPE_ID" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Status: 200
- Full recipe details
- Instructions present
- Ingredients list complete

#### Test 4: Verify Nutrition Data
- Check that recipes include:
  - `nutrition.calories`
  - `nutrition.protein`
  - `nutrition.carbs`
  - `nutrition.fat`

### 6.2 Test TheMealDB Fallback

#### Test 1: Mock Edamam Rate Limit
To test fallback, temporarily set `DAILY_LIMIT = 0` in `EdamamService.ts`:

```typescript
const DAILY_LIMIT = 0; // Force fallback for testing
```

Then search for recipes:
```bash
curl "http://localhost:3000/api/v1/recipes/search?ingredients=chicken" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Status: 200
- Response contains `provider: "themealdb"`
- Recipes returned (may be fewer)
- No nutrition data (TheMealDB doesn't provide it)

#### Test 2: Verify Unlimited Availability
- TheMealDB should always be available
- No rate limit errors
- Can make unlimited requests

**Remember to reset `DAILY_LIMIT = 333` after testing!**

### 6.3 Test Caching Behavior

#### Test 1: Cache Miss (First Search)
```bash
# Search with new ingredients
curl "http://localhost:3000/api/v1/recipes/search?ingredients=beef,potato" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Check Backend Logs:**
- Should see: `❌ Cache MISS`
- Should see: `🔍 Trying primary provider: Edamam`
- Should see: `✅ Cached X recipes`

#### Test 2: Cache Hit (Repeat Search)
```bash
# Same search again
curl "http://localhost:3000/api/v1/recipes/search?ingredients=beef,potato" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Check Backend Logs:**
- Should see: `✅ Cache HIT`
- No API call made
- Instant response

#### Test 3: Cache Statistics
```bash
curl "http://localhost:3000/api/v1/recipes/admin/cache-stats" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
```json
{
  "stats": {
    "total_recipes": 50,
    "active_searches": 10,
    "popular_recipes": 5
  }
}
```

### 6.4 Test Error Handling

#### Test 1: Invalid Credentials
Set wrong `EDAMAM_APP_KEY` in `.env`, restart backend:

```bash
curl "http://localhost:3000/api/v1/recipes/search?ingredients=chicken" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Falls back to TheMealDB
- Returns recipes with `provider: "themealdb"`
- No error shown to user

#### Test 2: Network Error
Disconnect internet, then search:

**Expected Result:**
- Returns cached recipes if available
- Shows user-friendly error if no cache
- No technical error details exposed

#### Test 3: No Ingredients
```bash
curl "http://localhost:3000/api/v1/recipes/search?ingredients=" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
- Status: 400
- Error message: "No valid ingredients provided"

### 6.5 Test Frontend Integration

#### Test 1: Recipe Search Screen
1. Open app
2. Navigate to "Recipes" tab
3. Verify:
   - Beta banner shows "Beta - Recipe Database"
   - Provider name shows (edamam/themealdb)
   - Recipes load successfully
   - Images display correctly

#### Test 2: Recipe Detail Screen
1. Tap on a recipe
2. Verify:
   - Provider badge shows at top
   - "Recipe from Edamam" or "Recipe from TheMealDB"
   - All recipe details display
   - Save/unsave works

#### Test 3: Pull to Refresh
1. Pull down on recipe list
2. Verify:
   - Recipes refresh
   - Loading indicator shows
   - New results appear

### 6.6 Test API Usage Monitoring

#### Test 1: Usage Statistics
```bash
curl "http://localhost:3000/api/v1/recipes/admin/usage-stats" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Result:**
```json
{
  "today": [
    {
      "provider": "edamam",
      "total_calls": 15,
      "successful_calls": 14,
      "cached_calls": 8,
      "avg_response_time": 1250
    }
  ],
  "recent_errors": []
}
```

#### Test 2: Rate Limit Warning
Make 267+ API calls (80% of 333 limit):

**Check Backend Logs:**
- Should see: `⚠️  Edamam approaching rate limit: 267/333 (80%)`

## Performance Benchmarks

### Expected Response Times
- **Cache Hit:** < 100ms
- **Edamam API:** 1-2 seconds
- **TheMealDB API:** 0.5-1 second
- **Fallback to Cache:** < 200ms

### API Call Limits
- **Edamam:** 333 calls/day (10,000/month)
- **TheMealDB:** Unlimited
- **Cache Duration:** 30 days

## Common Issues

### Issue: "Edamam API credentials not configured"
**Solution:** 
- Check `.env` file has `EDAMAM_APP_ID` and `EDAMAM_APP_KEY`
- Restart backend server

### Issue: "Rate limit exceeded"
**Solution:**
- Wait until tomorrow (resets at midnight UTC)
- Or use TheMealDB fallback (automatic)

### Issue: No recipes returned
**Solution:**
- Check backend logs for errors
- Verify API credentials are correct
- Try different ingredient combinations

### Issue: Database error on API usage logging
**Solution:**
- Run migration: `create_api_usage_logs_table.sql`
- Check database connection

## Success Criteria

✅ All tests pass
✅ No TypeScript errors
✅ Edamam returns recipes with nutrition data
✅ TheMealDB fallback works
✅ Caching reduces API calls by 60%+
✅ Frontend displays provider information
✅ Error handling is graceful
✅ API usage logging works

## Next Steps

After testing is complete:
1. Update documentation
2. Archive Spoonacular service
3. Deploy to production
4. Monitor API usage for first week
