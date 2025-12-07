import {Router, Request, Response} from 'express';
import {query} from 'express-validator';
import {RecipeProviderService} from '../services/RecipeProviderService';
import {APIUsageLogModel} from '../models/APIUsageLog';
import {UserPointsModel} from '../models/UserPoints';
import {AchievementService} from '../services/AchievementService';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import spoonacularService from '../services/SpoonacularService';
import themealdbService from '../services/TheMealDBService';
import RecipeCacheService from '../services/RecipeCacheService';
import pool from '../config/database';

// Initialize recipe provider service with Spoonacular (primary) and TheMealDB (fallback)
// Spoonacular: Better US recipes, multi-ingredient search, 150 free requests/day
// TheMealDB: Free unlimited backup when Spoonacular limit reached
const recipeProviderService = new RecipeProviderService([
  spoonacularService, // Primary: Better US recipe coverage
  themealdbService, // Fallback: Free unlimited
]);

const router = Router();

// Search recipes by ingredients
router.get(
  '/search',
  authenticateToken,
  [query('ingredients').isString().notEmpty()],
  async (req: AuthRequest, res: Response) => {
    try {
      const {ingredients} = req.query;

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

      // First, try to get recipes from cache
      const searchQuery = ingredientList.join(' ');
      const cachedRecipes = await RecipeCacheService.searchCachedRecipes(
        searchQuery,
        {},
      );

      let recipes: any[] = cachedRecipes.slice(0, 20);
      let provider = 'cache';

      // If we don't have enough cached recipes, fall back to API
      if (recipes.length < 5) {
        console.log('Not enough cached recipes, fetching from API...');
        const apiRecipes = await recipeProviderService.searchByIngredients(
          ingredientList,
          20,
        );
        recipes = apiRecipes;
        provider = 'api';
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
