import {Router} from 'express';
import {RecipeEnhancementService} from '../services/RecipeEnhancementService';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = Router();

// RATINGS
router.post('/ratings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id as string);
    const {recipeId, recipeType, rating, review} = req.body;
    const result = await RecipeEnhancementService.rateRecipe(
      userId,
      recipeId,
      recipeType,
      rating,
      review,
    );
    res.json({success: true, rating: result});
  } catch (error) {
    console.error('Error rating recipe:', error);
    res.status(500).json({error: 'Failed to rate recipe'});
  }
});

router.get('/ratings/:recipeId/:recipeType', async (req, res) => {
  try {
    const {recipeId, recipeType} = req.params;
    const ratings = await RecipeEnhancementService.getRecipeRatings(
      recipeId,
      recipeType as 'api' | 'user',
    );
    const reviews = await RecipeEnhancementService.getRecipeReviews(
      recipeId,
      recipeType as 'api' | 'user',
    );
    res.json({success: true, ratings, reviews});
  } catch (error) {
    console.error('Error getting ratings:', error);
    res.status(500).json({error: 'Failed to get ratings'});
  }
});

// COLLECTIONS
router.post(
  '/collections',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id as string);
      const {name, description, icon} = req.body;
      const collection = await RecipeEnhancementService.createCollection(
        userId,
        name,
        description,
        icon,
      );
      res.json({success: true, collection});
    } catch (error) {
      console.error('Error creating collection:', error);
      res.status(500).json({error: 'Failed to create collection'});
    }
  },
);

router.get('/collections', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.user!.id as string);
    const collections =
      await RecipeEnhancementService.getUserCollections(userId);
    res.json({success: true, collections});
  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({error: 'Failed to get collections'});
  }
});

router.post(
  '/collections/:id/recipes',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const {recipeId, recipeType} = req.body;
      await RecipeEnhancementService.addToCollection(
        collectionId,
        recipeId,
        recipeType,
      );
      res.json({success: true});
    } catch (error) {
      console.error('Error adding to collection:', error);
      res.status(500).json({error: 'Failed to add to collection'});
    }
  },
);

router.get(
  '/collections/:id/recipes',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const recipes =
        await RecipeEnhancementService.getCollectionRecipes(collectionId);
      res.json({success: true, recipes});
    } catch (error) {
      console.error('Error getting collection recipes:', error);
      res.status(500).json({error: 'Failed to get recipes'});
    }
  },
);

// MEAL PLANNING
router.post('/meal-plans', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id as string;
    const {recipeId, recipeType, plannedDate, mealType, notes} = req.body;
    const mealPlan = await RecipeEnhancementService.addMealPlan(
      userId,
      recipeId,
      recipeType,
      plannedDate,
      mealType,
      notes,
    );
    res.json({success: true, mealPlan});
  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({error: 'Failed to create meal plan'});
  }
});

router.get('/meal-plans', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id as string;
    const {startDate, endDate} = req.query;
    const mealPlans = await RecipeEnhancementService.getMealPlans(
      userId,
      startDate as string,
      endDate as string,
    );
    res.json({success: true, mealPlans});
  } catch (error) {
    console.error('Error getting meal plans:', error);
    res.status(500).json({error: 'Failed to get meal plans'});
  }
});

router.put(
  '/meal-plans/:id/complete',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id as string);
      const mealPlanId = parseInt(req.params.id);
      await RecipeEnhancementService.markMealComplete(mealPlanId, userId);
      res.json({success: true});
    } catch (error) {
      console.error('Error marking meal complete:', error);
      res.status(500).json({error: 'Failed to mark complete'});
    }
  },
);

router.delete(
  '/meal-plans/:id',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id as string);
      const mealPlanId = parseInt(req.params.id);
      await RecipeEnhancementService.deleteMealPlan(mealPlanId, userId);
      res.json({success: true});
    } catch (error) {
      console.error('Error deleting meal plan:', error);
      res.status(500).json({error: 'Failed to delete meal plan'});
    }
  },
);

// COOKING HISTORY
router.post(
  '/cooking-history',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id as string);
      const {recipeId, recipeType, rating, notes} = req.body;
      const history = await RecipeEnhancementService.markRecipeCooked(
        userId,
        recipeId,
        recipeType,
        rating,
        notes,
      );
      res.json({success: true, history});
    } catch (error) {
      console.error('Error marking recipe cooked:', error);
      res.status(500).json({error: 'Failed to mark recipe cooked'});
    }
  },
);

router.get(
  '/cooking-history',
  authenticateToken,
  async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.user!.id as string);
      const history = await RecipeEnhancementService.getCookingHistory(userId);
      res.json({success: true, history});
    } catch (error) {
      console.error('Error getting cooking history:', error);
      res.status(500).json({error: 'Failed to get history'});
    }
  },
);

export default router;
