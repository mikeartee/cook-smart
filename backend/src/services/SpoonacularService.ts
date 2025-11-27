/**
 * Spoonacular API Service
 *
 * Implements IRecipeProvider for Spoonacular API
 * Free tier: 150 requests/day
 * Paid tier: $0.002 per request
 *
 * Documentation: https://spoonacular.com/food-api/docs
 */

import axios from 'axios';
import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';

const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';
const API_KEY = process.env.SPOONACULAR_API_KEY;

export class SpoonacularService implements IRecipeProvider {
  /**
   * Search for recipes by ingredients
   */
  async searchByIngredients(
    ingredients: string[],
    limit: number,
  ): Promise<Recipe[]> {
    if (!API_KEY) {
      throw new Error('Spoonacular API key not configured');
    }

    if (ingredients.length === 0) {
      return [];
    }

    try {
      // Use complexSearch for multi-ingredient search
      const ingredientQuery = ingredients.join(',');

      console.log(`🔍 Searching Spoonacular for: "${ingredientQuery}"`);

      const response = await axios.get(
        `${SPOONACULAR_BASE_URL}/recipes/complexSearch`,
        {
          params: {
            apiKey: API_KEY,
            includeIngredients: ingredientQuery,
            number: limit,
            addRecipeInformation: true,
            fillIngredients: true,
            instructionsRequired: true,
            sort: 'max-used-ingredients',
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.results) {
        console.log(
          `✅ Found ${response.data.results.length} recipes from Spoonacular`,
        );
        return response.data.results.map((recipe: any) =>
          this.mapSpoonacularToRecipe(recipe),
        );
      }

      return [];
    } catch (error: any) {
      console.error('Spoonacular search error:', error.message);
      throw new Error(`Spoonacular search failed: ${error.message}`);
    }
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    if (!API_KEY) {
      throw new Error('Spoonacular API key not configured');
    }

    try {
      const response = await axios.get(
        `${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information`,
        {
          params: {
            apiKey: API_KEY,
            includeNutrition: true,
          },
          timeout: 10000,
        },
      );

      if (!response.data) {
        throw new Error('Recipe not found');
      }

      return this.mapSpoonacularToRecipe(response.data);
    } catch (error: any) {
      console.error('Spoonacular recipe details error:', error.message);
      throw new Error(`Failed to fetch recipe details: ${error.message}`);
    }
  }

  /**
   * Check if Spoonacular is available
   */
  async isAvailable(): Promise<boolean> {
    return !!API_KEY;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Spoonacular';
  }

  /**
   * Map Spoonacular recipe to unified Recipe model
   */
  private mapSpoonacularToRecipe(recipe: any): RecipeDetails {
    // Extract ingredient list
    const ingredients: string[] = [];
    if (recipe.extendedIngredients) {
      recipe.extendedIngredients.forEach((ing: any) => {
        ingredients.push(ing.original || ing.name);
      });
    }

    // Extract instructions
    let instructions = '';
    if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
      const steps = recipe.analyzedInstructions[0].steps || [];
      instructions = steps
        .map((step: any) => `${step.number}. ${step.step}`)
        .join('\n');
    } else if (recipe.instructions) {
      instructions = recipe.instructions;
    }

    // Extract nutrition
    let nutrition;
    if (recipe.nutrition && recipe.nutrition.nutrients) {
      const nutrients = recipe.nutrition.nutrients;
      nutrition = {
        calories: this.findNutrient(nutrients, 'Calories'),
        protein: this.findNutrient(nutrients, 'Protein'),
        carbs: this.findNutrient(nutrients, 'Carbohydrates'),
        fat: this.findNutrient(nutrients, 'Fat'),
      };
    }

    const result: RecipeDetails = {
      id: recipe.id.toString(),
      title: recipe.title || 'Untitled Recipe',
      image: recipe.image || '',
      servings: recipe.servings || 4,
      readyInMinutes: recipe.readyInMinutes || 30,
      sourceUrl: recipe.sourceUrl || recipe.spoonacularSourceUrl || '',
      summary: recipe.summary || '',
      ingredients,
      instructions: instructions || 'No instructions available.',
      cuisines: recipe.cuisines || [],
      dishTypes: recipe.dishTypes || [],
      diets: recipe.diets || [],
      provider: 'spoonacular',
      extendedIngredients: recipe.extendedIngredients,
      analyzedInstructions: recipe.analyzedInstructions,
    };

    if (nutrition) {
      result.nutrition = nutrition;
    }

    return result;
  }

  /**
   * Find nutrient value by name
   */
  private findNutrient(nutrients: any[], name: string): number {
    const nutrient = nutrients.find(
      (n: any) => n.name.toLowerCase() === name.toLowerCase(),
    );
    return nutrient ? nutrient.amount : 0;
  }
}

export default new SpoonacularService();
