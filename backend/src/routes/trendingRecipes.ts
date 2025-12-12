import express from 'express';
import RecipeCacheService from '../services/RecipeCacheService';
import FatSecretService from '../services/FatSecretService';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import {DietaryAwareRecipeService} from '../services/DietaryAwareRecipeService';

// Optional authentication middleware - works for both authenticated and anonymous users
const optionalAuth = (
  req: AuthRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    // If token provided, try to authenticate
    authenticateToken(req, res, _err => {
      // Continue regardless of authentication result
      next();
    });
  } else {
    // No token provided, continue as anonymous user
    next();
  }
};

const router = express.Router();

// Get trending recipes - Always fresh from FatSecret with dietary filtering
// Cache in background to build database
router.get('/trending-recipes', optionalAuth, async (req: AuthRequest, res) => {
  // Disable HTTP caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const showConflictingRecipes = req.query.showConflictingRecipes !== 'false';

    console.log('[Trending] Fetching trending recipes from FatSecret...');

    const categories = ['dinner', 'dessert', 'breakfast', 'lunch'];
    const allRecipes = [];

    for (const category of categories) {
      const recipes = await FatSecretService.searchRecipesAdvanced({
        recipeTypes: category,
        maxResults: Math.ceil(limit / categories.length),
      });
      allRecipes.push(...recipes);

      // Cache each recipe
      for (const recipe of recipes) {
        await RecipeCacheService.cacheRecipe(recipe, 'fatsecret', 'all', false);
      }
    }

    let processedRecipes = allRecipes.slice(0, limit);
    let dietaryFilteringApplied = false;

    // Apply dietary filtering if user is authenticated
    if (req.user?.id) {
      try {
        console.log(
          `[Trending] Applying dietary filtering for user ${req.user.id}`,
        );
        processedRecipes =
          await DietaryAwareRecipeService.processRecipesWithDietaryAwareness(
            processedRecipes,
            {
              userId: req.user.id,
              showConflictingRecipes,
            },
          );
        dietaryFilteringApplied = true;
        console.log(
          `[Trending] Dietary filtering applied: ${processedRecipes.length} recipes after filtering`,
        );
      } catch (dietaryError) {
        console.error('[Trending] Dietary filtering error:', dietaryError);
        // Continue with unfiltered recipes if dietary processing fails
      }
    }

    res.json({
      success: true,
      recipes: processedRecipes,
      count: processedRecipes.length,
      source: 'fatsecret',
      dietaryFiltering: dietaryFilteringApplied,
      note: 'Trending recipes with dietary awareness',
    });
  } catch (error) {
    console.error('[Trending] Error:', error);
    res.status(500).json({error: 'Failed to get trending recipes'});
  }
});

// Get seasonal recipes - Always fresh from FatSecret with dietary filtering
// Cache in background to build database
router.get('/seasonal-recipes', optionalAuth, async (req: AuthRequest, res) => {
  // Disable HTTP caching
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    const season = (req.query.season as string) || getCurrentSeason();
    const limit = parseInt(req.query.limit as string) || 20;
    const showConflictingRecipes = req.query.showConflictingRecipes !== 'false';

    console.log(`[Seasonal] Fetching ${season} recipes from FatSecret...`);

    const seasonalIngredients = getSeasonalIngredients(season);
    const recipes = await FatSecretService.searchRecipesAdvanced({
      mustIncludeIngredients: seasonalIngredients.slice(0, 3).join(','),
      maxResults: limit,
    });

    // Cache each recipe
    for (const recipe of recipes) {
      await RecipeCacheService.cacheRecipe(recipe, 'fatsecret', season, true);
    }

    let processedRecipes = recipes;
    let dietaryFilteringApplied = false;

    // Apply dietary filtering if user is authenticated
    if (req.user?.id) {
      try {
        console.log(
          `[Seasonal] Applying dietary filtering for user ${req.user.id}`,
        );
        processedRecipes =
          await DietaryAwareRecipeService.processRecipesWithDietaryAwareness(
            recipes,
            {
              userId: req.user.id,
              showConflictingRecipes,
            },
          );
        dietaryFilteringApplied = true;
        console.log(
          `[Seasonal] Dietary filtering applied: ${processedRecipes.length} recipes after filtering`,
        );
      } catch (dietaryError) {
        console.error('[Seasonal] Dietary filtering error:', dietaryError);
        // Continue with unfiltered recipes if dietary processing fails
      }
    }

    res.json({
      success: true,
      season,
      recipes: processedRecipes,
      count: processedRecipes.length,
      source: 'fatsecret',
      dietaryFiltering: dietaryFilteringApplied,
      note: 'Seasonal recipes with dietary awareness',
    });
  } catch (error) {
    console.error('[Seasonal] Error:', error);
    res.status(500).json({error: 'Failed to get seasonal recipes'});
  }
});

