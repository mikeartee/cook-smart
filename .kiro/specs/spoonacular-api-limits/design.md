# Design Document

## Overview

This design addresses the critical limitation of Spoonacular's free tier (50 points/day) by evaluating alternative recipe APIs and implementing a migration strategy. The solution will maintain existing functionality while significantly increasing the daily API call limit, ensuring the app can support beta testing with multiple users without exceeding the $20/month emergency budget.

## Alternative Recipe API Research

### Option 1: Edamam Recipe Search API

**Free Tier:**
- 10,000 calls/month (~333 calls/day)
- Recipe search and details
- Nutritional information included
- No credit card required

**Pros:**
- 6.6x more calls than Spoonacular (333 vs 50)
- Comprehensive recipe database
- Includes nutrition data
- Well-documented API
- Stable and reliable service

**Cons:**
- Requires app registration
- Rate limit: 10 calls/minute
- Recipe format differs from Spoonacular

**Cost:** FREE (Developer tier)

**API Endpoints:**
- Search: `https://api.edamam.com/api/recipes/v2`
- Details: Included in search results

### Option 2: TheMealDB API

**Free Tier:**
- UNLIMITED calls
- Completely free forever
- No API key required for basic tier
- Patreon supporters get API key for $2/month (optional)

**Pros:**
- Truly unlimited and free
- No registration required
- Simple JSON responses
- Search by ingredient
- Recipe details with instructions
- Images included

**Cons:**
- Smaller recipe database (~300 recipes)
- Limited to single ingredient searches
- No multi-ingredient matching
- Community-maintained database

**Cost:** FREE (unlimited)

**API Endpoints:**
- Search by ingredient: `https://www.themealdb.com/api/json/v1/1/filter.php?i={ingredient}`
- Recipe details: `https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}`
- Random recipe: `https://www.themealdb.com/api/json/v1/1/random.php`

### Option 3: API Ninjas Recipe API

**Free Tier:**
- 50,000 calls/month (~1,666 calls/day)
- Recipe search with query
- No credit card required
- Fast response times

**Pros:**
- 33x more calls than Spoonacular (1,666 vs 50)
- Very generous free tier
- Simple authentication (API key header)
- Clean JSON responses
- Search by ingredients or recipe name

**Cons:**
- Less detailed recipe information
- No images included in API response
- Requires API key registration
- Smaller recipe database

**Cost:** FREE (50,000 calls/month)

**API Endpoints:**
- Search: `https://api.api-ninjas.com/v1/recipe?query={query}`

### Option 4: Tasty API (RapidAPI)

**Free Tier:**
- 500 calls/month (~16 calls/day)
- Recipe search and details
- Video content included

**Pros:**
- High-quality recipes from Tasty/BuzzFeed
- Video instructions
- Modern recipe database

**Cons:**
- Very limited free tier (worse than Spoonacular)
- Requires RapidAPI account
- Complex response format

**Cost:** FREE tier too limited

**Verdict:** NOT RECOMMENDED

### Recommendation: Edamam Recipe Search API

**Winner: Edamam**

**Reasoning:**
1. **Best balance** - 10,000 calls/month is sufficient for beta testing with 50-100 users
2. **Feature complete** - Includes all features we need (search by ingredients, details, nutrition)
3. **Reliable** - Established service with good documentation
4. **Free forever** - Developer tier is permanently free
5. **Scalable** - Can upgrade to paid tier if needed ($49/month for 100,000 calls)

**Backup Option: TheMealDB**
- Use as fallback when Edamam limit is reached
- Unlimited and free
- Smaller database but still useful

## Architecture

### Current Architecture (Spoonacular)

```
Frontend (React Native)
    ↓
RecipeContext
    ↓
recipeService.ts
    ↓
Backend API (/api/v1/recipes)
    ↓
spoonacularService.ts
    ↓
Spoonacular API (50 points/day)
    ↓
RecipeCache (PostgreSQL)
```

### New Architecture (Edamam + TheMealDB Fallback)

