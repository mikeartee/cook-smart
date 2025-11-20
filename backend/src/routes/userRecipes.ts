import express from 'express';
import {UserRecipeModel} from '../models/UserRecipe';
import {authenticateToken} from '../middleware/auth';

const router = express.Router();

// Create a new recipe
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {
      title,
      description,
      prepTime,
      cookTime,
      servings,
      category,
      difficulty,
      imageUrl,
      isPublic,
      ingredients,
      instructions,
    } = req.body;

    if (!title || !ingredients || !instructions) {
      return res.status(400).json({
        error: 'Title, ingredients, and instructions are required',
      });
    }

    const recipe = await UserRecipeModel.createRecipe(userId, {
      title,
      description,
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 4,
      category,
      difficulty: difficulty || 'medium',
      imageUrl,
      isPublic: isPublic || false,
      ingredients,
      instructions,
    });

    return res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      recipe,
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return res.status(500).json({error: 'Failed to create recipe'});
  }
});

// Get current user's recipes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const recipes = await UserRecipeModel.getUserRecipes(userId);
    return res.json({recipes});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get recipes'});
  }
});

// Get a specific recipe by ID
router.get('/:recipeId', async (req, res) => {
  try {
    const {recipeId} = req.params;
    const recipe = await UserRecipeModel.getRecipeById(parseInt(recipeId));

    if (!recipe) {
      return res.status(404).json({error: 'Recipe not found'});
    }

    return res.json({recipe});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get recipe'});
  }
});

// Update a recipe
router.put('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {recipeId} = req.params;
    const updates = req.body;

    const recipe = await UserRecipeModel.updateRecipe(
      parseInt(recipeId),
      userId,
      updates,
    );

    if (!recipe) {
      return res.status(404).json({error: 'Recipe not found or unauthorized'});
    }

    return res.json({
      success: true,
      message: 'Recipe updated successfully',
      recipe,
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to update recipe'});
  }
});

// Delete a recipe
router.delete('/:recipeId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {recipeId} = req.params;
    const deleted = await UserRecipeModel.deleteRecipe(
      parseInt(recipeId),
      userId,
    );

    if (!deleted) {
      return res.status(404).json({error: 'Recipe not found or unauthorized'});
    }

    return res.json({
      success: true,
      message: 'Recipe deleted successfully',
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to delete recipe'});
  }
});

// Get public recipes (community recipes)
router.get('/public/all', async (req, res) => {
  try {
    const {limit = '20', offset = '0'} = req.query;
    const recipes = await UserRecipeModel.getPublicRecipes(
      parseInt(limit as string),
      parseInt(offset as string),
    );
    return res.json({recipes});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get public recipes'});
  }
});

// Toggle favorite on a recipe
router.post('/:recipeId/favorite', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {recipeId} = req.params;
    const isFavorited = await UserRecipeModel.toggleFavorite(
      parseInt(recipeId),
      userId,
    );

    return res.json({
      success: true,
      isFavorited,
      message: isFavorited
        ? 'Recipe added to favorites'
        : 'Recipe removed from favorites',
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to toggle favorite'});
  }
});

export default router;