// Get seasonal recipes for current season - Always fresh from FatSecret with dietary filtering
// Cache in background to build database
router.get('/seasonal/current', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const season = getCurrentSeason();
    const limit = parseInt(req.query.limit as string) || 20;
    const showConflictingRecipes = req.query.showConflictingRecipes !== 'false';

    console.log(
      `[Seasonal Current] Fetching fresh from FatSecret for ${season} (building database)...`,
    );

    // Always fetch fresh from FatSecret
    await RecipeCacheService.fetchSeasonalRecipes(season, 50);

    let recipes = await RecipeCacheService.getSeasonalRecipes(season, limit);
    let dietaryFilteringApplied = false;

    // Apply dietary filtering if user is authenticated
    if (req.user?.id) {
      try {
        console.log(
          `[Seasonal Current] Applying dietary filtering for user ${req.user.id}`,
        );
        recipes =
          await DietaryAwareRecipeService.processRecipesWithDietaryAwareness(
            recipes,
            {
              userId: req.user.id,
              showConflictingRecipes,
            },
          );
        dietaryFilteringApplied = true;
        console.log(
          `[Seasonal Current] Dietary filtering applied: ${recipes.length} recipes after filtering`,
        );
      } catch (dietaryError) {
        console.error(
          '[Seasonal Current] Dietary filtering error:',
          dietaryError,
        );
        // Continue with unfiltered recipes if dietary processing fails
      }
    }

    res.json({
      success: true,
      season,
      recipes,
      count: recipes.length,
      source: 'fatsecret',
      dietaryFiltering: dietaryFilteringApplied,
      note: 'Building recipe database - always fetching fresh with dietary awareness',
    });
  } catch (error) {
    console.error('[Seasonal Current] Error:', error);
    res.status(500).json({error: 'Failed to get seasonal recipes'});
  }
});

// Track recipe interaction
router.post(
  '/interaction',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const {recipeId, interactionType, rating} = req.body;
      const userId = req.user?.id;

      if (!recipeId || !interactionType) {
        res.status(400).json({error: 'Missing required fields'});
        return;
      }

      await RecipeCacheService.trackInteraction(
        recipeId,
        interactionType,
        userId,
        rating,
      );

      res.json({success: true});
    } catch (error) {
      console.error('[Interaction] Error:', error);
      res.status(500).json({error: 'Failed to track interaction'});
    }
  },
);

// Get recipe from cache
router.get('/recipe/:id', async (req, res): Promise<void> => {
  try {
    const {id} = req.params;
    const recipe = await RecipeCacheService.getRecipeById(id);

    if (!recipe) {
      res.status(404).json({error: 'Recipe not found in cache'});
      return;
    }

    res.json({success: true, recipe});
  } catch (error) {
    console.error('[Recipe Cache] Error:', error);
    res.status(500).json({error: 'Failed to get recipe'});
  }
});

// Admin: Trigger cache refresh
router.post(
  '/admin/refresh',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      // Check if user is admin
      if (!req.user?.is_admin) {
        res.status(403).json({error: 'Admin access required'});
        return;
      }

      // Run maintenance in background
      RecipeCacheService.runDailyMaintenance().catch(err =>
        console.error('[Cache Refresh] Error:', err),
      );

      res.json({success: true, message: 'Cache refresh started'});
    } catch (error) {
      console.error('[Cache Refresh] Error:', error);
      res.status(500).json({error: 'Failed to refresh cache'});
    }
  },
);

// Helper functions
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

function getSeasonalIngredients(season: string): string[] {
  const seasonalMap: Record<string, string[]> = {
    spring: ['asparagus', 'peas', 'strawberries', 'artichokes', 'radishes'],
    summer: [
      'tomatoes',
      'corn',
      'zucchini',
      'berries',
      'peaches',
      'watermelon',
    ],
    fall: ['pumpkin', 'squash', 'apples', 'sweet potato', 'brussels sprouts'],
    winter: ['kale', 'cabbage', 'citrus', 'root vegetables', 'pomegranate'],
  };
  return seasonalMap[season] || [];
}

export default router;
