import { Router, Request, Response } from 'express';
import { query, body, validationResult } from 'express-validator';
import { IngredientModel } from '../models/Ingredient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

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
    
    if (search && typeof search === 'string') {
      const ingredients = await IngredientModel.searchIngredients(
        search, 
        parseInt(limit as string) || 20
      );
      res.json({ ingredients });
    } else {
      const ingredients = await IngredientModel.getAll(
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

// Get ingredient categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await IngredientModel.getCategories();
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

// Add custom ingredient
router.post('/custom', authenticateToken, [
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

    const ingredient = await IngredientModel.addCustomIngredient(req.body);
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