```
Frontend (React Native)
    ↓
RecipeContext (no changes)
    ↓
recipeService.ts (no changes)
    ↓
Backend API (/api/v1/recipes) (no changes)
    ↓
RecipeProviderService (NEW - abstraction layer)
    ├── EdamamService (PRIMARY)
    ├── TheMealDBService (FALLBACK)
    └── SpoonacularService (DEPRECATED)
    ↓
RecipeCache (PostgreSQL)
```

## Components and Interfaces

### 1. Recipe Provider Interface

```typescript
interface IRecipeProvider {
  // Search recipes by ingredients
  searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]>;
  
  // Get detailed recipe information
  getRecipeDetails(recipeId: string): Promise<RecipeDetails>;
  
  // Get provider name
  getProviderName(): string;
  
  // Check if provider is available (within rate limits)
  isAvailable(): Promise<boolean>;
}
```

### 2. Recipe Provider Service (Orchestrator)

```typescript
class RecipeProviderService {
  private providers: IRecipeProvider[];
  private primaryProvider: IRecipeProvider;
  private fallbackProviders: IRecipeProvider[];
  
  constructor() {
    this.providers = [
      new EdamamService(),      // Primary
      new TheMealDBService(),   // Fallback
    ];
    this.primaryProvider = this.providers[0];
    this.fallbackProviders = this.providers.slice(1);
  }
  
  async searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]> {
    // Try cache first
    const cached = await this.checkCache(ingredients);
    if (cached) return cached;
    
    // Try primary provider
    try {
      if (await this.primaryProvider.isAvailable()) {
        const results = await this.primaryProvider.searchByIngredients(ingredients, limit);
        await this.cacheResults(ingredients, results);
        return results;
      }
    } catch (error) {
      console.log(`Primary provider failed: ${error.message}`);
    }
    
    // Try fallback providers
    for (const provider of this.fallbackProviders) {
      try {
        if (await provider.isAvailable()) {
          const results = await provider.searchByIngredients(ingredients, limit);
          await this.cacheResults(ingredients, results);
          return results;
        }
      } catch (error) {
        console.log(`Fallback provider ${provider.getProviderName()} failed`);
      }
    }
    
    // Return cached results if all providers fail
    return await this.getCachedResultsOnly(ingredients);
  }
}
```

### 3. Edamam Service Implementation

```typescript
class EdamamService implements IRecipeProvider {
  private apiKey: string;
  private appId: string;
  private baseUrl = 'https://api.edamam.com/api/recipes/v2';
  private callCount = 0;
  private dailyLimit = 333; // ~10,000/month
  
  async searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]> {
    const query = ingredients.join(' ');
    
    const response = await axios.get(this.baseUrl, {
      params: {
        type: 'public',
        q: query,
        app_id: this.appId,
        app_key: this.apiKey,
        to: limit,
      },
    });
    
    return this.mapEdamamToRecipe(response.data.hits);
  }
  
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    // Edamam includes full details in search results
    // Retrieve from cache or search again
    const cached = await RecipeCacheModel.getCachedRecipe(recipeId);
    if (cached) return cached.recipe_data;
    
    throw new Error('Recipe not found in cache');
  }
  
  private mapEdamamToRecipe(hits: any[]): Recipe[] {
    return hits.map(hit => ({
      id: this.generateRecipeId(hit.recipe.uri),
      title: hit.recipe.label,
      image: hit.recipe.image,
      servings: hit.recipe.yield,
      readyInMinutes: hit.recipe.totalTime || 30,
      sourceUrl: hit.recipe.url,
      summary: hit.recipe.source,
      ingredients: hit.recipe.ingredientLines,
      instructions: hit.recipe.instructions || 'See source URL for instructions',
      cuisines: hit.recipe.cuisineType || [],
      dishTypes: hit.recipe.dishType || [],
      diets: hit.recipe.dietLabels || [],
      nutrition: {
        calories: hit.recipe.calories,
        protein: hit.recipe.totalNutrients?.PROCNT?.quantity,
        carbs: hit.recipe.totalNutrients?.CHOCDF?.quantity,
        fat: hit.recipe.totalNutrients?.FAT?.quantity,
      },
    }));
  }
  
  async isAvailable(): Promise<boolean> {
    // Check if we're within daily limit
    return this.callCount < this.dailyLimit;
  }
  
  getProviderName(): string {
    return 'Edamam';
  }
}
```

