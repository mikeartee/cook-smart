/**
 * FatSecret Provider Adapter - SIMPLIFIED
 *
 * Simple adapter that uses FatSecret's ingredient filtering.
 * No complex matching calculations - FatSecret does the work for us.
 */

import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';
import FatSecretService from './FatSecretService';

class FatSecretProviderAdapter implements IRecipeProvider {
  private service = FatSecretService;

  private getValidImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return '';
    }

    try {
      new URL(imageUrl);
      return imageUrl;
    } catch {
      console.log('[FatSecretAdapter] Invalid image URL:', imageUrl);
      return '';
    }
  }

  async searchByIngredients(
    ingredients: string[],
    limit: number = 10,
    options?: {maxCalories?: number; mealType?: string},
  ): Promise<Recipe[]> {
    try {
      console.log('[FatSecretAdapter] Searching by ingredients:', {
        ingredients: ingredients.slice(0, 5),
        limit,
        options,
      });

      // When meal type is specified, use broad search
      if (options && options.mealType) {
        const mealTypeKeywords: {[key: string]: string} = {
          'Breakfast and Brunch': 'breakfast',
          'Main Dishes': 'dinner',
          'Appetizers and Snacks': 'snack appetizer',
        };

        const searchKeyword = mealTypeKeywords[options.mealType] || 'recipe';
        const searchOptions: any = {
          query: searchKeyword,
          maxResults: limit,
        };

        if (options.maxCalories) {
          searchOptions.maxCalories = options.maxCalories;
        }

        const recipes = await this.service.searchRecipesAdvanced(searchOptions);
        return this.formatRecipes(recipes.slice(0, limit));
      }

      // For ingredient-based search, let FatSecret do the filtering
      const searchIngredients = ingredients.slice(0, 6).join(',');
      const searchOptions: any = {
        mustIncludeIngredients: searchIngredients,
        maxResults: limit,
      };

      if (options?.maxCalories) {
        searchOptions.maxCalories = options.maxCalories;
      }

      console.log(
        '[FatSecretAdapter] Using FatSecret ingredient search:',
        searchIngredients,
      );

      const recipes = await this.service.searchRecipesAdvanced(searchOptions);
      console.log(
        `[FatSecretAdapter] FatSecret returned ${recipes.length} recipes`,
      );

      if (recipes.length === 0) {
        // Try with fewer ingredients if no results
        const fallbackOptions: any = {
          mustIncludeIngredients: ingredients.slice(0, 3).join(','),
          maxResults: limit,
        };
        if (options?.maxCalories) {
          fallbackOptions.maxCalories = options.maxCalories;
        }

        const fallbackRecipes =
          await this.service.searchRecipesAdvanced(fallbackOptions);
        console.log(
          `[FatSecretAdapter] Fallback search returned ${fallbackRecipes.length} recipes`,
        );
        return this.formatRecipes(fallbackRecipes.slice(0, limit));
      }

      return this.formatRecipes(recipes.slice(0, limit));
    } catch (error: any) {
      console.error('[FatSecretAdapter] Search error:', error);
      return [];
    }
  }

  private formatRecipes(recipes: any[]): Recipe[] {
    console.log(`[FatSecretAdapter] Formatting ${recipes.length} recipes`);

    return recipes.map(
      (recipe: any): Recipe => ({
        id: recipe.recipe_id,
        title: recipe.recipe_name,
        image: this.getValidImageUrl(recipe.recipe_image),
        servings: parseInt(recipe.number_of_servings) || 4,
        readyInMinutes: parseInt(recipe.cooking_time_min) || 30,
        sourceUrl: `https://www.fatsecret.com/recipes/${recipe.recipe_id}`,
        summary: recipe.recipe_description || '',
        ingredients: [],
        instructions: '',
        cuisines: [],
        dishTypes: [recipe.recipe_types || 'main course'],
        diets: [],
        provider: 'fatsecret',
        // Add FatSecret nutrition data
        calories: recipe.calories ? parseInt(recipe.calories) : undefined,
        protein: recipe.protein ? parseFloat(recipe.protein) : undefined,
        carbs: recipe.carbohydrate
          ? parseFloat(recipe.carbohydrate)
          : undefined,
        fat: recipe.fat ? parseFloat(recipe.fat) : undefined,
        likes: 0,
      }),
    );
  }

  async getRecipeDetails(recipeId: string): Promise<RecipeDetails | null> {
    try {
      const cleanId = recipeId.replace(/^fatsecret_/, '');
      console.log('[FatSecretAdapter] Getting recipe details:', cleanId);

      const recipe = await this.service.getRecipeDetails(cleanId);

      if (!recipe) {
        console.log('[FatSecretAdapter] No recipe returned from FatSecret');
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
        image: this.getValidImageUrl(recipe.recipe_image),
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
