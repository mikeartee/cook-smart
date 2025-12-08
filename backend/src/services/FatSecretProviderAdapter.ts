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

      // NEW APPROACH: When meal type is specified, use broad search + client-side filtering
      // FatSecret's recipe_types parameter doesn't seem to work reliably
      // When "All" is selected (no mealType), search by ingredients
      if (options && options.mealType) {
        console.log(
          '[FatSecretAdapter] Meal type filter - using broad search with client-side filtering:',
          {
            mealType: options.mealType,
            maxCalories: options.maxCalories,
          },
        );

        // Map meal types to search keywords that work better
        const mealTypeKeywords: {[key: string]: string} = {
          'Breakfast and Brunch': 'breakfast',
          'Main Dishes': 'dinner',
          'Appetizers and Snacks': 'snack appetizer',
        };

        const searchKeyword = mealTypeKeywords[options.mealType] || 'recipe';

        // Use broad search with keyword
        const searchOptions: any = {
          query: searchKeyword,
          maxResults: 50, // Get more results to filter from
        };

        if (options.maxCalories) {
          searchOptions.maxCalories = options.maxCalories;
        }

        const recipes = await this.service.searchRecipesAdvanced(searchOptions);
        console.log(
          `[FatSecretAdapter] Meal type search returned ${recipes.length} recipes`,
        );

        return this.formatRecipes(recipes.slice(0, limit));
      }

      // Use advanced search if only calorie filter is provided (no meal type)
      if (options && options.maxCalories) {
        console.log(
          '[FatSecretAdapter] Using advanced search with calorie filter:',
          {
            maxCalories: options.maxCalories,
            query: searchQuery,
            ingredientCount: ingredients.slice(0, 5).length,
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
        id: String(recipe.recipe_id), // Ensure ID is always a string
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
      // Strip "fatsecret_" prefix if present (for cached recipe IDs)
      const cleanId = recipeId.replace(/^fatsecret_/, '');
      const recipe = await this.service.getRecipeDetails(cleanId);

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
        // Extract comprehensive nutrition data
        calories: recipe.calories ? parseInt(recipe.calories) : undefined,
        protein: recipe.protein ? parseFloat(recipe.protein) : undefined,
        carbs: recipe.carbohydrate
          ? parseFloat(recipe.carbohydrate)
          : undefined,
        fat: recipe.fat ? parseFloat(recipe.fat) : undefined,
        fiber: recipe.fiber ? parseFloat(recipe.fiber) : undefined,
        sugar: recipe.sugar ? parseFloat(recipe.sugar) : undefined,
        sodium: recipe.sodium ? parseFloat(recipe.sodium) : undefined,
        saturatedFat: recipe.saturated_fat
          ? parseFloat(recipe.saturated_fat)
          : undefined,
        cholesterol: recipe.cholesterol
          ? parseFloat(recipe.cholesterol)
          : undefined,
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