### 4. TheMealDB Service Implementation

```typescript
class TheMealDBService implements IRecipeProvider {
  private baseUrl = 'https://www.themealdb.com/api/json/v1/1';
  
  async searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]> {
    // TheMealDB only supports single ingredient search
    // Search with first ingredient and filter results
    const mainIngredient = ingredients[0];
    
    const response = await axios.get(`${this.baseUrl}/filter.php`, {
      params: { i: mainIngredient },
    });
    
    if (!response.data.meals) return [];
    
    // Get details for each meal (up to limit)
    const meals = response.data.meals.slice(0, limit);
    const detailedRecipes = await Promise.all(
      meals.map(meal => this.getRecipeDetails(meal.idMeal))
    );
    
    return detailedRecipes;
  }
  
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    const response = await axios.get(`${this.baseUrl}/lookup.php`, {
      params: { i: recipeId },
    });
    
    const meal = response.data.meals[0];
    return this.mapMealDBToRecipe(meal);
  }
  
  private mapMealDBToRecipe(meal: any): RecipeDetails {
    // Extract ingredients from meal object
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push(`${measure} ${ingredient}`.trim());
      }
    }
    
    return {
      id: meal.idMeal,
      title: meal.strMeal,
      image: meal.strMealThumb,
      servings: 4, // Default
      readyInMinutes: 30, // Default
      sourceUrl: meal.strSource || meal.strYoutube,
      summary: meal.strCategory,
      ingredients,
      instructions: meal.strInstructions,
      cuisines: [meal.strArea],
      dishTypes: [meal.strCategory],
      diets: [],
    };
  }
  
  async isAvailable(): Promise<boolean> {
    // TheMealDB is always available (unlimited)
    return true;
  }
  
  getProviderName(): string {
    return 'TheMealDB';
  }
}
```

## Data Models

### Unified Recipe Model

```typescript
interface Recipe {
  id: string;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  summary: string;
  ingredients: string[];
  instructions: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  provider?: string; // 'edamam', 'themealdb', 'spoonacular'
}
```

### API Usage Tracking Model

```typescript
interface APIUsageLog {
  id: string;
  provider: string;
  endpoint: string;
  timestamp: Date;
  success: boolean;
  cached: boolean;
  responseTime: number;
}
```

## Error Handling

### Error Hierarchy

1. **Cache Check** - If cache fails, log warning and continue to API
2. **Primary Provider (Edamam)** - If fails, try fallback
3. **Fallback Provider (TheMealDB)** - If fails, return cached results
4. **No Results** - Return empty array with user-friendly message

### Error Messages

```typescript
const ERROR_MESSAGES = {
  NO_RESULTS: 'No recipes found. Try different ingredients.',
  API_LIMIT: 'Daily search limit reached. Showing cached results.',
  API_ERROR: 'Unable to fetch recipes. Please try again later.',
  CACHE_ONLY: 'Showing previously searched recipes.',
};
```

### Rate Limit Handling

