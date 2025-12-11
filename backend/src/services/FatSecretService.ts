import axios from 'axios';

interface FatSecretConfig {
  clientId: string;
  clientSecret: string;
}

interface FatSecretFood {
  food_id: string;
  food_name: string;
  brand_name?: string;
  food_type: string;
  food_url: string;
  servings: {
    serving: Array<{
      serving_id: string;
      serving_description: string;
      metric_serving_amount?: string;
      metric_serving_unit?: string;
      calories: string;
      protein: string;
      carbohydrate: string;
      fat: string;
    }>;
  };
}

class FatSecretService {
  private config: FatSecretConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.config = {
      clientId: process.env.FATSECRET_CLIENT_ID || '',
      clientSecret: process.env.FATSECRET_CLIENT_SECRET || '',
    };
  }

  isConfigured(): boolean {
    return Boolean(this.config.clientId && this.config.clientSecret);
  }

  static formatNutritionPer100g(serving: any): any {
    if (!serving) return undefined;

    // Convert serving data to per 100g
    const servingAmount = parseFloat(serving.metric_serving_amount) || 100;
    const multiplier = 100 / servingAmount;

    return {
      calories: Math.round(parseFloat(serving.calories) * multiplier),
      protein: Math.round(parseFloat(serving.protein) * multiplier * 10) / 10,
      carbs:
        Math.round(parseFloat(serving.carbohydrate) * multiplier * 10) / 10,
      fat: Math.round(parseFloat(serving.fat) * multiplier * 10) / 10,
    };
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`,
      ).toString('base64');

      const response = await axios.post(
        'https://oauth.fatsecret.com/connect/token',
        'grant_type=client_credentials&scope=premier',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        },
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      console.error('[FatSecret] Token error:', error);
      throw new Error('Failed to get FatSecret access token');
    }
  }

  async searchByBarcode(barcode: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'food.find_id_for_barcode',
            barcode: barcode,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.food_id) {
        // Get detailed food information
        return await this.getFoodDetails(response.data.food_id.value);
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`[FatSecret] Barcode not found: ${barcode}`);
        return null;
      }
      console.error('[FatSecret] Barcode search error:', error);
      return null;
    }
  }

  async getFoodDetails(foodId: string): Promise<FatSecretFood | null> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'food.get.v2',
            food_id: foodId,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      return response.data.food || null;
    } catch (error) {
      console.error('[FatSecret] Food details error:', error);
      return null;
    }
  }

  async searchFoods(query: string, maxResults: number = 20): Promise<any[]> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'foods.search',
            search_expression: query,
            max_results: maxResults,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (response.data && response.data.foods && response.data.foods.food) {
        return Array.isArray(response.data.foods.food)
          ? response.data.foods.food
          : [response.data.foods.food];
      }

      return [];
    } catch (error) {
      console.error('[FatSecret] Food search error:', error);
      return [];
    }
  }

  // ============================================
  // RECIPE METHODS
  // ============================================

  async searchRecipes(query: string, maxResults: number = 20): Promise<any[]> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'recipes.search.v3',
            search_expression: query,
            max_results: maxResults,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (
        response.data &&
        response.data.recipes &&
        response.data.recipes.recipe
      ) {
        return Array.isArray(response.data.recipes.recipe)
          ? response.data.recipes.recipe
          : [response.data.recipes.recipe];
      }

      return [];
    } catch (error) {
      console.error('[FatSecret] Recipe search error:', error);
      return [];
    }
  }

  async getRecipeDetails(recipeId: string): Promise<any> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'recipe.get.v2',
            recipe_id: recipeId,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      const recipe = response.data.recipe || null;

      // Log what we got from FatSecret
      console.log('[FatSecret] Recipe details response:', {
        recipeId,
        hasRecipe: !!recipe,
        hasIngredients: !!recipe?.ingredients,
        hasDirections: !!recipe?.directions,
        ingredientCount: recipe?.ingredients?.ingredient
          ? Array.isArray(recipe.ingredients.ingredient)
            ? recipe.ingredients.ingredient.length
            : 1
          : 0,
        directionCount: recipe?.directions?.direction
          ? Array.isArray(recipe.directions.direction)
            ? recipe.directions.direction.length
            : 1
          : 0,
      });

      return recipe;
    } catch (error) {
      console.error('[FatSecret] Recipe details error:', error);
      return null;
    }
  }

  async searchRecipesAdvanced(options: {
    query?: string;
    maxResults?: number;
    recipeTypes?: string;
    mustIncludeIngredients?: string;
    mustNotIncludeIngredients?: string;
    maxCalories?: number;
  }): Promise<any[]> {
    try {
      const token = await this.getAccessToken();

      const params: any = {
        method: 'recipes.search.v3',
        max_results: options.maxResults || 20,
        format: 'json',
      };

      if (options.query) params.search_expression = options.query;
      if (options.recipeTypes) params.recipe_types = options.recipeTypes;
      if (options.mustIncludeIngredients)
        params.must_include_ingredient_names = options.mustIncludeIngredients;
      if (options.mustNotIncludeIngredients)
        params.must_not_include_ingredient_names =
          options.mustNotIncludeIngredients;
      if (options.maxCalories) params.max_calories = options.maxCalories;

      console.log('[FatSecret] Search params:', params);

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      console.log('[FatSecret] Search response:', {
        hasRecipes: !!response.data?.recipes,
        recipeCount: response.data?.recipes?.recipe
          ? Array.isArray(response.data.recipes.recipe)
            ? response.data.recipes.recipe.length
            : 1
          : 0,
      });

      if (
        response.data &&
        response.data.recipes &&
        response.data.recipes.recipe
      ) {
        return Array.isArray(response.data.recipes.recipe)
          ? response.data.recipes.recipe
          : [response.data.recipes.recipe];
      }

      return [];
    } catch (error: any) {
      console.error('[FatSecret] Advanced recipe search error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return [];
    }
  }

  async autocompleteFood(query: string): Promise<any[]> {
    try {
      const token = await this.getAccessToken();

      const response = await axios.post(
        'https://platform.fatsecret.com/rest/server.api',
        null,
        {
          params: {
            method: 'foods.autocomplete',
            expression: query,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        },
      );

      if (
        response.data &&
        response.data.suggestions &&
        response.data.suggestions.suggestion
      ) {
        return Array.isArray(response.data.suggestions.suggestion)
          ? response.data.suggestions.suggestion
          : [response.data.suggestions.suggestion];
      }

      return [];
    } catch (error) {
      console.error('[FatSecret] Autocomplete error:', error);
      return [];
    }
  }

  formatNutritionPer100g(serving: any): any {
    // FatSecret provides nutrition per serving, convert to per 100g
    const servingSize = parseFloat(serving.metric_serving_amount) || 100;
    const multiplier = 100 / servingSize;

    return {
      calories: Math.round(parseFloat(serving.calories) * multiplier),
      protein: Math.round(parseFloat(serving.protein) * multiplier * 10) / 10,
      carbs:
        Math.round(parseFloat(serving.carbohydrate) * multiplier * 10) / 10,
      fat: Math.round(parseFloat(serving.fat) * multiplier * 10) / 10,
    };
  }
}

export default new FatSecretService();
