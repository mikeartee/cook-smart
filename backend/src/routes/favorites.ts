import express from 'express';
import {FavoriteRecipeService} from '../services/FavoriteRecipeService';

const router = express.Router();

// Add recipe to favorites
router.post('/user/:userId/recipe/:recipeId', async (req, res) => {
  try {
    const {userId, recipeId} = req.params;
    const {notes} = req.body;

    await FavoriteRecipeService.addFavorite(userId, recipeId, notes);
    res.json({success: true, message: 'Recipe added to favorites'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to add favorite'});
  }
});

// Remove recipe from favorites
router.delete('/user/:userId/recipe/:recipeId', async (req, res) => {
  try {
    const {userId, recipeId} = req.params;

    await FavoriteRecipeService.removeFavorite(userId, recipeId);
    res.json({success: true, message: 'Recipe removed from favorites'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to remove favorite'});
  }
});

// Get user's favorite recipes
router.get('/user/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    const {limit = '20', offset = '0'} = req.query;

    const favorites = await FavoriteRecipeService.getUserFavoriteRecipes(
      userId,
      parseInt(limit as string),
      parseInt(offset as string),
    );

    res.json(favorites);
  } catch (_error) {
    res.status(500).json({error: 'Failed to get favorites'});
  }
});

// Check if recipe is favorited by user
router.get('/user/:userId/recipe/:recipeId/status', async (req, res) => {
  try {
    const {userId, recipeId} = req.params;

    const isFavorite = await FavoriteRecipeService.isFavorite(userId, recipeId);
    res.json({isFavorite});
  } catch (_error) {
    res.status(500).json({error: 'Failed to check favorite status'});
  }
});

// Get favorite count for recipe
router.get('/recipe/:recipeId/count', async (req, res) => {
  try {
    const {recipeId} = req.params;

    const count = await FavoriteRecipeService.getFavoriteCount(recipeId);
    res.json({count});
  } catch (_error) {
    res.status(500).json({error: 'Failed to get favorite count'});
  }
});

export default router;
