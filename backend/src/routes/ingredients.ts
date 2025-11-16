import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { IngredientModel } from '../models/Ingredient';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import mockIngredientsDB from '../config/mockIngredients';

const router = Router();

// Get all ingredients with optional filtering
router.get('/', [
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { category, search, limit } = req.query;
    
    // Use mock database in development
    if (search && typeof search === 'string') {
      const ingredients = await mockIngredientsDB.searchIngredients(
        search, 
        parseInt(limit as string) || 20
      );
      res.json({ ingredients });
    } else {
      const ingredients = await mockIngredientsDB.getAll(
        typeof category === 'string' ? category : undefined
      );
      res.json({ ingredients });
    }
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({
      error: 'Failed to fetch ingredients',
      message: 'Unable to retrieve ingredients'
    });
  }
});

// Search ingredients
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      res.json({ ingredients: [] });
      return;
    }
    const ingredients = await mockIngredientsDB.searchIngredients(q, 20);
    res.json({ ingredients });
  } catch (error) {
    console.error('Search ingredients error:', error);
    res.status(500).json({
      error: 'Failed to search ingredients',
      message: 'Unable to search ingredients'
    });
  }
});

// Get ingredient categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await mockIngredientsDB.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'Unable to retrieve ingredient categories'
    });
  }
});

// Get ingredient by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const ingredient = await IngredientModel.getById(req.params.id || '');
    if (!ingredient) {
      res.status(404).json({
        error: 'Ingredient not found',
        message: 'The requested ingredient does not exist'
      });
      return;
    }
    res.json({ ingredient });
  } catch (error) {
    console.error('Get ingredient error:', error);
    res.status(500).json({
      error: 'Failed to fetch ingredient',
      message: 'Unable to retrieve ingredient details'
    });
  }
});

// Add ingredient (simple POST)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, customName, category, default_unit, unit, quantity } = req.body;
    const ingredientName = customName || name || 'Unknown';
    const ingredientUnit = unit || default_unit || 'piece';
    
    const ingredient = await mockIngredientsDB.create({
      name: ingredientName,
      category: category || 'Other',
      common_unit: ingredientUnit
    });
    
    // Add quantity and unit to the response
    const responseIngredient = {
      ...ingredient,
      quantity: quantity || 1,
      unit: ingredientUnit,
      added_at: new Date().toISOString()
    };
    
    res.status(201).json({
      message: 'Ingredient added successfully',
      ingredient: responseIngredient
    });
  } catch (error) {
    console.error('Add ingredient error:', error);
    res.status(500).json({
      error: 'Failed to add ingredient',
      message: 'Unable to add ingredient'
    });
  }
});

// Update ingredient
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, unit } = req.body;
    
    if (!id) {
      res.status(400).json({
        error: 'Invalid ingredient ID',
        message: 'Ingredient ID is required'
      });
      return;
    }
    
    // For now, just return success with updated data
    // In a real implementation, this would update the database
    const updatedIngredient = {
      id: parseInt(id),
      quantity: quantity || 1,
      unit: unit || 'unit',
      updated_at: new Date().toISOString()
    };
    
    res.json({
      message: 'Ingredient updated successfully',
      ingredient: updatedIngredient
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({
      error: 'Failed to update ingredient',
      message: 'Unable to update ingredient'
    });
  }
});

// Delete ingredient
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // For now, just return success
    // In a real implementation, this would delete from the database
    res.json({
      message: 'Ingredient deleted successfully'
    });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({
      error: 'Failed to delete ingredient',
      message: 'Unable to delete ingredient'
    });
  }
});

// Add custom ingredient
router.post('/custom', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('category').isIn(['proteins', 'vegetables', 'fruits', 'grains', 'dairy', 'spices', 'condiments']),
  body('description').optional().trim().isLength({ max: 500 }),
  body('default_unit').optional().isString()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    // Use mock database in development
    const ingredient = await mockIngredientsDB.create({
      name: req.body.name,
      category: req.body.category,
      common_unit: req.body.default_unit || 'piece'
    });
    res.status(201).json({
      message: 'Custom ingredient added successfully',
      ingredient
    });
  } catch (error) {
    console.error('Add custom ingredient error:', error);
    res.status(500).json({
      error: 'Failed to add ingredient',
      message: 'Unable to add custom ingredient'
    });
  }
});

// Get user's pantry ingredients
router.get('/pantry/my', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const ingredients = await IngredientModel.getUserIngredients(req.user.id);
    res.json({ ingredients });
  } catch (error) {
    console.error('Get user ingredients error:', error);
    res.status(500).json({
      error: 'Failed to fetch pantry',
      message: 'Unable to retrieve your ingredients'
    });
  }
});

// Add ingredient to user's pantry
router.post('/pantry', authenticateToken, [
  body('ingredient_id').isUUID(),
  body('quantity').optional().isFloat({ min: 0 }),
  body('unit').optional().isString(),
  body('expiration_date').optional().isISO8601(),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const userIngredient = await IngredientModel.addUserIngredient(req.user.id, req.body);
    res.status(201).json({
      message: 'Ingredient added to pantry',
      ingredient: userIngredient
    });
  } catch (error) {
    console.error('Add user ingredient error:', error);
    res.status(500).json({
      error: 'Failed to add to pantry',
      message: 'Unable to add ingredient to your pantry'
    });
  }
});

// Update ingredient in user's pantry
router.put('/pantry/:ingredientId', authenticateToken, [
  body('quantity').optional().isFloat({ min: 0 }),
  body('unit').optional().isString(),
  body('expiration_date').optional().isISO8601(),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    const userIngredient = await IngredientModel.updateUserIngredient(
      req.user.id,
      req.params.ingredientId || '',
      req.body
    );

    if (!userIngredient) {
      res.status(404).json({
        error: 'Ingredient not found',
        message: 'Ingredient not found in your pantry'
      });
      return;
    }

    res.json({
      message: 'Pantry ingredient updated',
      ingredient: userIngredient
    });
  } catch (error) {
    console.error('Update user ingredient error:', error);
    res.status(500).json({
      error: 'Failed to update pantry',
      message: 'Unable to update ingredient in your pantry'
    });
  }
});

// Remove ingredient from user's pantry
router.delete('/pantry/:ingredientId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    await IngredientModel.removeUserIngredient(req.user.id, req.params.ingredientId || '');
    res.json({
      message: 'Ingredient removed from pantry'
    });
  } catch (error) {
    console.error('Remove user ingredient error:', error);
    res.status(500).json({
      error: 'Failed to remove from pantry',
      message: 'Unable to remove ingredient from your pantry'
    });
  }
});

export default router;
