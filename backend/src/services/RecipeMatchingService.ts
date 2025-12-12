/**
 * Recipe Matching Service
 *
 * Calculates how well recipes match user's available ingredients
 * Adds matchPercentage, usedIngredients, missedIngredients to recipes
 */

import {Recipe} from '../interfaces/IRecipeProvider';
import {ComprehensiveIngredientStandardizer} from './ComprehensiveIngredientStandardizer';

export interface MatchingData {
  matchPercentage: number;
  usedIngredientCount: number;
  usedIngredients: string[];
  missedIngredients: string[];
  totalIngredients: number;
}

export interface RecipeWithMatching extends Recipe {
  matchPercentage: number;
  usedIngredientCount: number;
  usedIngredients: string[];
  missedIngredients: string[];
}

export class RecipeMatchingService {
  /**
   * Add ingredient matching data to recipes
   */
  static async formatRecipesWithMatching(
    recipes: Recipe[],
    userIngredients: string[],
  ): Promise<RecipeWithMatching[]> {
    console.log(
      `[RecipeMatching] Processing ${recipes.length} recipes with ${userIngredients.length} user ingredients`,
    );

    if (userIngredients.length === 0) {
      console.log(
        '[RecipeMatching] No user ingredients provided, returning recipes with 0% match',
      );
      return recipes.map(recipe => ({
        ...recipe,
        matchPercentage: 0,
        usedIngredientCount: 0,
        usedIngredients: [],
        missedIngredients: [],
      }));
    }

    // Standardize user ingredients for better matching
    const standardizedUserIngredients = await Promise.all(
      userIngredients.map(ingredient =>
        ComprehensiveIngredientStandardizer.getStandardizedNameForMatching(
          ingredient,
        ),
      ),
    );

    console.log(
      `[RecipeMatching] Standardized user ingredients: ${standardizedUserIngredients.slice(0, 3).join(', ')}...`,
    );

    const recipesWithMatching: RecipeWithMatching[] = [];

    for (const recipe of recipes) {
      try {
        const matchingData = await this.calculateRecipeMatch(
          recipe,
          standardizedUserIngredients,
        );

        recipesWithMatching.push({
          ...recipe,
          ...matchingData,
        });

        console.log(
          `[RecipeMatching] "${recipe.title}": ${matchingData.matchPercentage}% match (${matchingData.usedIngredientCount}/${matchingData.totalIngredients} ingredients)`,
        );
      } catch (error) {
        console.error(
          `[RecipeMatching] Error processing recipe "${recipe.title}":`,
          error,
        );

        // Add recipe with 0% match if processing fails
        recipesWithMatching.push({
          ...recipe,
          matchPercentage: 0,
          usedIngredientCount: 0,
          usedIngredients: [],
          missedIngredients: [],
        });
      }
    }

    console.log(
      `[RecipeMatching] Completed processing ${recipesWithMatching.length} recipes`,
    );
    return recipesWithMatching;
  }

