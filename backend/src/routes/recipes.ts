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

/**
 * Clean ingredient names from user input
 * Removes quantities, measurements, and extra descriptive text
 */
function cleanIngredientName(rawName: string): string {
  if (!rawName) return '';

  let cleaned = rawName.toLowerCase().trim();

  // Remove common quantity patterns
  cleaned = cleaned.replace(/^\d+[\s\w]*\s+/, ''); // Remove leading numbers and units
  cleaned = cleaned.replace(/\b\d+[\s\w]*$/, ''); // Remove trailing numbers and units
  cleaned = cleaned.replace(/\b\d+\/\d+\b/g, ''); // Remove fractions like 1/2
  cleaned = cleaned.replace(/\b\d+\.\d+\b/g, ''); // Remove decimals like 1.5

  // Remove common measurement units
  const units = [
    'cup',
    'cups',
    'tbsp',
    'tsp',
    'oz',
    'fl oz',
    'lb',
    'lbs',
    'g',
    'kg',
    'ml',
    'l',
    'serving',
    'servings',
    'piece',
    'pieces',
    'slice',
    'slices',
  ];
  units.forEach(unit => {
    cleaned = cleaned.replace(new RegExp(`\\b${unit}s?\\b`, 'g'), '');
  });

  // Remove descriptive text patterns
  cleaned = cleaned.replace(/,.*$/, ''); // Remove everything after first comma
  cleaned = cleaned.replace(/\(.*?\)/g, ''); // Remove parenthetical content
  cleaned = cleaned.replace(/\bns as to\b.*$/i, ''); // Remove "NS as to..." patterns
  cleaned = cleaned.replace(/\bchopped\b|\bsliced\b|\bdiced\b|\bminced\b/g, ''); // Remove preparation methods

  // Clean up whitespace and punctuation
  cleaned = cleaned.replace(/[,;:]/g, ' '); // Replace punctuation with spaces
  cleaned = cleaned.replace(/\s+/g, ' '); // Collapse multiple spaces
  cleaned = cleaned.trim();

  // Extract the main ingredient (first meaningful word)
  const words = cleaned.split(' ').filter(word => word.length > 2);
  if (words.length > 0) {
    return words[0];
  }

  return cleaned;
}

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

      let ingredientList = ingredients
        .split(',')
        .map(i => cleanIngredientName(i.trim()))
        .filter(i => i.length > 2);

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

          const allUserIngredients = userIngredientsQuery.rows
            .map(row => row.ingredient_name || row.name)
            .filter(name => name && name.length > 0)
            .map(name => cleanIngredientName(name))
            .filter(name => name && name.length > 2);

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
      const provider = 'fatsecret';

      // Cache the new recipes (RecipeCacheService handles duplicate checking)
      if (recipes.length > 0) {
        console.log(`Caching ${recipes.length} recipes to database...`);
        try {
          for (const recipe of recipes) {
            await RecipeCacheService.cacheRecipe(recipe, provider);
          }
          console.log('✅ Recipes cached successfully');
        } catch (cacheError) {
          console.error('Failed to cache recipes:', cacheError);
          // Continue anyway - user still gets their recipes
        }
      }

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
        recipes,
        count: recipes.length,
        provider,
        searchedIngredients: ingredientList.slice(0, 10), // For debugging
        message:
          recipes.length === 0
            ? 'No recipes found. Try different ingredients.'
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
      let provider = 'fatsecret';

      // Fallback to cache only if API fails
      if (!recipe) {
        console.log('API failed, trying cache...');
        recipe = await RecipeCacheService.getRecipeById(id);
        provider = 'cache';
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
        provider,
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
