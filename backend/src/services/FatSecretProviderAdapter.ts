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

  private getValidImageUrl(imageUrl: string | undefined): string {
    // Return empty string if no image URL provided
    if (!imageUrl || imageUrl.trim() === '') {
      return '';
    }

    // Check if it's a valid URL format
    try {
      new URL(imageUrl);
      return imageUrl;
    } catch {
      // If invalid URL, return empty string
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
        ingredients,
        limit,
        options,
      });

      // FIXED: Always use ingredient-based search for Recipe tab
      // This ensures recipes actually match user's inventory

      // When meal type is specified, use broad search (for meal-specific tabs)
      if (options && options.mealType) {
        console.log(
          '[FatSecretAdapter] Meal type filter - using broad search:',
          {
            mealType: options.mealType,
            maxCalories: options.maxCalories,
          },
        );

        // Map meal types to search keywords
        const mealTypeKeywords: {[key: string]: string} = {
          'Breakfast and Brunch': 'breakfast',
          'Main Dishes': 'dinner',
          'Appetizers and Snacks': 'snack appetizer',
        };

        const searchKeyword = mealTypeKeywords[options.mealType] || 'recipe';

        const searchOptions: any = {
          query: searchKeyword,
          maxResults: Math.min(50, limit * 3), // Get more results to filter from
        };

        if (options.maxCalories) {
          searchOptions.maxCalories = options.maxCalories;
        }

        const recipes = await this.service.searchRecipesAdvanced(searchOptions);
        console.log(
          `[FatSecretAdapter] Meal type search returned ${recipes.length} recipes`,
        );

        return this.formatRecipesWithMatching(
          recipes.slice(0, limit),
          ingredients,
        );
      }

      // CORE FIX: For Recipe tab (no meal type), use ingredient matching
      console.log(
        '[FatSecretAdapter] Using ingredient-based search for Recipe tab:',
        {
          ingredients: ingredients.slice(0, 8), // Use up to 8 ingredients
          maxCalories: options?.maxCalories,
        },
      );

      // Use FatSecret's must_include_ingredient_names for proper matching
      const searchOptions: any = {
        mustIncludeIngredients: ingredients.slice(0, 8).join(','), // Limit to 8 ingredients
        maxResults: Math.min(50, limit * 2), // Get more results for better matching
      };

      if (options?.maxCalories) {
        searchOptions.maxCalories = options.maxCalories;
      }

      const recipes = await this.service.searchRecipesAdvanced(searchOptions);
      console.log(
        `[FatSecretAdapter] Ingredient search returned ${recipes.length} recipes`,
      );

      // Format recipes with ingredient matching data
      const formattedRecipes = this.formatRecipesWithMatching(
        recipes,
        ingredients,
      );

      // Sort by ingredient match percentage (highest first)
      const sortedRecipes = formattedRecipes.sort((a, b) => {
        const aMatch = (a as any).usedIngredientCount || 0;
        const bMatch = (b as any).usedIngredientCount || 0;
        return bMatch - aMatch;
      });

      // Return top results
      return sortedRecipes.slice(0, limit);
    } catch (error: any) {
      console.error('[FatSecretAdapter] Search error:', error);

      // Check for IP blocking error
      if (error.response?.data?.error?.code === 21) {
        console.error(
          '[FatSecretAdapter] IP BLOCKED by FatSecret:',
          error.response.data.error.message,
        );
      }

      return [];
    }
  }

  private formatRecipes(recipes: any[]): Recipe[] {
    return recipes.map(
      (recipe: any): Recipe => ({
        id: recipe.recipe_id, // Keep as-is from FatSecret API
        title: recipe.recipe_name,
        image: this.getValidImageUrl(recipe.recipe_image),
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

  private formatRecipesWithMatching(
    recipes: any[],
    userIngredients: string[],
  ): Recipe[] {
    return recipes.map((recipe: any): Recipe => {
      // Calculate ingredient matching
      const matchingData = this.calculateIngredientMatching(
        recipe,
        userIngredients,
      );

      return {
        id: recipe.recipe_id,
        title: recipe.recipe_name,
        image: this.getValidImageUrl(recipe.recipe_image),
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
        // Add nutrition info
        calories: recipe.calories ? parseInt(recipe.calories) : undefined,
        protein: recipe.protein ? parseFloat(recipe.protein) : undefined,
        carbs: recipe.carbohydrate
          ? parseFloat(recipe.carbohydrate)
          : undefined,
        fat: recipe.fat ? parseFloat(recipe.fat) : undefined,
        // Add ingredient matching data
        usedIngredientCount: matchingData.usedCount,
        missedIngredientCount: matchingData.missedCount,
        usedIngredients: matchingData.usedIngredients,
        missedIngredients: matchingData.missedIngredients,
        likes: 0, // FatSecret doesn't provide likes
      };
    });
  }

  private calculateIngredientMatching(
    recipe: any,
    userIngredients: string[],
  ): {
    usedCount: number;
    missedCount: number;
    usedIngredients: any[];
    missedIngredients: any[];
  } {
    // Normalize user ingredients for matching
    const normalizedUserIngredients = userIngredients.map(ing =>
      ing.toLowerCase().trim(),
    );

    // Extract recipe ingredients from title and description
    // FatSecret search results don't include full ingredient lists
    const recipeText =
      `${recipe.recipe_name} ${recipe.recipe_description || ''}`.toLowerCase();

    const usedIngredients: any[] = [];
    const missedIngredients: any[] = [];

    // Check which user ingredients are mentioned in the recipe
    normalizedUserIngredients.forEach((userIng, index) => {
      const isUsed = this.isIngredientMentioned(userIng, recipeText);

      const ingredientObj = {
        id: index,
        name: userIngredients[index], // Original case
        amount: 1,
        unit: '',
        image: '',
      };

      if (isUsed) {
        usedIngredients.push(ingredientObj);
      } else {
        missedIngredients.push(ingredientObj);
      }
    });

    return {
      usedCount: usedIngredients.length,
      missedCount: missedIngredients.length,
      usedIngredients,
      missedIngredients,
    };
  }

  private isIngredientMentioned(
    ingredient: string,
    recipeText: string,
  ): boolean {
    // Handle common ingredient variations and plurals
    const variations = this.getIngredientVariations(ingredient);

    return variations.some(variation =>
      recipeText.includes(variation.toLowerCase()),
    );
  }

  private getIngredientVariations(ingredient: string): string[] {
    const base = ingredient.toLowerCase().trim();
    const variations = [base];

    // Add plural/singular variations
    if (base.endsWith('s') && base.length > 3) {
      variations.push(base.slice(0, -1)); // Remove 's'
    } else {
      variations.push(base + 's'); // Add 's'
    }

    // Add common variations
    const commonVariations: {[key: string]: string[]} = {
      chicken: ['chicken breast', 'chicken thigh', 'poultry'],
      beef: ['ground beef', 'beef steak', 'steak'],
      pork: ['pork chop', 'pork loin'],
      fish: ['salmon', 'tuna', 'cod', 'tilapia'],
      cheese: ['cheddar', 'mozzarella', 'parmesan'],
      onion: ['onions', 'yellow onion', 'white onion'],
      tomato: ['tomatoes', 'cherry tomato', 'roma tomato'],
      pepper: ['bell pepper', 'peppers'],
      mushroom: ['mushrooms', 'button mushroom'],
    };

    if (commonVariations[base]) {
      variations.push(...commonVariations[base]);
    }

    return variations;
  }

  async getRecipeDetails(recipeId: string): Promise<RecipeDetails | null> {
    try {
      // Strip "fatsecret_" prefix if present (for cached recipe IDs)
      const cleanId = recipeId.replace(/^fatsecret_/, '');
      console.log('[FatSecretAdapter] Getting recipe details:', {
        originalId: recipeId,
        cleanId,
        idType: typeof cleanId,
      });
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
