import {Router, Request, Response} from 'express';
import {body, validationResult} from 'express-validator';
import {IngredientModel} from '../models/Ingredient';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import {UserPointsModel} from '../models/UserPoints';
import mockIngredientsDB from '../config/mockIngredients';

const router = Router();

// Get user's pantry ingredients
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({error: 'User not authenticated'});
      return;
    }

    const ingredients = await IngredientModel.getUserIngredients(req.user.id);
    res.json({ingredients});
  } catch (error) {
    console.error('Get user ingredients error:', error);
    res.status(500).json({
      error: 'Failed to fetch ingredients',
      message: 'Unable to retrieve your ingredients',
    });
  }
});

// Search ingredients
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {q} = req.query;
    if (!q || typeof q !== 'string') {
      res.json({ingredients: []});
      return;
    }
    const ingredients = await mockIngredientsDB.searchIngredients(q, 20);
    res.json({ingredients});
  } catch (error) {
    console.error('Search ingredients error:', error);
    res.status(500).json({
      error: 'Failed to search ingredients',
      message: 'Unable to search ingredients',
    });
  }
});

// Get ingredient categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await mockIngredientsDB.getCategories();
    res.json({categories});
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'Unable to retrieve ingredient categories',
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
        message: 'The requested ingredient does not exist',
      });
      return;
    }
    res.json({ingredient});
  } catch (error) {
    console.error('Get ingredient error:', error);
    res.status(500).json({
      error: 'Failed to fetch ingredient',
      message: 'Unable to retrieve ingredient details',
    });
  }
});

// Add ingredient (simple POST) - with authentication
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({error: 'User not authenticated'});
      return;
    }

    const {ingredientId, customName, category, quantity, unit, expirationDate} =
      req.body;

    console.log('📝 Adding ingredient:', {
      userId: req.user.id,
      ingredientId,
      customName,
      category,
    });

    // If custom ingredient, create it first
    let finalIngredientId = ingredientId;
    if (customName && !ingredientId) {
      const customIngredient = await IngredientModel.addCustomIngredient({
        name: customName,
        category: category || 'other',
        default_unit: unit || 'piece',
      });
      finalIngredientId = customIngredient.id;
    }

    // Add to user's pantry
    const ingredientData: any = {
      ingredient_id: finalIngredientId,
      quantity: quantity || 1,
      unit: unit || 'piece',
    };
    if (expirationDate) {
      ingredientData.expiration_date = new Date(expirationDate);
    }
    await IngredientModel.addUserIngredient(req.user.id, ingredientData);

    // Fetch the full ingredient data with name and category
    const userIngredients = await IngredientModel.getUserIngredients(
      req.user.id,
    );
    const addedIngredient = userIngredients.find(
      ing => ing.ingredient_id?.toString() === finalIngredientId?.toString(),
    );

    // Award points for adding ingredient
    try {
      await UserPointsModel.addPoints(
        req.user.id,
        2,
        'ingredient_add',
        'Added ingredient to pantry',
      );
    } catch (pointsError) {
      console.warn('Failed to award points:', pointsError);
    }

    console.log('✅ Ingredient added:', addedIngredient);

    res.status(201).json({
      message: 'Ingredient added successfully',
      ingredient: addedIngredient,
    });
  } catch (error) {
    console.error('❌ Add ingredient error:', error);
    res.status(500).json({
      error: 'Failed to add ingredient',
      message: 'Unable to add ingredient',
    });
  }
});

// Update ingredient
router.put(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;
      const {quantity, unit} = req.body;

      console.log('📝 Updating ingredient:', {
        userId: req.user?.id,
        ingredientId: id,
        quantity,
        unit,
      });

      if (!req.user?.id) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      if (!id) {
        res.status(400).json({
          error: 'Invalid ingredient ID',
          message: 'Ingredient ID is required',
        });
        return;
      }

      // Update the ingredient in the database
      const updateData: any = {};
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (unit !== undefined) updateData.unit = unit;

      // First, get the ingredient to find its ingredient_id
      const userIngredients = await IngredientModel.getUserIngredients(
        req.user.id,
      );
      const ingredient = userIngredients.find(
        (ing: any) => ing.id.toString() === id,
      );

      if (!ingredient) {
        res.status(404).json({
          error: 'Ingredient not found',
          message: 'Ingredient not found in your inventory',
        });
        return;
      }

      // Update using the ingredient_id
      const updatedIngredient = await IngredientModel.updateUserIngredient(
        req.user.id,
        ingredient.ingredient_id,
        updateData,
      );

      if (!updatedIngredient) {
        res.status(404).json({
          error: 'Update failed',
          message: 'Unable to update ingredient',
        });
        return;
      }

      console.log('✅ Ingredient updated successfully:', updatedIngredient);

      res.json({
        message: 'Ingredient updated successfully',
        ingredient: updatedIngredient,
      });
    } catch (error) {
      console.error('❌ Update ingredient error:', error);
      res.status(500).json({
        error: 'Failed to update ingredient',
        message: 'Unable to update ingredient',
      });
    }
  },
);

