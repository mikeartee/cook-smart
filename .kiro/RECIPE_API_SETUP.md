# 🔑 Recipe API Setup Guide

## Status: REQUIRED FOR RECIPE FEATURES

## Overview

Cook Smart uses **Edamam** as the primary recipe API with **TheMealDB** as an unlimited fallback. This provides 333 free API calls per day (10,000/month) with automatic fallback to unlimited free recipes.

## API Comparison Matrix

| Feature | Edamam | TheMealDB | Spoonacular (Old) |
|---------|--------|-----------|-------------------|
| **Free Tier** | 10,000 calls/month | Unlimited | 50 points/day |
| **Daily Limit** | ~333 calls | Unlimited | ~50 calls |
| **Cost** | FREE | FREE | FREE |
| **Nutrition Data** | ✅ Yes | ❌ No | ✅ Yes |
| **Recipe Images** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Instructions** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Multi-Ingredient Search** | ✅ Yes | ⚠️  Single only | ✅ Yes |
| **API Key Required** | ✅ Yes | ❌ No | ✅ Yes |
| **Rate Limit** | 10/minute | None | 1/second |

**Winner:** Edamam (6.6x more calls than Spoonacular)

## Setup Instructions

### Step 1: Register for Edamam API

1. Go to [https://developer.edamam.com/](https://developer.edamam.com/)
2. Click "Sign Up" and create account
3. Verify your email
4. Create a new application:
   - Select **"Recipe Search API"**
   - Choose **"Developer"** plan (FREE)
   - Name: "Cook Smart"
5. Copy your credentials:
   - **Application ID** (e.g., `12345678`)
   - **Application Key** (e.g., `abcdef1234567890...`)

**Detailed Guide:** See `.kiro/EDAMAM_REGISTRATION_GUIDE.md`

### Step 2: Add Credentials to Backend

Edit `backend/.env`:

```env
# Recipe APIs
EDAMAM_APP_ID=your_application_id_here
EDAMAM_APP_KEY=your_application_key_here
```

**Example:**
```env
EDAMAM_APP_ID=12345678
EDAMAM_APP_KEY=abcdef1234567890abcdef1234567890
```

### Step 3: Run Database Migration

```bash
cd backend
psql -U your_db_user -d cooksmartdb -f src/migrations/create_api_usage_logs_table.sql
```

Or run manually:
```sql
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT true,
  cached BOOLEAN NOT NULL DEFAULT false,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 4: Restart Backend

```bash
cd backend
npm run dev
```

### Step 5: Test the API

```bash
# Get auth token by logging in first
# Then test recipe search:
curl "http://localhost:3000/api/v1/recipes/search?ingredients=chicken,rice" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Expected Response:**
```json
{
  "recipes": [...],
  "count": 10,
  "provider": "edamam"
}
```

## How It Works

### Provider Fallback System

```
1. Check Cache (30-day duration)
   ↓ (if miss)
2. Try Edamam (Primary - 333 calls/day)
   ↓ (if fails or limit reached)
3. Try TheMealDB (Fallback - Unlimited)
   ↓ (if fails)
4. Return Cached Results (even expired)
```

### Caching Strategy

- **Cache Duration:** 30 days
- **Cache Key:** MD5 hash of sorted ingredients
- **Cache Hit Rate Target:** 60%+
- **Result:** Most searches don't use API calls!

### API Call Estimates

#### For 10 Beta Users:
- Initial searches: ~20 calls
- Recipe details: ~30 calls
- **Total:** ~50 calls/day
- **Status:** ✅ Well within limit (333/day)

#### For 50 Users:
- With 60% cache hit rate: ~100-120 calls/day
- **Status:** ✅ Within limit

#### For 100+ Users:
- Estimated: ~200-250 calls/day
- **Status:** ✅ Still within free tier!

#### For 500+ Users:
- Consider upgrading to Edamam paid tier ($49/month for 100,000 calls)

## Features

### Edamam API (Primary)

**Provides:**
- Recipe search by multiple ingredients
- Full recipe details with instructions
- Nutritional information (calories, protein, carbs, fat)
- High-quality recipe images
- Cuisine and diet type information

**Limitations:**
- 333 calls per day (10,000/month)
- 10 calls per minute rate limit
- Requires API key

### TheMealDB API (Fallback)

**Provides:**
- Unlimited free API calls
- Recipe search by single ingredient
- Full recipe details with instructions
- Recipe images
- Cuisine information

**Limitations:**
- Only single ingredient searches
- No nutritional data
- Smaller recipe database (~300 recipes)

## Monitoring API Usage

### Check Usage Statistics

```bash
curl "http://localhost:3000/api/v1/recipes/admin/usage-stats" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

**Response:**
```json
{
  "today": [
    {
      "provider": "edamam",
      "total_calls": 45,
      "successful_calls": 44,
      "cached_calls": 27,
      "avg_response_time": 1250
    }
  ],
  "recent_errors": []
}
```

### Backend Logs

The system logs all API activity:

```
✅ Cache HIT for ingredient search: abc123
❌ Cache MISS for ingredient search: def456 - Calling Edamam API
🔍 Trying primary provider: Edamam
✅ Edamam returned 10 recipes
⚠️  Edamam approaching rate limit: 267/333 (80%)
🔍 Trying fallback provider: TheMealDB
```

### Rate Limit Warnings

When you reach 80% of daily limit (267 calls):
```
⚠️  Edamam approaching rate limit: 267/333 (80%)
```

System automatically switches to TheMealDB fallback.

## Troubleshooting

### Error: "Edamam API credentials not configured"
**Solution:**
- Check `backend/.env` has `EDAMAM_APP_ID` and `EDAMAM_APP_KEY`
- Verify no extra spaces in credentials
- Restart backend server

### Error: "Rate limit exceeded"
**Solution:**
- System automatically falls back to TheMealDB
- Limit resets at midnight UTC
- Consider upgrading if consistently hitting limit

### Error: "Recipe not found"
**Solution:**
- Recipe may not exist in API
- Try different ingredient combinations
- Check if recipe is in cache

### No recipes returned
**Solution:**
- Check backend logs for errors
- Verify Edamam credentials are correct
- Ensure database migration ran successfully
- Try with common ingredients (chicken, rice, etc.)

## Frontend Integration

### Beta Labels

Recipe screens show:
- "Beta - Recipe Database" banner
- Provider name (Edamam/TheMealDB)
- "Recipe from [Provider]" attribution

### User Messages

- **API Limit Reached:** "Daily search limit reached - showing cached results"
- **No Results:** "No recipes found. Try different ingredients."
- **Error:** "Unable to search recipes. Please try again later."

## Cost Analysis

### Current Setup (FREE)

- **Edamam:** $0 (10,000 calls/month)
- **TheMealDB:** $0 (unlimited)
- **Total:** $0/month

### Future Scaling

**If you need more than 333 calls/day:**

- **Edamam Startup:** $49/month - 100,000 calls (3,333/day)
- **Edamam Growth:** $149/month - 500,000 calls (16,666/day)
- **Edamam Enterprise:** Custom pricing

**Recommendation:** Stay on free tier until you have 200+ daily active users

## Migration from Spoonacular

### What Changed

- ✅ **6.6x more API calls** (333 vs 50)
- ✅ **Unlimited fallback** (TheMealDB)
- ✅ **Better caching** (30 days)
- ✅ **Usage monitoring** (API logs)
- ✅ **Automatic fallback** (no downtime)

### Old Spoonacular Service

The old Spoonacular service has been archived to:
- `backend/src/services/deprecated/spoonacularService.ts`

You can safely remove it after confirming the new system works.

## Testing

See comprehensive testing guide:
- `.kiro/RECIPE_API_MIGRATION_TESTING.md`

## Support

### Edamam Documentation
- [https://developer.edamam.com/edamam-docs-recipe-api](https://developer.edamam.com/edamam-docs-recipe-api)

### TheMealDB Documentation
- [https://www.themealdb.com/api.php](https://www.themealdb.com/api.php)

## Status

- ✅ Backend implementation complete
- ✅ Frontend integration complete
- ✅ Testing guide created
- ⏳ **Action Required:** Register for Edamam API
- ⏳ **Action Required:** Add credentials to `.env`
- ⏳ **Action Required:** Run database migration
- ⏳ **Action Required:** Test with real API calls

---

**Time to Setup:** 10 minutes
**Cost:** $0 (free tier)
**API Calls:** 333/day (10,000/month) + unlimited fallback
**Required:** YES (for recipe features to work)
