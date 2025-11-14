import { Router, Request, Response } from 'express';
import { query, body, param, validationResult } from 'express-validator';
import recipeService from '../services/recipeService';
import { IngredientModel } from '../models/Ingredient';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { db } from '../config/database';

const router = Router();

// Find recipes based on ingredients
router.get('/find', authenticateToken, [
  query('ingredients').optional().isString(),
  query('dietary_restrictions').optional().isString(),
  query('allergies').optional().isString(),
  query('max_time').optional().isInt({ min: 1, max: 300 }),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  query('cuisine').optional().isString(),
  query('servings').optional().isInt({ min: 1, max: 12 })
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const {
      ingredients: ingredientsParam,
      dietary_restrictions,
      allergies,
      max_time,
      difficulty,
      cuisine,
      servings
    } = req.query;

    // Get user's pantry ingredients if no specific ingredients provided
    let ingredients: string[] = [];
    
    if (ingredientsParam && typeof ingredientsParam === 'string') {
      ingredients = ingredientsParam.split(',').map(i => i.trim());
    } else {
      // Use user's pantry ingredients
      const userIngredients = await IngredientModel.getUserIngredients(req.user.id);
      ingredients = userIngredients.map(ui => ui.ingredient?.name || '').filter(Boolean);
    }

    if (ingredients.length === 0) {
      res.status(400).json({
        error: 'No ingredients provided',
        message: 'Please add ingredients to your pantry or specify ingredients in the query'
      });
      return;
    }

    // Search for recipes
    const searchParams: any = { ingredients };
    
    if (dietary_restrictions) {
      searchParams.dietary_restrictions = (dietary_restrictions as string).split(',');
    }
    if (allergies) {
      searchParams.allergies = (allergies as string).split(',');
    }
    if (max_time) {
      searchParams.max_time = parseInt(max_time as string);
    }
    if (difficulty) {
      searchParams.difficulty = difficulty as string;
    }
    if (cuisine) {
      searchParams.cuisine = cuisine as string;
    }
    if (servings) {
      searchParams.servings = parseInt(servings as string);
    }
    
    const recipes = await recipeService.findRecipes(searchParams, req.user.id);

    // Categorize recipes by match quality and safety
    const safeRecipes = recipes.filter(r => r.safety_level === 'safe');
    const cautionRecipes = recipes.filter(r => r.safety_level === 'caution');
    const avoidRecipes = recipes.filter(r => r.safety_level === 'avoid');
    
    const exactMatches = recipes.filter(r => r.match_type === 'exact');
    const nearMatches = recipes.filter(r => r.match_type === 'near');
    const possibleMatches = recipes.filter(r => r.match_type === 'possible');

    res.json({
      total_found: recipes.length,
      user_ingredients: ingredients,
      results: {
        safe_recipes: safeRecipes,
        caution_recipes: cautionRecipes,
        avoid_recipes: avoidRecipes,
        exact_matches: exactMatches,
        near_matches: nearMatches,
        possible_matches: possibleMatches
      },
      dietary_info: {
        safe_count: safeRecipes.length,
        caution_count: cautionRecipes.length,
        avoid_count: avoidRecipes.length,
        message: avoidRecipes.length > 0 ? 
          'Some recipes contain allergens or restricted ingredients' :
          cautionRecipes.length > 0 ?
          'Some recipes may need ingredient substitutions' :
          'All recipes are safe for your dietary preferences'
      },
      usage: recipeService.getSpoonacularUsage()
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({
      error: 'Recipe search failed',
      message: 'Unable to find recipes at this time'
    });
  }
});

// Get recipes based on user's current pantry
router.get('/suggestions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get user's pantry ingredients
    const userIngredients = await IngredientModel.getUserIngredients(req.user.id);
    const ingredients = userIngredients.map(ui => ui.ingredient?.name || '').filter(Boolean);

    if (ingredients.length === 0) {
      res.json({
        message: 'No ingredients in pantry',
        suggestion: 'Add ingredients to your pantry to get recipe suggestions',
        recipes: []
      });
      return;
    }

    // Get recipe suggestions
    const recipes = await recipeService.findRecipes({ ingredients }, req.user.id);

    // Return top suggestions
    const topSuggestions = recipes.slice(0, 10);

    res.json({
      message: `Found ${recipes.length} recipes using your pantry ingredients`,
      pantry_ingredients: ingredients,
      suggestions: topSuggestions,
      usage: recipeService.getSpoonacularUsage()
    });
  } catch (error) {
    console.error('Recipe suggestions error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: 'Unable to generate recipe suggestions'
    });
  }
});

