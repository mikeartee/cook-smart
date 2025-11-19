import { Router, Request, Response } from 'express';
import { query, param } from 'express-validator';
import { RecipeProviderService } from '../services/RecipeProviderService';
import { APIUsageLogModel } from '../models/APIUsageLog';
import { UserPointsModel } from '../models/UserPoints';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import themealdbService from '../services/TheMealDBService';

// Initialize recipe provider service with TheMealDB only (100% free, unlimited)
const recipeProviderService = new RecipeProviderService([
  themealdbService,
]);

const router = Router();

// Search recipes by ingredients
router.get('/search', authenticateToken, [
  query('ingredients').isString().notEmpty()
], async (req: AuthRequest, res: Response) => {
  try {
    const { ingredients } = req.query;
    
    if (!ingredients || typeof ingredients !== 'string') {
      res.status(400).json({
        error: 'Missing ingredients parameter',
        message: 'Please provide comma-separated ingredient names'
      });
      return;
    }
    
    const ingredientList = ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0);
    
    if (ingredientList.length === 0) {
      res.status(400).json({
        error: 'No valid ingredients provided',
        message: 'Please provide at least one ingredient'
      });
      return;
    }
    
    console.log(`Searching recipes for ingredients: ${ingredientList.join(', ')}`);
    
    const recipes = await recipeProviderService.searchByIngredients(ingredientList, 20);
    
    // Award points for recipe search (only if user is authenticated)
    if (req.user?.id && recipes.length > 0) {
      try {
        await UserPointsModel.addPoints(req.user.id, 1, 'recipe_search', 'Searched for recipes');
      } catch (pointsError) {
        console.warn('Failed to award points:', pointsError);
      }
    }
    
    // Determine if results are from cache or API
    const provider = recipes.length > 0 ? (recipes[0]?.provider || 'unknown') : 'unknown';
    
    res.json({
      recipes,
      count: recipes.length,
      provider,
      message: recipes.length === 0 ? 'No recipes found. Try different ingredients.' : undefined
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({
      error: 'Failed to search recipes',
      message: 'Unable to search recipes at this time'
    });
  }
});

// Get recipe details by ID
router.get('/:id', [
  param('id').isNumeric()
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({
        error: 'Missing recipe ID',
        message: 'Please provide a valid recipe ID'
      });
      return;
    }
    
    console.log(`Fetching recipe details for ID: ${id}`);
    
    const recipe = await recipeProviderService.getRecipeDetails(id);
    
    res.json({
      recipe,
      provider: recipe.provider || 'unknown'
    });
  } catch (error) {
    console.error('Recipe details error:', error);
    res.status(500).json({
      error: 'Failed to fetch recipe details',
      message: 'Unable to retrieve recipe information'
    });
  }
});

// Get cache statistics (admin endpoint)
router.get('/admin/cache-stats', async (req: Request, res: Response) => {
  try {
    const stats = await recipeProviderService.getCacheStats();
    
    res.json({
      stats,
      message: 'Cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch cache statistics',
      message: 'Unable to retrieve cache stats'
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
      message: 'API usage statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: 'Unable to retrieve usage stats'
    });
  }
});

export default router;
