import express from 'express';
import RecipeCacheService from '../services/RecipeCacheService';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = express.Router();

// Get trending recipes - Always fresh from FatSecret
// Cache in background to build database
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    console.log(
      '[Trending] Fetching fresh from FatSecret (building database)...',
    );

    // Always fetch fresh from FatSecret
    await RecipeCacheService.fetchTrendingFromFatSecret();
    await RecipeCacheService.updateTrendingScores();

    const recipes = await RecipeCacheService.getTrendingRecipes(limit);

    res.json({
      success: true,
      recipes,
      count: recipes.length,
      source: 'fatsecret',
      note: 'Building recipe database - always fetching fresh',
    });
  } catch (error) {
    console.error('[Trending] Error:', error);
    res.status(500).json({error: 'Failed to get trending recipes'});
  }
});

// Get seasonal recipes - Always fresh from FatSecret
// Cache in background to build database
router.get('/seasonal', async (req, res) => {
  try {
    const season = (req.query.season as string) || getCurrentSeason();
    const limit = parseInt(req.query.limit as string) || 20;

    console.log(
      `[Seasonal] Fetching fresh from FatSecret for ${season} (building database)...`,
    );

    // Always fetch fresh from FatSecret
    await RecipeCacheService.fetchSeasonalRecipes(season, 50);

    const recipes = await RecipeCacheService.getSeasonalRecipes(season, limit);

    res.json({
      success: true,
      season,
      recipes,
      count: recipes.length,
      source: 'fatsecret',
      note: 'Building recipe database - always fetching fresh',
    });
  } catch (error) {
    console.error('[Seasonal] Error:', error);
    res.status(500).json({error: 'Failed to get seasonal recipes'});
  }
});

// Get seasonal recipes for current season - Always fresh from FatSecret
// Cache in background to build database
router.get('/seasonal/current', async (req, res) => {
  try {
    const season = getCurrentSeason();
    const limit = parseInt(req.query.limit as string) || 20;

    console.log(
      `[Seasonal Current] Fetching fresh from FatSecret for ${season} (building database)...`,
    );

    // Always fetch fresh from FatSecret
    await RecipeCacheService.fetchSeasonalRecipes(season, 50);

    const recipes = await RecipeCacheService.getSeasonalRecipes(season, limit);

    res.json({
      success: true,
      season,
      recipes,
      count: recipes.length,
      source: 'fatsecret',
      note: 'Building recipe database - always fetching fresh',
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

// Helper function
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

export default router;
