import {Router} from 'express';
import {UserRecipeService} from '../services/UserRecipeService';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = Router();

// Create recipe
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const recipe = req.body;

    const recipeId = await UserRecipeService.createRecipe(userId, {
      ...recipe,
      user_id: userId,
    });

    res.json({success: true, recipeId});
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({error: 'Failed to create recipe'});
  }
});

// Get user's recipes
router.get('/my-recipes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const recipes = await UserRecipeService.getUserRecipes(userId);

    res.json({success: true, recipes});
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({error: 'Failed to get recipes'});
  }
});

// Get recipe details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const recipeId = parseInt(req.params.id);

    const recipe = await UserRecipeService.getRecipeDetails(recipeId, userId);

    if (!recipe) {
      res.status(404).json({error: 'Recipe not found'});
      return;
    }

    res.json({success: true, recipe});
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({error: 'Failed to get recipe'});
  }
});

// Search public recipes
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const recipes = await UserRecipeService.searchPublicRecipes(query);

    res.json({success: true, recipes});
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({error: 'Failed to search recipes'});
  }
});

// Delete recipe
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const recipeId = parseInt(req.params.id);

    await UserRecipeService.deleteRecipe(recipeId, userId);

    res.json({success: true, message: 'Recipe deleted'});
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({error: error.message || 'Failed to delete recipe'});
  }
});

export default router;
