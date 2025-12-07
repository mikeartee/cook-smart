/**
 * FatSecret Provider Adapter
 *
 * Adapts FatSecretService to implement IRecipeProvider interface
 * Allows FatSecret to be used as primary provider in RecipeProviderService
 */

import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';
import FatSecretService from './FatSecretService';

class FatSecretProviderAdapter implements IRecipeProvider {
  private service = FatSecretService;

  async searchByIngredients(
    ingredients: string[],
    limit: number = 10,
    options?: {maxCalories?: number; mealType?: string},
  ): Promise<Recipe[]> {
    try {
      // When using filters, use only the first 3-5 main ingredients for better results
      // FatSecret's advanced search is very strict with recipe_types filter
      const searchQuery =
        options && (options.maxCalories || options.mealType)
          ? ingredients.slice(0, 5).join(' ')
          : ingredients.join(' ');

      // Use advanced search if calorie filter is provided
      // NOTE: FatSecret's recipe_types filter is too restrictive and returns 0 results
      // For now, we only support calorie filtering. Meal type filtering disabled.
      if (options && options.maxCalories) {
        console.log(
          '[FatSecretAdapter] Using advanced search with calorie filter:',
          {
            maxCalories: options.maxCalories,
            query: searchQuery,
            ingredientCount: ingredients.slice(0, 5).length,
            note: 'Meal type filter disabled - FatSecret recipe_types too restrictive',
          },
        );

        const searchOptions: any = {
          query: searchQuery,
          maxResults: limit,
          maxCalories: options.maxCalories,
        };

        const recipes = await this.service.searchRecipesAdvanced(searchOptions);
        console.log(
          `[FatSecretAdapter] Advanced search returned ${recipes.length} recipes`,
        );

        return this.formatRecipes(recipes);
      }

      // If only meal type filter (no calories), ignore it and do standard search
      // FatSecret's recipe_types parameter is too restrictive
      if (options && options.mealType && !options.maxCalories) {
        console.log(
          '[FatSecretAdapter] Meal type filter requested but not supported - doing standard search',
        );
        console.log(
          '[FatSecretAdapter] Note: FatSecret recipe_types filter returns 0 results, disabled for now',
        );
      }

      // Standard search without filters
      const recipes = await this.service.searchRecipes(searchQuery, limit);

      return this.formatRecipes(recipes);
    } catch (error) {
      console.error('[FatSecretAdapter] Search error:', error);
      return [];
    }
  }

  private formatRecipes(recipes: any[]): Recipe[] {
    return recipes.map(
      (recipe: any): Recipe => ({
        id: recipe.recipe_id,
        title: recipe.recipe_name,
        image: recipe.recipe_image || '',
        servings: parseInt(recipe.number_of_servings) || 4,
        readyInMinutes: parseInt(recipe.cooking_time_min) || 30,
        sourceUrl: `https://www.fatsecret.com/recipes/${recipe.recipe_id}`,
        summary: recipe.recipe_description || '',
        ingredients: [] as string[],
        instructions: '',
        cuisines: [] as string[],
        dishTypes: [recipe.recipe_types || 'main course'],
        diets: [] as string[],
        provider: 'fatsecret',
        // Add nutrition info for display
        calories: recipe.calories ? parseInt(recipe.calories) : undefined,
        protein: recipe.protein ? parseFloat(recipe.protein) : undefined,
        carbs: recipe.carbohydrate
          ? parseFloat(recipe.carbohydrate)
          : undefined,
        fat: recipe.fat ? parseFloat(recipe.fat) : undefined,
      }),
    );
  }

  async getRecipeDetails(recipeId: string): Promise<RecipeDetails | null> {
    try {
      const recipe = await this.service.getRecipeDetails(recipeId);

      if (!recipe) {
        return null;
      }

      // Parse ingredients as strings
      const ingredients: string[] = [];
      if (recipe.ingredients?.ingredient) {
        const ingredientList = Array.isArray(recipe.ingredients.ingredient)
          ? recipe.ingredients.ingredient
          : [recipe.ingredients.ingredient];

        for (const ing of ingredientList) {
          const description = ing.ingredient_description || ing.food_name || '';
          const amount = ing.number_of_units || '';
          const unit = ing.measurement_description || '';
          ingredients.push(`${amount} ${unit} ${description}`.trim());
        }
      }

      // Parse instructions
      let instructions = '';
      if (recipe.directions?.direction) {
        const directionList = Array.isArray(recipe.directions.direction)
          ? recipe.directions.direction
          : [recipe.directions.direction];

        instructions = directionList
          .map(
            (d: any, index: number) =>
              `${index + 1}. ${d.direction_description || d}`,
          )
          .join('\n');
      }

      return {
        id: recipe.recipe_id,
        title: recipe.recipe_name,
        image: recipe.recipe_image || '',
        servings: parseInt(recipe.number_of_servings) || 4,
        readyInMinutes: parseInt(recipe.cooking_time_min) || 30,
        sourceUrl: `https://www.fatsecret.com/recipes/${recipe.recipe_id}`,
        summary: recipe.recipe_description || '',
        instructions,
        ingredients,
        cuisines: [],
        dishTypes: [recipe.recipe_types || 'main course'],
        diets: [],
        provider: 'fatsecret',
      };
    } catch (error) {
      console.error('[FatSecretAdapter] Get details error:', error);
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple search to verify API is working
      const recipes = await this.service.searchRecipes('chicken', 1);
      return recipes.length > 0;
    } catch (error) {
      console.error('[FatSecretAdapter] Availability check failed:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'FatSecret';
  }
}

export default new FatSecretProviderAdapter();
