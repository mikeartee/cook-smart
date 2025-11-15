import express from 'express';
import { ShoppingListModel } from '../models/ShoppingList';

const router = express.Router();

// Get user's shopping list
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const items = await ShoppingListModel.getUserItems(userId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get shopping list' });
  }
});

// Get shopping list by category
router.get('/user/:userId/categorized', async (req, res) => {
  try {
    const { userId } = req.params;
    const categorizedItems = await ShoppingListModel.getItemsByCategory(userId);
    res.json(categorizedItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categorized shopping list' });
  }
});

// Add item to shopping list
router.post('/user/:userId/items', async (req, res) => {
  try {
    const { userId } = req.params;
    const { ingredient, quantity, unit, category, recipeId } = req.body;
    
    await ShoppingListModel.addItem(userId, ingredient, quantity, unit, category, recipeId);
    res.json({ success: true, message: 'Item added to shopping list' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update shopping list item
router.put('/user/:userId/items/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { ingredient, quantity, unit, category } = req.body;
    
    await ShoppingListModel.updateItem(userId, itemId, ingredient, quantity, unit, category);
    res.json({ success: true, message: 'Item updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Toggle item completion
router.patch('/user/:userId/items/:itemId/toggle', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    await ShoppingListModel.toggleItemCompleted(userId, itemId);
    res.json({ success: true, message: 'Item status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle item' });
  }
});

// Delete shopping list item
router.delete('/user/:userId/items/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    await ShoppingListModel.removeItem(userId, itemId);
    res.json({ success: true, message: 'Item removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Add recipe ingredients to shopping list
router.post('/user/:userId/recipe/:recipeId', async (req, res) => {
  try {
    const { userId, recipeId } = req.params;
    const { ingredients } = req.body;
    
    await ShoppingListModel.addRecipeIngredients(userId, recipeId, ingredients);
    res.json({ success: true, message: 'Recipe ingredients added to shopping list' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add recipe ingredients' });
  }
});

// Clear completed items
router.delete('/user/:userId/completed', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await ShoppingListModel.clearCompleted(userId);
    res.json({ success: true, message: 'Completed items cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear completed items' });
  }
});

export default router;
