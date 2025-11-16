/**
 * TheMealDB API Service
 * 
 * Implements IRecipeProvider for TheMealDB API
 * Free tier: UNLIMITED calls (completely free)
 * No API key required for basic tier
 * 
 * Documentation: https://www.themealdb.com/api.php
 * 
 * Note: TheMealDB only supports single ingredient searches,
 * so we search with the first ingredient and filter results
 */

import axios from 'axios';
import { IRecipeProvider, Recipe, RecipeDetails } from '../interfaces/IRecipeProvider';

const THEMEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export class TheMealDBService implements IRecipeProvider {
  /**
   * Search for recipes by ingredients
   * Note: TheMealDB only supports single ingredient search
   */
  async searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]> {
    if (ingredients.length === 0) {
      return [];
    }

    // Use the first ingredient for search
    const mainIngredient = ingredients[0];

    try {
      const response = await axios.get(`${THEMEALDB_BASE_URL}/filter.php`, {
        params: { i: mainIngredient },
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || !response.data.meals) {
        return [];
      }

      // Get details for each meal (up to limit)
      const meals = response.data.meals.slice(0, limit);
      const detailedRecipes = await Promise.all(
        meals.map((meal: any) => this.getRecipeDetails(meal.idMeal))
      );

      return detailedRecipes;
    } catch (error: any) {
      console.error('TheMealDB API error:', error.message);
      throw new Error(`TheMealDB API request failed: ${error.message}`);
    }
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    try {
      const response = await axios.get(`${THEMEALDB_BASE_URL}/lookup.php`, {
        params: { i: recipeId },
        timeout: 10000,
      });

      if (!response.data || !response.data.meals || response.data.meals.length === 0) {
        throw new Error('Recipe not found');
      }

      const meal = response.data.meals[0];
      return this.mapMealDBToRecipe(meal);
    } catch (error: any) {
      console.error('TheMealDB recipe details error:', error.message);
      throw new Error(`Failed to fetch recipe details: ${error.message}`);
    }
  }

  /**
   * Check if TheMealDB is available
   * Always returns true since it's unlimited and free
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'TheMealDB';
  }

  /**
   * Map TheMealDB meal object to our unified Recipe model
   */
  private mapMealDBToRecipe(meal: any): RecipeDetails {
    // Extract ingredients from meal object (strIngredient1-20)
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      
      if (ingredient && ingredient.trim()) {
        const ingredientLine = measure && measure.trim() 
          ? `${measure.trim()} ${ingredient.trim()}`
          : ingredient.trim();
        ingredients.push(ingredientLine);
      }
    }

    // Parse tags if available
    const tags = meal.strTags ? meal.strTags.split(',').map((t: string) => t.trim()) : [];

    return {
      id: meal.idMeal,
      title: meal.strMeal || 'Untitled Recipe',
      image: meal.strMealThumb || '',
      servings: 4, // TheMealDB doesn't provide servings, use default
      readyInMinutes: 30, // TheMealDB doesn't provide time, use default
      sourceUrl: meal.strSource || meal.strYoutube || '',
      summary: `${meal.strCategory || 'Unknown category'} from ${meal.strArea || 'Unknown region'}`,
      ingredients,
      instructions: meal.strInstructions || 'No instructions available.',
      cuisines: meal.strArea ? [meal.strArea] : [],
      dishTypes: meal.strCategory ? [meal.strCategory] : [],
      diets: tags.filter((tag: string) => 
        ['vegetarian', 'vegan', 'gluten free', 'dairy free'].includes(tag.toLowerCase())
      ),
      provider: 'themealdb',
    };
  }
}

export default new TheMealDBService();
