import FatSecretService from './FatSecretService';
import SpoonacularService from './SpoonacularService';

interface UnifiedRecipe {
  id: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  summary?: string;
  instructions?: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
  }>;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  source: 'fatsecret' | 'spoonacular' | 'themealdb';
  dietaryInfo?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
    dairyFree?: boolean;
  };
}

class UnifiedRecipeService {
  /**
   * Search recipes from all available sources
   */
  async searchRecipes(
    query: string,
    options?: {
      maxResults?: number;
      dietary?: string[];
      maxCalories?: number;
      includeIngredients?: string[];
      excludeIngredients?: string[];
    },
  ): Promise<UnifiedRecipe[]> {
    const results: UnifiedRecipe[] = [];
    const maxResults = options?.maxResults || 20;

    try {
      // PRIORITY 1: FatSecret (Premier Free - 17,000+ recipes, complete nutrition)
      if (FatSecretService.isConfigured()) {
        console.log(`[UnifiedRecipe] Searching FatSecret for: "${query}"`);
        const fatSecretRecipes = await this.searchFatSecretRecipes(
          query,
          options,
        );
        console.log(
          `[UnifiedRecipe] FatSecret returned ${fatSecretRecipes.length} recipes`,
        );
        results.push(...fatSecretRecipes);
      }

      // PRIORITY 2: Only use Spoonacular if FatSecret returns < 5 results
      // This ensures FatSecret is truly primary
      if (results.length < 5) {
        console.log(
          `[UnifiedRecipe] FatSecret returned < 5 results, supplementing with Spoonacular`,
        );
        const spoonacularRecipes = await this.searchSpoonacularRecipes(
          query,
          maxResults - results.length,
        );
        console.log(
          `[UnifiedRecipe] Spoonacular returned ${spoonacularRecipes.length} recipes`,
        );
        results.push(...spoonacularRecipes);
      } else {
        console.log(
          `[UnifiedRecipe] FatSecret provided sufficient results, skipping Spoonacular`,
        );
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error('[UnifiedRecipe] Search error:', error);
      return results;
    }
  }

  /**
   * Search recipes by available ingredients
   */
  async searchByIngredients(
    ingredients: string[],
    maxResults: number = 20,
  ): Promise<UnifiedRecipe[]> {
    const results: UnifiedRecipe[] = [];

    try {
      // PRIORITY 1: FatSecret (best ingredient filtering and nutrition)
      if (FatSecretService.isConfigured()) {
        console.log(
          `[UnifiedRecipe] Searching FatSecret by ingredients: ${ingredients.join(', ')}`,
        );
        const fatSecretRecipes = await FatSecretService.searchRecipesAdvanced({
          mustIncludeIngredients: ingredients.join(','),
          maxResults,
        });
        console.log(
          `[UnifiedRecipe] FatSecret returned ${fatSecretRecipes.length} recipes`,
        );

        results.push(
          ...fatSecretRecipes.map(r => this.formatFatSecretRecipe(r)),
        );
      }

      // PRIORITY 2: Only use Spoonacular if FatSecret returns < 5 results
      if (results.length < 5) {
        console.log(
          `[UnifiedRecipe] FatSecret returned < 5 results, supplementing with Spoonacular`,
        );
        const spoonacularRecipes = await SpoonacularService.searchByIngredients(
          ingredients,
          maxResults - results.length,
        );
        console.log(
          `[UnifiedRecipe] Spoonacular returned ${spoonacularRecipes.length} recipes`,
        );
        // Convert Recipe[] to UnifiedRecipe[] by adding source property
        const unifiedRecipes = spoonacularRecipes.map(recipe => ({
          ...recipe,
          source: 'spoonacular' as const,
          ingredients: recipe.ingredients.map(ing => ({
            name: ing,
            amount: 0,
            unit: '',
          })),
        }));
        results.push(...unifiedRecipes);
      }

      return results.slice(0, maxResults);
    } catch (error) {
      console.error('[UnifiedRecipe] Ingredient search error:', error);
      return results;
    }
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(
    recipeId: string,
    source: 'fatsecret' | 'spoonacular',
  ): Promise<UnifiedRecipe | null> {
    try {
      if (source === 'fatsecret') {
        const recipe = await FatSecretService.getRecipeDetails(recipeId);
        return recipe ? this.formatFatSecretRecipe(recipe) : null;
      } else {
        const recipeDetails =
          await SpoonacularService.getRecipeDetails(recipeId);
        // Convert RecipeDetails to UnifiedRecipe by adding source property
        return {
          ...recipeDetails,
          source: 'spoonacular' as const,
          ingredients: recipeDetails.ingredients.map(ing => ({
            name: ing,
            amount: 0,
            unit: '',
          })),
        };
      }
    } catch (error) {
      console.error('[UnifiedRecipe] Get details error:', error);
      return null;
    }
  }

  /**
   * Get recipe suggestions based on dietary preferences
   */
  async getRecipeSuggestions(options: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
    dietary?: string[];
    maxCalories?: number;
    maxResults?: number;
  }): Promise<UnifiedRecipe[]> {
    const results: UnifiedRecipe[] = [];
    const maxResults = options.maxResults || 20;

    try {
      if (FatSecretService.isConfigured()) {
        const recipes = await FatSecretService.searchRecipesAdvanced({
          recipeTypes: options.mealType,
          maxCalories: options.maxCalories,
          maxResults,
        });

        results.push(...recipes.map(r => this.formatFatSecretRecipe(r)));
      }

      return results;
    } catch (error) {
      console.error('[UnifiedRecipe] Suggestions error:', error);
      return results;
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async searchFatSecretRecipes(
    query: string,
    options?: any,
  ): Promise<UnifiedRecipe[]> {
    try {
      const recipes = await FatSecretService.searchRecipesAdvanced({
        query,
        maxResults: options?.maxResults || 10,
        maxCalories: options?.maxCalories,
        mustIncludeIngredients: options?.includeIngredients?.join(','),
        mustNotIncludeIngredients: options?.excludeIngredients?.join(','),
      });

      return recipes.map(recipe => this.formatFatSecretRecipe(recipe));
    } catch (error) {
      console.error('[UnifiedRecipe] FatSecret search error:', error);
      return [];
    }
  }

  private async searchSpoonacularRecipes(
    query: string,
    maxResults: number,
  ): Promise<UnifiedRecipe[]> {
    try {
      // Spoonacular doesn't have a direct text search, use ingredient search as fallback
      const ingredients = query.split(' ').filter(word => word.length > 3);
      if (ingredients.length === 0) {
        return [];
      }
      const recipes = await SpoonacularService.searchByIngredients(
        ingredients,
        maxResults,
      );
      // Convert Recipe[] to UnifiedRecipe[] by adding source property
      return recipes.map(recipe => ({
        ...recipe,
        source: 'spoonacular' as const,
        ingredients: recipe.ingredients.map(ing => ({
          name: ing,
          amount: 0,
          unit: '',
        })),
      }));
    } catch (error) {
      console.error('[UnifiedRecipe] Spoonacular search error:', error);
      return [];
    }
  }

  private formatFatSecretRecipe(recipe: any): UnifiedRecipe {
    // Parse ingredients from FatSecret format
    const ingredients: Array<{name: string; amount: number; unit: string}> = [];

    if (recipe.ingredients && recipe.ingredients.ingredient) {
      const ingredientList = Array.isArray(recipe.ingredients.ingredient)
        ? recipe.ingredients.ingredient
        : [recipe.ingredients.ingredient];

      ingredientList.forEach((ing: any) => {
        ingredients.push({
          name: ing.ingredient_description || ing.food_name || '',
          amount: parseFloat(ing.number_of_units) || 1,
          unit: ing.measurement_description || '',
        });
      });
    }

    // Parse nutrition
    const nutrition = recipe.serving_sizes?.serving
      ? {
          calories: parseFloat(recipe.serving_sizes.serving.calories) || 0,
          protein: parseFloat(recipe.serving_sizes.serving.protein) || 0,
          carbs: parseFloat(recipe.serving_sizes.serving.carbohydrate) || 0,
          fat: parseFloat(recipe.serving_sizes.serving.fat) || 0,
        }
      : undefined;

    return {
      id: `fs_${recipe.recipe_id}`,
      title: recipe.recipe_name || 'Untitled Recipe',
      image: recipe.recipe_images?.recipe_image || recipe.recipe_image || '',
      readyInMinutes: parseInt(recipe.cooking_time_min) || 30,
      servings: parseInt(recipe.number_of_servings) || 4,
      sourceUrl: recipe.recipe_url,
      summary: recipe.recipe_description || '',
      instructions: this.formatInstructions(recipe.directions),
      ingredients,
      nutrition,
      source: 'fatsecret',
      dietaryInfo: {
        vegetarian: recipe.recipe_types?.includes('vegetarian'),
        vegan: recipe.recipe_types?.includes('vegan'),
        glutenFree: recipe.recipe_types?.includes('gluten-free'),
      },
    };
  }

  private formatInstructions(directions: any): string {
    if (!directions || !directions.direction) return '';

    const directionList = Array.isArray(directions.direction)
      ? directions.direction
      : [directions.direction];

    return directionList
      .map(
        (d: any, index: number) =>
          `${index + 1}. ${d.direction_description || d}`,
      )
      .join('\n');
  }
}

export default new UnifiedRecipeService();
