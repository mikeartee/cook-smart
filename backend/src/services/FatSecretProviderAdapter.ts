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
      // FatSecret doesn't have direct ingredient search, so we search by ingredient names
      const searchQuery = ingredients.join(' ');

      // Use advanced search if filters are provided
      if (options && (options.maxCalories || options.mealType)) {
        const searchOptions: any = {
          query: searchQuery,
          maxResults: limit,
        };

        if (options.maxCalories) {
          searchOptions.maxCalories = options.maxCalories;
        }

        if (options.mealType) {
          searchOptions.recipeTypes = options.mealType;
        }

        const recipes = await this.service.searchRecipesAdvanced(searchOptions);
        return this.formatRecipes(recipes);
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