  /**
   * Calculate matching data for a single recipe
   */
  private static async calculateRecipeMatch(
    recipe: Recipe,
    userIngredients: string[],
  ): Promise<MatchingData> {
    // For FatSecret recipes, we need to extract ingredients from the recipe
    // Since FatSecret search results don't include ingredients, we'll use a simplified approach

    // Extract potential ingredients from recipe title and summary
    const recipeText = `${recipe.title} ${recipe.summary || ''}`.toLowerCase();

    // Common ingredients that might appear in recipe titles/descriptions
    const commonIngredients = [
      'chicken',
      'beef',
      'pork',
      'fish',
      'salmon',
      'shrimp',
      'turkey',
      'rice',
      'pasta',
      'noodles',
      'bread',
      'flour',
      'quinoa',
      'onion',
      'garlic',
      'tomato',
      'potato',
      'carrot',
      'celery',
      'pepper',
      'cheese',
      'milk',
      'cream',
      'butter',
      'egg',
      'yogurt',
      'oil',
      'olive',
      'salt',
      'pepper',
      'herbs',
      'spices',
      'mushroom',
      'spinach',
      'broccoli',
      'corn',
      'beans',
      'lentils',
      'apple',
      'banana',
      'lemon',
      'lime',
      'orange',
      'honey',
      'sugar',
      'vanilla',
      'chocolate',
    ];

    // Find ingredients mentioned in the recipe
    const detectedIngredients: string[] = [];
    for (const ingredient of commonIngredients) {
      if (recipeText.includes(ingredient)) {
        detectedIngredients.push(ingredient);
      }
    }

    // If no ingredients detected, assume a reasonable number based on recipe complexity
    if (detectedIngredients.length === 0) {
      // Estimate ingredients based on recipe title complexity
      const titleWords = recipe.title.split(' ').length;
      const estimatedIngredients = Math.max(3, Math.min(8, titleWords - 1));

      return {
        matchPercentage: 25, // Default reasonable match for unknown ingredients
        usedIngredientCount: 1,
        usedIngredients: userIngredients.slice(0, 1),
        missedIngredients: [`${estimatedIngredients - 1} other ingredients`],
        totalIngredients: estimatedIngredients,
      };
    }

    // Calculate matches between detected ingredients and user ingredients
    const usedIngredients: string[] = [];
    const missedIngredients: string[] = [];

    for (const detectedIngredient of detectedIngredients) {
      const isAvailable = userIngredients.some(userIngredient =>
        this.ingredientsMatch(userIngredient, detectedIngredient),
      );

      if (isAvailable) {
        usedIngredients.push(detectedIngredient);
      } else {
        missedIngredients.push(detectedIngredient);
      }
    }

    const totalIngredients = detectedIngredients.length;
    const matchPercentage =
      totalIngredients > 0
        ? Math.round((usedIngredients.length / totalIngredients) * 100)
        : 0;

    return {
      matchPercentage,
      usedIngredientCount: usedIngredients.length,
      usedIngredients,
      missedIngredients,
      totalIngredients,
    };
  }

  /**
   * Check if two ingredients match (fuzzy matching)
   */
  private static ingredientsMatch(
    userIngredient: string,
    recipeIngredient: string,
  ): boolean {
    const user = userIngredient.toLowerCase().trim();
    const recipe = recipeIngredient.toLowerCase().trim();

    // Exact match
    if (user === recipe) return true;

    // One contains the other
    if (user.includes(recipe) || recipe.includes(user)) return true;

    // Common variations
    const variations: {[key: string]: string[]} = {
      chicken: ['poultry', 'fowl'],
      beef: ['steak', 'ground beef', 'hamburger'],
      pork: ['ham', 'bacon', 'sausage'],
      tomato: ['tomatoes'],
      onion: ['onions'],
      potato: ['potatoes'],
      cheese: ['cheddar', 'mozzarella', 'parmesan'],
    };

    for (const [base, alts] of Object.entries(variations)) {
      if (
        (user.includes(base) && alts.some(alt => recipe.includes(alt))) ||
        (recipe.includes(base) && alts.some(alt => user.includes(alt)))
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get user ingredients from database for matching
   */
  static async getUserIngredientsForMatching(
    userId: string,
  ): Promise<string[]> {
    const pool = require('../config/database').default;

    try {
      const result = await pool.query(
        `SELECT DISTINCT ingredient_name, name 
         FROM user_ingredients 
         WHERE user_id = $1 
         ORDER BY added_at DESC 
         LIMIT 50`,
        [userId],
      );

      const rawIngredients = result.rows
        .map((row: any) => row.ingredient_name || row.name)
        .filter((name: string) => name && name.length > 0);

      // Standardize ingredients for better matching
      const standardizedIngredients = await Promise.all(
        rawIngredients.map((name: string) =>
          ComprehensiveIngredientStandardizer.getStandardizedNameForMatching(
            name,
          ),
        ),
      );

      return standardizedIngredients.filter(
        (name: string) => name && name.length > 2,
      );
    } catch (error) {
      console.error('[RecipeMatching] Error getting user ingredients:', error);
      return [];
    }
  }
}