// Delete ingredient
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const {id} = req.params;

      console.log('🗑️ DELETE request received:', {
        userId: req.user?.id,
        ingredientId: id,
        idType: typeof id,
      });

      if (!req.user?.id) {
        console.log('❌ No user ID in request');
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      if (!id) {
        console.log('❌ No ingredient ID provided');
        res.status(400).json({
          error: 'Invalid ingredient ID',
          message: 'Ingredient ID is required',
        });
        return;
      }

      console.log('🔄 Attempting to delete ingredient...');
      // Delete from user's pantry
      await IngredientModel.removeUserIngredient(req.user.id, id);

      console.log('✅ Ingredient deleted successfully');
      res.json({
        message: 'Ingredient deleted successfully',
      });
    } catch (error) {
      console.error('❌ Delete ingredient error:', error);
      res.status(500).json({
        error: 'Failed to delete ingredient',
        message: 'Unable to delete ingredient',
      });
    }
  },
);

// Add custom ingredient
router.post(
  '/custom',
  [
    body('name').trim().isLength({min: 1, max: 100}),
    body('category').isIn([
      'proteins',
      'vegetables',
      'fruits',
      'grains',
      'dairy',
      'spices',
      'condiments',
    ]),
    body('description').optional().trim().isLength({max: 500}),
    body('default_unit').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      // Use mock database in development
      const ingredient = await mockIngredientsDB.create({
        name: req.body.name,
        category: req.body.category,
        common_unit: req.body.default_unit || 'piece',
      });
      res.status(201).json({
        message: 'Custom ingredient added successfully',
        ingredient,
      });
    } catch (error) {
      console.error('Add custom ingredient error:', error);
      res.status(500).json({
        error: 'Failed to add ingredient',
        message: 'Unable to add custom ingredient',
      });
    }
  },
);

// Get user's pantry ingredients
router.get(
  '/pantry/my',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }
      const ingredients = await IngredientModel.getUserIngredients(req.user.id);
      res.json({ingredients});
    } catch (error) {
      console.error('Get user ingredients error:', error);
      res.status(500).json({
        error: 'Failed to fetch pantry',
        message: 'Unable to retrieve your ingredients',
      });
    }
  },
);

// Add ingredient to user's pantry
router.post(
  '/pantry',
  authenticateToken,
  [
    body('ingredient_id').isUUID(),
    body('quantity').optional().isFloat({min: 0}),
    body('unit').optional().isString(),
    body('expiration_date').optional().isISO8601(),
    body('notes').optional().trim().isLength({max: 500}),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }
      const userIngredient = await IngredientModel.addUserIngredient(
        req.user.id,
        req.body,
      );
      res.status(201).json({
        message: 'Ingredient added to pantry',
        ingredient: userIngredient,
      });
    } catch (error) {
      console.error('Add user ingredient error:', error);
      res.status(500).json({
        error: 'Failed to add to pantry',
        message: 'Unable to add ingredient to your pantry',
      });
    }
  },
);

// Update ingredient in user's pantry
router.put(
  '/pantry/:ingredientId',
  authenticateToken,
  [
    body('quantity').optional().isFloat({min: 0}),
    body('unit').optional().isString(),
    body('expiration_date').optional().isISO8601(),
    body('notes').optional().trim().isLength({max: 500}),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      if (!req.user?.id) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }
      const userIngredient = await IngredientModel.updateUserIngredient(
        req.user.id,
        req.params.ingredientId || '',
        req.body,
      );

      if (!userIngredient) {
        res.status(404).json({
          error: 'Ingredient not found',
          message: 'Ingredient not found in your pantry',
        });
        return;
      }

      res.json({
        message: 'Pantry ingredient updated',
        ingredient: userIngredient,
      });
    } catch (error) {
      console.error('Update user ingredient error:', error);
      res.status(500).json({
        error: 'Failed to update pantry',
        message: 'Unable to update ingredient in your pantry',
      });
    }
  },
);

// Remove ingredient from user's pantry
router.delete(
  '/pantry/:ingredientId',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }
      await IngredientModel.removeUserIngredient(
        req.user.id,
        req.params.ingredientId || '',
      );
      res.json({
        message: 'Ingredient removed from pantry',
      });
    } catch (error) {
      console.error('Remove user ingredient error:', error);
      res.status(500).json({
        error: 'Failed to remove from pantry',
        message: 'Unable to remove ingredient from your pantry',
      });
    }
  },
);

export default router;
