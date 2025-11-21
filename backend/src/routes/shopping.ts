import express from 'express';
import {ShoppingListModel} from '../models/ShoppingList';
import {IngredientModel} from '../models/Ingredient';
import {authenticateToken} from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// Get current user's shopping list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const items = await ShoppingListModel.getUserItems(userId);
    return res.json({items});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get shopping list'});
  }
});

// Get user's shopping list (legacy - with userId in URL)
router.get('/user/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    const items = await ShoppingListModel.getUserItems(userId);
    res.json(items);
  } catch (_error) {
    res.status(500).json({error: 'Failed to get shopping list'});
  }
});

// Get shopping list by category
router.get('/user/:userId/categorized', async (req, res) => {
  try {
    const {userId} = req.params;
    const categorizedItems = await ShoppingListModel.getItemsByCategory(userId);
    res.json(categorizedItems);
  } catch (_error) {
    res.status(500).json({error: 'Failed to get categorized shopping list'});
  }
});

// Add item to shopping list (authenticated)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {ingredient, quantity, unit, category, recipeId} = req.body;

    const item = await ShoppingListModel.addItem(
      userId,
      ingredient,
      quantity,
      unit,
      category,
      recipeId,
    );
    return res.json({
      success: true,
      message: 'Item added to shopping list',
      item,
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to add item'});
  }
});

// Add multiple items to shopping list (bulk - authenticated)
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {items} = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({error: 'Items must be an array'});
    }

    const addedItems = [];
    for (const item of items) {
      const {ingredient, quantity, unit, category, recipeId} = item;
      const result = await ShoppingListModel.addItem(
        userId,
        ingredient,
        quantity,
        unit,
        category || 'other',
        recipeId,
      );
      addedItems.push(result);
    }

    return res.json({
      success: true,
      message: `${addedItems.length} items added to shopping list`,
      items: addedItems,
    });
  } catch (_error) {
    console.error('Bulk add error:', _error);
    return res.status(500).json({error: 'Failed to add items'});
  }
});

// Add item to shopping list (legacy - with userId in URL)
router.post('/user/:userId/items', async (req, res) => {
  try {
    const {userId} = req.params;
    const {ingredient, quantity, unit, category, recipeId} = req.body;

    await ShoppingListModel.addItem(
      userId,
      ingredient,
      quantity,
      unit,
      category,
      recipeId,
    );
    res.json({success: true, message: 'Item added to shopping list'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to add item'});
  }
});

// Update shopping list item (authenticated)
router.put('/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {itemId} = req.params;
    if (!itemId) {
      return res.status(400).json({error: 'Item ID is required'});
    }

    const {ingredient, quantity, unit, category} = req.body;

    await ShoppingListModel.updateItem(
      userId,
      itemId,
      ingredient,
      quantity,
      unit,
      category,
    );

    // Get the updated item to return
    const items = await ShoppingListModel.getUserItems(userId);
    const updatedItem = items.find(item => item.id === itemId);

    if (!updatedItem) {
      return res.status(404).json({error: 'Item not found'});
    }

    return res.json({
      success: true,
      message: 'Item updated',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Update item error:', error);
    return res.status(500).json({error: 'Failed to update item'});
  }
});

// Toggle item completion (authenticated)
router.patch('/:itemId/toggle', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {itemId} = req.params;
    if (!itemId) {
      return res.status(400).json({error: 'Item ID is required'});
    }

    // Get the item before toggling to check its current state
    const items = await ShoppingListModel.getUserItems(userId);
    const itemBeforeToggle = items.find(item => item.id === itemId);

    if (!itemBeforeToggle) {
      return res.status(404).json({error: 'Item not found'});
    }

    // Toggle the item
    await ShoppingListModel.toggleItemCompleted(userId, itemId);

    // Get the updated item
    const updatedItems = await ShoppingListModel.getUserItems(userId);
    const updatedItem = updatedItems.find(item => item.id === itemId);

    if (!updatedItem) {
      return res.status(404).json({error: 'Item not found after toggle'});
    }

    // If item was just marked as completed (bought), add to pantry
    if (!itemBeforeToggle.isCompleted && updatedItem.isCompleted) {
      try {
        // Find or create ingredient
        const ingredientName = updatedItem.ingredient.trim().toLowerCase();
        let ingredient = await IngredientModel.findByName(ingredientName);

        // If ingredient doesn't exist, create it as custom
        if (!ingredient) {
          ingredient = await IngredientModel.create({
            name: updatedItem.ingredient,
            category: updatedItem.category || 'other',
            isCustom: true,
          });
        }

        // Add to user's pantry
        await IngredientModel.addUserIngredient(userId, {
          ingredient_id: ingredient.id,
          quantity: parseFloat(updatedItem.quantity) || 1,
          unit: updatedItem.unit || 'piece',
          notes: 'Added from shopping list',
        });

        console.log(
          `✅ Added "${updatedItem.ingredient}" to pantry for user ${userId}`,
        );
      } catch (pantryError) {
        // Don't fail the toggle if pantry add fails
        console.error('Failed to add to pantry:', pantryError);
      }
    }

    return res.json({
      success: true,
      message: updatedItem.isCompleted
        ? 'Item marked as purchased and added to pantry'
        : 'Item unmarked',
      item: updatedItem,
      addedToPantry: !itemBeforeToggle.isCompleted && updatedItem.isCompleted,
    });
  } catch (error) {
    console.error('Toggle item error:', error);
    return res.status(500).json({error: 'Failed to toggle item'});
  }
});

