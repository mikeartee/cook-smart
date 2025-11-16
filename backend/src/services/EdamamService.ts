/**
 * Edamam Recipe API Service
 * 
 * Implements IRecipeProvider for Edamam Recipe Search API
 * Free tier: 10,000 calls/month (~333 calls/day)
 * Rate limit: 10 calls/minute
 * 
 * Documentation: https://developer.edamam.com/edamam-docs-recipe-api
 */

import axios from 'axios';
import { IRecipeProvider, Recipe, RecipeDetails } from '../interfaces/IRecipeProvider';
import { RecipeCacheModel } from '../models/RecipeCache';
import rateLimitTracker from './RateLimitTracker';

const EDAMAM_APP_ID = process.env.EDAMAM_APP_ID || '';
const EDAMAM_APP_KEY = process.env.EDAMAM_APP_KEY || '';
const EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';
const DAILY_LIMIT = 333; // ~10,000 calls per month

export class EdamamService implements IRecipeProvider {
  /**
   * Search for recipes by ingredients
   */
  async searchByIngredients(ingredients: string[], limit: number): Promise<Recipe[]> {
    // Check if credentials are configured
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      throw new Error('Edamam API credentials not configured');
    }

    // Increment rate limit counter
    await rateLimitTracker.incrementCount('edamam');

    // Build search query from ingredients
    const query = ingredients.join(' ');

    try {
      const response = await axios.get(EDAMAM_BASE_URL, {
        params: {
          type: 'public',
          q: query,
          app_id: EDAMAM_APP_ID,
          app_key: EDAMAM_APP_KEY,
          to: limit,
        },
        timeout: 10000, // 10 second timeout
      });

      if (!response.data || !response.data.hits) {
        return [];
      }

      return this.mapEdamamToRecipe(response.data.hits);
    } catch (error: any) {
      if (error.response) {
        console.error('Edamam API error:', error.response.status, error.response.data);
        
        if (error.response.status === 429) {
          throw new Error('Edamam rate limit exceeded');
        }
        
        if (error.response.status === 401) {
          throw new Error('Edamam API credentials invalid');
        }
      }
      
      throw new Error(`Edamam API request failed: ${error.message}`);
    }
  }

  /**
   * Get detailed recipe information
   * Note: Edamam includes full details in search results,
   * so we retrieve from cache or search again
   */
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    // Try to get from cache first
    const cached = await RecipeCacheModel.getCachedRecipe(recipeId);
    
    if (cached && cached.recipe_data) {
      return cached.recipe_data;
    }

    // If not in cache, we can't fetch individual recipes from Edamam
    // (they don't have a "get by ID" endpoint)
    throw new Error('Recipe not found in cache. Please search again.');
  }

  /**
   * Check if Edamam is available (within rate limits)
   */
  async isAvailable(): Promise<boolean> {
    // Check if credentials are configured
    if (!EDAMAM_APP_ID || !EDAMAM_APP_KEY) {
      console.log('⚠️  Edamam credentials not configured');
      return false;
    }

    // Check rate limit
    const withinLimit = await rateLimitTracker.checkLimit('edamam', DAILY_LIMIT);
    
    if (!withinLimit) {
      const usage = rateLimitTracker.getUsage('edamam');
      console.log(`⚠️  Edamam daily limit reached: ${usage?.count}/${DAILY_LIMIT}`);
    }

    return withinLimit;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'Edamam';
  }

  /**
   * Map Edamam API response to our unified Recipe model
   */
  private mapEdamamToRecipe(hits: any[]): Recipe[] {
    return hits.map(hit => {
      const recipe = hit.recipe;
      
      // Generate a unique ID from the Edamam URI
      const recipeId = this.generateRecipeId(recipe.uri);

      return {
        id: recipeId,
        title: recipe.label || 'Untitled Recipe',
        image: recipe.image || recipe.images?.REGULAR?.url || '',
        servings: recipe.yield || 4,
        readyInMinutes: recipe.totalTime || 30,
        sourceUrl: recipe.url || '',
        summary: `${recipe.source || 'Unknown source'} - ${recipe.cuisineType?.join(', ') || 'Various cuisines'}`,
        ingredients: recipe.ingredientLines || [],
        instructions: recipe.instructions || 'See source URL for detailed cooking instructions.',
        cuisines: recipe.cuisineType || [],
        dishTypes: recipe.dishType || [],
        diets: recipe.dietLabels || [],
        nutrition: {
          calories: Math.round(recipe.calories || 0),
          protein: Math.round(recipe.totalNutrients?.PROCNT?.quantity || 0),
          carbs: Math.round(recipe.totalNutrients?.CHOCDF?.quantity || 0),
          fat: Math.round(recipe.totalNutrients?.FAT?.quantity || 0),
        },
        provider: 'edamam',
      };
    });
  }

  /**
   * Generate a consistent recipe ID from Edamam URI
   * Edamam URIs look like: "http://www.edamam.com/ontologies/edamam.owl#recipe_abc123"
   */
  private generateRecipeId(uri: string): string {
    // Extract the hash part after the #
    const parts = uri.split('#');
    if (parts.length > 1 && parts[1]) {
      return parts[1].replace('recipe_', '');
    }
    
    // Fallback: use the full URI as ID
    return uri;
  }
}

export default new EdamamService();