```typescript
class RateLimitTracker {
  private limits: Map<string, { count: number; resetTime: Date }>;
  
  async checkLimit(provider: string, dailyLimit: number): Promise<boolean> {
    const current = this.limits.get(provider);
    
    if (!current || new Date() > current.resetTime) {
      // Reset counter
      this.limits.set(provider, {
        count: 0,
        resetTime: this.getNextMidnight(),
      });
      return true;
    }
    
    return current.count < dailyLimit;
  }
  
  async incrementCount(provider: string): Promise<void> {
    const current = this.limits.get(provider);
    if (current) {
      current.count++;
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **EdamamService**
   - Test API response mapping
   - Test error handling
   - Test rate limit checking

2. **TheMealDBService**
   - Test single ingredient search
   - Test recipe detail fetching
   - Test ingredient extraction

3. **RecipeProviderService**
   - Test provider fallback logic
   - Test cache integration
   - Test error propagation

### Integration Tests

1. **API Connectivity**
   - Test Edamam API with real credentials
   - Test TheMealDB API (no auth needed)
   - Test rate limit behavior

2. **Cache Integration**
   - Test cache hit/miss scenarios
   - Test cache expiration
   - Test cache statistics

### Manual Testing Checklist

1. Search with 1 ingredient
2. Search with 3 ingredients
3. Search with 5+ ingredients
4. View recipe details
5. Test with API limit reached (mock)
6. Test with network error (mock)
7. Verify cache is working
8. Check usage statistics

## Migration Plan

### Phase 1: Setup Edamam Account

1. Register at https://developer.edamam.com/
2. Create application
3. Get APP_ID and APP_KEY
4. Add to backend/.env

### Phase 2: Implement New Services

1. Create IRecipeProvider interface
2. Implement EdamamService
3. Implement TheMealDBService
4. Create RecipeProviderService orchestrator

### Phase 3: Update Backend Routes

1. Replace spoonacularService with RecipeProviderService
2. Update error handling
3. Add usage logging

### Phase 4: Testing

1. Run unit tests
2. Test with real API calls
3. Verify cache behavior
4. Test fallback scenarios

### Phase 5: Deployment

1. Update environment variables
2. Deploy backend
3. Monitor API usage
4. Verify functionality

### Phase 6: Deprecate Spoonacular

1. Remove Spoonacular API key
2. Archive spoonacularService.ts
3. Update documentation

## Performance Considerations

### Caching Strategy

- **Cache Duration**: 30 days
- **Cache Key**: MD5 hash of sorted ingredients
- **Cache Priority**: Always check cache before API
- **Cache Warming**: Pre-populate common ingredient combinations

### API Call Optimization

- **Batch Requests**: Fetch multiple recipe details in parallel
- **Lazy Loading**: Only fetch details when user views recipe
- **Debouncing**: Wait 500ms after user stops typing before searching

### Response Time Targets

- Cache hit: < 100ms
- Edamam API: < 2s
- TheMealDB API: < 1s
- Fallback to cache: < 200ms

## Monitoring and Logging

### Metrics to Track

1. API calls per day (by provider)
2. Cache hit rate
3. Average response time
4. Error rate by provider
5. User search patterns

### Log Format

```typescript
{
  timestamp: '2025-11-15T10:30:00Z',
  provider: 'edamam',
  action: 'search',
  ingredients: ['chicken', 'rice'],
  cached: false,
  responseTime: 1250,
  success: true,
  resultsCount: 10
}
```

## Cost Analysis

### Current: Spoonacular

- Free tier: 50 points/day
- Estimated usage: 50-100 points/day (exceeds limit)
- Cost: $0 (but insufficient)

### New: Edamam + TheMealDB

- Edamam: 10,000 calls/month (333/day)
- TheMealDB: Unlimited
- Estimated usage: 100-200 calls/day (well within limit)
- Cost: $0

### Projected Usage (100 beta users)

- Average 2 searches per user per day = 200 searches
- Cache hit rate: 60% = 80 API calls
- Well within Edamam free tier (333/day)
- Cost: $0

### Future Scaling

- 1,000 users: ~800 API calls/day (upgrade to Edamam paid tier: $49/month)
- 10,000 users: Consider dedicated recipe database or multiple API keys

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Never expose keys in frontend code
- Rotate keys periodically
- Use separate keys for dev/prod

### Rate Limiting

- Implement backend rate limiting (10 requests/minute per user)
- Prevent API abuse
- Log suspicious activity

### Data Validation

- Validate ingredient inputs
- Sanitize user queries
- Limit search result count
- Validate API responses before caching

## Documentation Updates Required

1. Update SPOONACULAR_API_SETUP.md → RECIPE_API_SETUP.md
2. Update backend README with new API setup
3. Document Edamam registration process
4. Add API comparison matrix
5. Update deployment checklist
