import express from 'express';
import {RecipeSearchService} from '../services/RecipeSearchService';
import {RecipeFilterService} from '../services/RecipeFilterService';

const router = express.Router();

// Search recipes
router.get('/recipes', async (req, res) => {
  try {
    const {
      q: query = '',
      page = '1',
      pageSize = '20',
      ingredients,
      cuisine,
      mealType,
      cookingTime,
      difficulty,
      servings,
    } = req.query;

    const filters: any = {
      ...(ingredients && {
        ingredients: (ingredients as string).split(',').map(i => i.trim()),
      }),
      ...(cuisine && {cuisine: cuisine as string}),
      ...(mealType && {mealType: mealType as string}),
      ...(cookingTime && {cookingTime: parseInt(cookingTime as string)}),
      ...(difficulty && {difficulty: difficulty as string}),
      ...(servings && {servings: parseInt(servings as string)}),
    };

    const result = await RecipeSearchService.searchRecipes(
      query as string,
      filters,
      parseInt(page as string),
      parseInt(pageSize as string),
    );

    return res.json(result);
  } catch (_error) {
    return res.status(500).json({error: 'Failed to search recipes'});
  }
});

// Get recipe by ID
router.get('/recipes/:id', async (req, res) => {
  try {
    const {id} = req.params;
    const recipe = await RecipeSearchService.getRecipeById(id);

    if (!recipe) {
      return res.status(404).json({error: 'Recipe not found'});
    }

    return res.json(recipe);
  } catch (_error) {
    return res.status(500).json({error: 'Failed to get recipe'});
  }
});

// Search recipes with dietary analysis
router.get('/recipes/filtered/:userId', async (req, res) => {
  try {
    const {userId} = req.params;
    const {
      q: query = '',
      page = '1',
      pageSize = '20',
      ingredients,
      cuisine,
      mealType,
      cookingTime,
      difficulty,
      servings,
    } = req.query;

    const filters: any = {
      ...(ingredients && {
        ingredients: (ingredients as string).split(',').map(i => i.trim()),
      }),
      ...(cuisine && {cuisine: cuisine as string}),
      ...(mealType && {mealType: mealType as string}),
      ...(cookingTime && {cookingTime: parseInt(cookingTime as string)}),
      ...(difficulty && {difficulty: difficulty as string}),
      ...(servings && {servings: parseInt(servings as string)}),
    };

    // Get search results
    const searchResult = await RecipeSearchService.searchRecipes(
      query as string,
      filters,
      parseInt(page as string),
      parseInt(pageSize as string),
    );

    // Analyze each recipe for dietary conflicts
    const recipesWithAnalysis = await Promise.all(
      searchResult.recipes.map(async recipe => {
        const analysis = await RecipeFilterService.analyzeRecipe(
          userId,
          recipe.ingredients,
        );
        return {
          ...recipe,
          isCompatible: analysis.isCompatible,
          conflicts: analysis.conflicts,
          conflictCount: analysis.conflicts.length,
        };
      }),
    );

    return res.json({
      ...searchResult,
      recipes: recipesWithAnalysis,
    });
  } catch (_error) {
    return res.status(500).json({error: 'Failed to search and filter recipes'});
  }
});

export default router;