// Delete all shopping list items (authenticated)
router.delete('/all/items', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    // Delete all items for this user
    await pool.query('DELETE FROM shopping_list_items WHERE user_id = $1', [
      userId,
    ]);
    return res.json({success: true, message: 'All items removed'});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to remove all items'});
  }
});

// Delete shopping list item (authenticated)
router.delete('/:itemId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    const {itemId} = req.params;
    if (!itemId) {
      return res.status(400).json({error: 'Item ID is required'});
    }

    await ShoppingListModel.removeItem(userId, itemId);
    return res.json({success: true, message: 'Item removed'});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to remove item'});
  }
});

// Update shopping list item (legacy)
router.put('/user/:userId/items/:itemId', async (req, res) => {
  try {
    const {userId, itemId} = req.params;
    const {ingredient, quantity, unit, category} = req.body;

    await ShoppingListModel.updateItem(
      userId,
      itemId,
      ingredient,
      quantity,
      unit,
      category,
    );
    res.json({success: true, message: 'Item updated'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to update item'});
  }
});

// Toggle item completion (legacy)
router.patch('/user/:userId/items/:itemId/toggle', async (req, res) => {
  try {
    const {userId, itemId} = req.params;

    await ShoppingListModel.toggleItemCompleted(userId, itemId);
    res.json({success: true, message: 'Item status updated'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to toggle item'});
  }
});

// Delete shopping list item (legacy)
router.delete('/user/:userId/items/:itemId', async (req, res) => {
  try {
    const {userId, itemId} = req.params;

    await ShoppingListModel.removeItem(userId, itemId);
    res.json({success: true, message: 'Item removed'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to remove item'});
  }
});

// Add recipe ingredients to shopping list
router.post('/user/:userId/recipe/:recipeId', async (req, res) => {
  try {
    const {userId, recipeId} = req.params;
    const {ingredients} = req.body;

    await ShoppingListModel.addRecipeIngredients(userId, recipeId, ingredients);
    res.json({
      success: true,
      message: 'Recipe ingredients added to shopping list',
    });
  } catch (_error) {
    res.status(500).json({error: 'Failed to add recipe ingredients'});
  }
});

// Clear completed items (authenticated)
router.delete('/clear-completed', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({error: 'Unauthorized'});
    }

    await ShoppingListModel.clearCompleted(userId);
    return res.json({success: true, message: 'Completed items cleared'});
  } catch (_error) {
    return res.status(500).json({error: 'Failed to clear completed items'});
  }
});

// Clear completed items (legacy)
router.delete('/user/:userId/completed', async (req, res) => {
  try {
    const {userId} = req.params;

    await ShoppingListModel.clearCompleted(userId);
    res.json({success: true, message: 'Completed items cleared'});
  } catch (_error) {
    res.status(500).json({error: 'Failed to clear completed items'});
  }
});

export default router;