// Search recipes by name/keyword
router.get('/search', [
  query('q').isString().isLength({ min: 2, max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
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

    const { q: query, limit } = req.query;
    
    // For now, use the main ingredient from the search query
    const searchTerms = (query as string).split(' ').filter(term => term.length > 2);
    
    const recipes = await recipeService.findRecipes({
      ingredients: searchTerms
    });

    res.json({
      query: query,
      found: recipes.length,
      recipes: recipes.slice(0, parseInt(limit as string) || 20)
    });
  } catch (error) {
    console.error('Recipe search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Unable to search recipes'
    });
  }
});

// Get recipe usage statistics
router.get('/usage', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const spoonacularUsage = recipeService.getSpoonacularUsage();
    
    res.json({
      spoonacular: spoonacularUsage,
      apis_available: ['spoonacular', 'edamam', 'themealdb'],
      message: spoonacularUsage.remaining < 20 ? 
        'Approaching Spoonacular monthly limit, will use backup APIs' : 
        'All APIs available'
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics'
    });
  }
});

// Test endpoint for recipe API reliability
router.get('/test', async (req: Request, res: Response) => {
  try {
    const testIngredients = ['chicken', 'rice', 'onion'];
    const startTime = Date.now();
    
    const recipes = await recipeService.findRecipes({
      ingredients: testIngredients
    });
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      test_ingredients: testIngredients,
      recipes_found: recipes.length,
      response_time: `${responseTime}ms`,
      sample_recipes: recipes.slice(0, 3).map(r => ({
        title: r.title,
        match_score: r.match_score,
        source: r.source_api,
        missing_ingredients: r.missing_ingredients?.length || 0
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Recipe test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add recipe to favorites
router.post('/:recipeId/favorite', authenticateToken, [
  param('recipeId').isString()
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { recipeId } = req.params;
    
    // Add to user_recipes table
    await db('user_recipes')
      .insert({
        user_id: req.user.id,
        recipe_id: recipeId,
        is_favorite: true
      })
      .onConflict(['user_id', 'recipe_id'])
      .merge({ is_favorite: true, updated_at: new Date() });

    res.json({ message: 'Recipe added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove recipe from favorites
router.delete('/:recipeId/favorite', authenticateToken, [
  param('recipeId').isString()
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { recipeId } = req.params;
    
    await db('user_recipes')
      .where({ user_id: req.user.id, recipe_id: recipeId })
      .update({ is_favorite: false, updated_at: new Date() });

    res.json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Get user's favorite recipes
router.get('/favorites', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const favorites = await db('user_recipes as ur')
      .join('recipes as r', 'ur.recipe_id', 'r.id')
      .where('ur.user_id', req.user.id)
      .where('ur.is_favorite', true)
      .select('r.*', 'ur.rating', 'ur.notes', 'ur.last_cooked_at')
      .orderBy('ur.updated_at', 'desc');

    res.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to get favorites' });
  }
});

// Submit user recipe
router.post('/submit', authenticateToken, [
  body('title').isString().isLength({ min: 1, max: 200 }),
  body('ingredients').isString().isLength({ min: 10 }),
  body('instructions').isString().isLength({ min: 20 }),
  body('servings').isInt({ min: 1, max: 20 }),
  body('difficulty').isIn(['easy', 'medium', 'hard']),
  body('is_lolz_recipe').optional().isBoolean()
], async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: 'Validation failed', details: errors.array() });
      return;
    }

    const {
      title,
      description,
      ingredients,
      instructions,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      difficulty,
      is_lolz_recipe
    } = req.body;

    const totalTime = (parseInt(prep_time_minutes) || 0) + (parseInt(cook_time_minutes) || 0);

    const [recipeId] = await db('recipes')
      .insert({
        title,
        description,
        instructions,
        prep_time_minutes: parseInt(prep_time_minutes) || null,
        cook_time_minutes: parseInt(cook_time_minutes) || null,
        total_time_minutes: totalTime || null,
        servings: parseInt(servings),
        difficulty,
        source_api: 'user',
        is_user_submitted: true,
        is_lolz_recipe: is_lolz_recipe || false,
        moderation_status: 'pending'
      })
      .returning('id');

    // Parse and store ingredients
    const ingredientLines = ingredients.split('\n').filter((line: string) => line.trim());
    // For now, store as simple text - could be enhanced to parse amounts/units

    res.json({
      message: 'Recipe submitted successfully',
      recipe_id: recipeId.id,
      status: 'pending_review'
    });
  } catch (error) {
    console.error('Submit recipe error:', error);
    res.status(500).json({ error: 'Failed to submit recipe' });
  }
});

export default router;