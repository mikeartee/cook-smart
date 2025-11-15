import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import barcodeService from '../services/barcodeService';
import { IngredientModel } from '../models/Ingredient';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Lookup product by barcode
router.get('/lookup/:barcode', [
  param('barcode').isLength({ min: 8, max: 14 }).isNumeric()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Invalid barcode',
        details: errors.array()
      });
      return;
    }

    const { barcode } = req.params;
    
    // First check if we already have this barcode in our database
    const existingIngredient = await IngredientModel.getByBarcode(barcode || '');
    if (existingIngredient) {
      res.json({
        found: true,
        product: {
          ...existingIngredient,
          source: 'database'
        },
        cached: true
      });
      return;
    }

    // Lookup using barcode service
    const result = await barcodeService.lookupBarcode(barcode || '');
    
    if (result.found && result.product) {
      // Optionally cache successful lookups in our database
      try {
        await IngredientModel.addCustomIngredient({
          name: result.product.name,
          category: result.product.category,
          description: `${result.product.brand ? result.product.brand + ' - ' : ''}Scanned product`,
          nutrition_per_100g: result.product.nutrition_per_100g,
          default_unit: 'piece'
        });
      } catch (cacheError) {
        // Don't fail the request if caching fails
        console.warn('Failed to cache barcode result:', cacheError);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({
      error: 'Barcode lookup failed',
      message: 'Unable to lookup product information'
    });
  }
});

// Add scanned product to user's pantry
router.post('/scan-to-pantry', authenticateToken, [
  param('barcode').isLength({ min: 8, max: 14 }).isNumeric()
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Invalid barcode',
        details: errors.array()
      });
      return;
    }

    const { barcode } = req.body;
    const { quantity, unit, notes } = req.body;

    // Lookup the product
    const result = await barcodeService.lookupBarcode(barcode || '');
    
    if (!result.found || !result.product) {
      res.status(404).json({
        error: 'Product not found',
        message: 'Unable to find product information for this barcode',
        manualEntryRequired: true
      });
      return;
    }

    // Check if ingredient exists in our database
    let ingredient = await IngredientModel.getByBarcode(barcode);
    
    if (!ingredient) {
      // Create new ingredient from barcode result
      ingredient = await IngredientModel.addCustomIngredient({
        name: result.product.name,
        category: result.product.category,
        description: `${result.product.brand ? result.product.brand + ' - ' : ''}Scanned product`,
        nutrition_per_100g: result.product.nutrition_per_100g,
        default_unit: unit || 'piece'
      });
    }

    // Add to user's pantry
    const userIngredient = await IngredientModel.addUserIngredient(req.user.id, {
      ingredient_id: ingredient.id,
      quantity: quantity || 1,
      unit: unit || ingredient.default_unit,
      notes
    });

    res.status(201).json({
      message: 'Product scanned and added to pantry',
      product: result.product,
      ingredient: userIngredient
    });
  } catch (error) {
    console.error('Scan to pantry error:', error);
    res.status(500).json({
      error: 'Failed to add scanned product',
      message: 'Unable to add product to your pantry'
    });
  }
});

// Get barcode service usage statistics
router.get('/usage', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const usage = barcodeService.getNutritionixUsage();
    
    res.json({
      nutritionix: usage,
      message: usage.remaining < 100 ? 'Approaching monthly limit' : 'Usage within limits'
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics'
    });
  }
});

// Test endpoint for barcode scanning reliability
router.get('/test/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const startTime = Date.now();
    
    const result = await barcodeService.lookupBarcode(barcode || '');
    const responseTime = Date.now() - startTime;
    
    res.json({
      ...result,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Barcode test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
