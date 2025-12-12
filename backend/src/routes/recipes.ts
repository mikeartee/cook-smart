import {Router, Request, Response} from 'express';
import {query} from 'express-validator';
import {RecipeProviderService} from '../services/RecipeProviderService';
import {APIUsageLogModel} from '../models/APIUsageLog';
import {UserPointsModel} from '../models/UserPoints';
import {AchievementService} from '../services/AchievementService';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import FatSecretAdapter from '../services/FatSecretProviderAdapter';
import RecipeCacheService from '../services/RecipeCacheService';
import pool from '../config/database';
import {ComprehensiveIngredientStandardizer} from '../services/ComprehensiveIngredientStandardizer';
import {DietaryAwareRecipeService} from '../services/DietaryAwareRecipeService';

// Prioritize ingredients for search when user has large inventory
function prioritizeIngredientsForSearch(ingredients: string[]): string[] {
  // Common versatile ingredients that work well in searches
  const highPriorityIngredients = [
    'chicken',
    'beef',
    'pork',
    'fish',
    'salmon',
    'shrimp',
    'rice',
    'pasta',
    'noodles',
    'bread',
    'flour',
    'onion',
    'garlic',
    'tomato',
    'potato',
    'carrot',
    'cheese',
    'milk',
    'egg',
    'butter',
    'oil',
    'salt',
    'pepper',
    'herbs',
    'spices',
  ];

  const prioritized: string[] = [];
  const remaining: string[] = [];

  // First, add high-priority ingredients that user has
  ingredients.forEach(ingredient => {
    const normalized = ingredient.toLowerCase().trim();
    const isHighPriority = highPriorityIngredients.some(
      priority =>
        normalized.includes(priority) || priority.includes(normalized),
    );

    if (isHighPriority) {
      prioritized.push(ingredient);
    } else {
      remaining.push(ingredient);
    }
  });

  // Combine prioritized + remaining, limit to reasonable number
  const result = [...prioritized, ...remaining].slice(0, 25);

  console.log(
    `[Recipe Search] Prioritized ${prioritized.length} high-value ingredients from ${ingredients.length} total`,
  );

  return result;
}

// Initialize recipe provider service with FatSecret (primary and only provider)
// FatSecret Premier: 500,000 calls/month FREE, 1M+ recipes, comprehensive nutrition data
const recipeProviderService = new RecipeProviderService([
  FatSecretAdapter, // Primary: FatSecret Premier (free, unlimited for our needs)
]);

const router = Router();

