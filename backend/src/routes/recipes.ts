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
    try {
      const {ingredients, maxCalories, mealType} = req.query;

      if (!ingredients || typeof ingredients !== 'string') {
        res.status(400).json({
          error: 'Missing ingredients parameter',
          message: 'Please provide comma-separated ingredient names',
        });
        return;
      }

      const ingredientList = ingredients
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      if (ingredientList.length === 0) {
        res.status(400).json({
          error: 'No valid ingredients provided',
          message: 'Please provide at least one ingredient',
        });
        return;
      }

      console.log(
        `Searching recipes for ingredients: ${ingredientList.join(', ')}`,
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

      // First try to get from cache
      let recipe: any = await RecipeCacheService.getRecipeById(id);
      let provider = 'cache';

      // If not in cache, try API
      if (!recipe) {
        console.log('Recipe not in cache, fetching from API...');
        recipe = await recipeProviderService.getRecipeDetails(id);
        provider = 'api';
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