// Search recipes by ingredients
router.get(
  '/search',
  authenticateToken,
  [query('ingredients').isString().notEmpty()],
  async (req: AuthRequest, res: Response) => {
    // Disable HTTP caching for recipe searches to ensure filters work correctly
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    try {
      const {ingredients, maxCalories, mealType} = req.query;

      if (!ingredients || typeof ingredients !== 'string') {
        res.status(400).json({
          error: 'Missing ingredients parameter',
          message: 'Please provide comma-separated ingredient names',
        });
        return;
      }

      // Standardize ingredients from query parameter
      const rawIngredients = ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);
      const standardizedFromQuery = await Promise.all(
        rawIngredients.map(name =>
          ComprehensiveIngredientStandardizer.getStandardizedNameForMatching(
            name,
          ),
        ),
      );

      let ingredientList = standardizedFromQuery.filter(i => i.length > 2);

      console.log(
        `Query ingredients standardized: ${rawIngredients.join(',')} → ${ingredientList.join(',')}`,
      );

      // If no ingredients provided, get user's ingredients from database
      if (ingredientList.length === 0 && req.user?.id) {
        try {
          // Get user ingredients with smart prioritization for large inventories
          const userIngredientsQuery = await pool.query(
            `SELECT ingredient_name, name, added_at, expiration_date 
             FROM user_ingredients 
             WHERE user_id = $1 
             ORDER BY 
               CASE WHEN expiration_date IS NOT NULL THEN expiration_date END ASC NULLS LAST,
               added_at DESC 
             LIMIT 50`,
            [req.user.id],
          );

          // Get raw ingredient names and standardize them
          const rawIngredientNames = userIngredientsQuery.rows
            .map(row => row.ingredient_name || row.name)
            .filter(name => name && name.length > 0);

          console.log(
            `Raw ingredients from DB: ${rawIngredientNames.slice(0, 3).join(', ')}`,
          );

          // Standardize ingredients for better matching
          const standardizedIngredients = await Promise.all(
            rawIngredientNames.map(name =>
              ComprehensiveIngredientStandardizer.getStandardizedNameForMatching(
                name,
              ),
            ),
          );

          const allUserIngredients = standardizedIngredients.filter(
            name => name && name.length > 2,
          );

          console.log(
            `Standardized ingredients: ${allUserIngredients.slice(0, 3).join(', ')}`,
          );

          // For large inventories, prioritize common/versatile ingredients
          ingredientList = prioritizeIngredientsForSearch(allUserIngredients);

          console.log(
            `User has ${allUserIngredients.length} total ingredients, using top ${ingredientList.length} for search:`,
            ingredientList.slice(0, 5),
          );
        } catch (dbError) {
          console.error('Failed to get user ingredients:', dbError);
        }
      }

      if (ingredientList.length === 0) {
        res.status(400).json({
          error: 'No ingredients available',
          message: 'Please add some ingredients to your pantry first',
        });
        return;
      }

      console.log(
        `Searching recipes for ${ingredientList.length} ingredients: ${ingredientList.slice(0, 5).join(', ')}${ingredientList.length > 5 ? '...' : ''}`,
      );

      // Always fetch fresh recipes from FatSecret to build our database
      // FatSecret Premier: 500,000 calls/month FREE - use it to build our recipe library
      console.log('Fetching fresh recipes from FatSecret API...');

      // Build search options with filters
      const searchOptions: any = {
        ingredients: ingredientList,
        maxResults: 20,
      };

      if (maxCalories && !isNaN(Number(maxCalories))) {
        searchOptions.maxCalories = Number(maxCalories);
        console.log(`Filtering by max calories: ${maxCalories}`);
      }

      if (mealType && typeof mealType === 'string') {
        searchOptions.mealType = mealType;
        console.log(`Filtering by meal type: ${mealType}`);
      }

      const recipes = await recipeProviderService.searchByIngredients(
        ingredientList,
        20,
        searchOptions,
      );
      const actualProvider = recipeProviderService.getLastUsedProvider();

      // CRITICAL FIX: Use actual provider instead of hardcoded 'fatsecret'
      console.log(`[Recipe Search] Actual provider used: ${actualProvider}`);
      console.log(
        `[Recipe Search] First recipe provider: ${recipes[0]?.provider || 'none'}`,
      );
      console.log(
        `[Recipe Search] Recipe has matching data: ${recipes[0]?.matchPercentage !== undefined}`,
      );

      // DIETARY AWARENESS: Process recipes with user's dietary restrictions
      let processedRecipes = recipes;
      let dietaryFilteringApplied = false;

      console.log(`[DEBUG] req.user exists: ${!!req.user}`);
      console.log(`[DEBUG] req.user:`, JSON.stringify(req.user, null, 2));
      console.log(`[DEBUG] req.user.id: ${req.user?.id}`);

      if (req.user?.id) {
        try {
          const showConflictingRecipes =
            req.query.showConflictingRecipes !== 'false'; // Default to true

          console.log(
            `[Dietary] Starting dietary processing for user ${req.user.id}`,
          );
          console.log(
            `[Dietary] showConflictingRecipes: ${showConflictingRecipes}`,
          );
          console.log(`[Dietary] Processing ${recipes.length} recipes`);

          processedRecipes =
            await DietaryAwareRecipeService.processRecipesWithDietaryAwareness(
              recipes,
              {
                userId: req.user.id, // Keep as string, don't convert to number
                showConflictingRecipes,
                maxCalories: searchOptions.maxCalories,
                mealType: searchOptions.mealType,
              },
            );

          dietaryFilteringApplied = true;
          console.log(
            `[Dietary] Processed ${recipes.length} → ${processedRecipes.length} recipes after dietary filtering`,
          );

          // Log first few recipes for debugging
          processedRecipes.slice(0, 3).forEach((recipe, i) => {
            console.log(
              `[Dietary] Recipe ${i + 1}: "${recipe.title}" - Status: ${recipe.dietaryStatus || 'not set'}`,
            );
          });
        } catch (dietaryError) {
          console.error(
            '[Dietary] Error processing dietary restrictions:',
            dietaryError,
          );
          // Continue with original recipes if dietary processing fails
        }
      }

      // CRITICAL FIX: DO NOT cache recipes with matching data
      // Matching data is dynamic based on user's current ingredients
      // Caching would strip out the matching fields we just calculated
      console.log(
        `🚫 Skipping cache for ingredient search to preserve matching data`,
      );
      console.log(
        `✅ Returning ${processedRecipes.length} recipes with fresh matching calculations and dietary awareness`,
      );

      // Award points for recipe search (only if user is authenticated)
      if (req.user?.id && recipes.length > 0) {
        try {
          await UserPointsModel.addPoints(
            req.user.id,
            1,
            'recipe_search',
            'Searched for recipes',
          );
        } catch (pointsError) {
          console.warn('Failed to award points:', pointsError);
        }
      }

      res.json({
        recipes: processedRecipes,
        count: processedRecipes.length,
        provider: actualProvider, // Use actual provider instead of hardcoded
        searchedIngredients: ingredientList.slice(0, 10), // For debugging
        dietaryFiltering: dietaryFilteringApplied, // Indicate if dietary filtering was actually applied
        message:
          processedRecipes.length === 0
            ? 'No recipes found. Try different ingredients or adjust dietary preferences.'
            : undefined,
      });
    } catch (error) {
      console.error('Recipe search error:', error);
      res.status(500).json({
        error: 'Failed to search recipes',
        message: 'Unable to search recipes at this time',
      });
    }
  },
);

// Get recipe details by ID
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;

      if (!id) {
        res.status(400).json({
          error: 'Missing recipe ID',
          message: 'Please provide a valid recipe ID',
        });
        return;
      }

      console.log(`Fetching recipe details for ID: ${id}`);

      // Always fetch from API to get full details (ingredients, instructions)
      // FatSecret search results don't include these, only the details API does
      console.log('Fetching full recipe details from FatSecret API...');
      let recipe: any = await recipeProviderService.getRecipeDetails(id, true); // skipCache = true
      let actualProvider = recipeProviderService.getLastUsedProvider();

      // Fallback to cache only if API fails
      if (!recipe) {
        console.log('API failed, trying cache...');
        recipe = await RecipeCacheService.getRecipeById(id);
        actualProvider = 'cache';
      }

      // Track recipe view and check achievements
      if (req.user?.id) {
        try {
          // Log recipe view
          await pool.query(
            'INSERT INTO recipe_views (user_id, recipe_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.user.id, id],
          );

          // Check recipe achievements
          await AchievementService.checkRecipeAchievements(
            parseInt(req.user.id),
          );
        } catch (achievementError) {
          console.warn(
            'Failed to check recipe achievements:',
            achievementError,
          );
        }
      }

      res.json({
        recipe,
        provider: actualProvider,
      });
    } catch (error) {
      console.error('Recipe details error:', error);
      res.status(500).json({
        error: 'Failed to fetch recipe details',
        message: 'Unable to retrieve recipe information',
      });
    }
  },
);

// 🚨 DEPLOYMENT VERIFICATION ENDPOINT
router.get('/deployment-check', async (req: Request, res: Response) => {
  res.json({
    status: 'DEPLOYMENT_WORKING',
    timestamp: new Date().toISOString(),
    message: 'This endpoint confirms the latest deployment is active',
    version: 'emergency-debug-v3',
    deploymentId: Date.now(),
  });
});

// Get cache statistics (admin endpoint)
router.get('/admin/cache-stats', async (req: Request, res: Response) => {
  try {
    const stats = await recipeProviderService.getCacheStats();

    res.json({
      stats,
      message: 'Cache statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch cache statistics',
      message: 'Unable to retrieve cache stats',
    });
  }
});

// Get API usage statistics (admin endpoint)
router.get('/admin/usage-stats', async (req: Request, res: Response) => {
  try {
    const todayStats = await APIUsageLogModel.getTodayStats();
    const recentErrors = await APIUsageLogModel.getRecentErrors(5);

    res.json({
      today: todayStats,
      recent_errors: recentErrors,
      message: 'API usage statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: 'Unable to retrieve usage stats',
    });
  }
});

export default router;
