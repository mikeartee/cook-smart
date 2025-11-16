/**
 * DEPRECATED: Spoonacular Service
 * 
 * This service has been replaced by the new RecipeProviderService
 * which uses Edamam (primary) and TheMealDB (fallback).
 * 
 * Reason for deprecation:
 * - Spoonacular free tier only provides 50 points/day
 * - New system provides 333 calls/day + unlimited fallback
 * - 6.6x improvement in API availability
 * 
 * Migration date: 2025-11-15
 * Can be safely deleted after confirming new system works
 * 
 * See: .kiro/RECIPE_API_SETUP.md for new setup
 */

import axios from 'axios';
import crypto from 'crypto';
import { RecipeCacheModel } from '../models/RecipeCache';

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY || '';
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

export interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: any[];
  usedIngredients: any[];
  unusedIngredients: any[];
  likes: number;
}

export interface RecipeDetails {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  summary: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  instructions: string;
  extendedIngredients: any[];
  analyzedInstructions: any[];
}

class SpoonacularService {
  // Generate cache key from ingredient list
  private generateIngredientHash(ingredients: string[]): string {
    const sorted = ingredients.sort().join(',');
    return crypto.createHash('md5').update(sorted).digest('hex');
  }

  // Search recipes by ingredients with aggressive caching
  async searchByIngredients(ingredients: string[], number: number = 10): Promise<SpoonacularRecipe[]> {
    const ingredientHash = this.generateIngredientHash(ingredients);
    
    // Check cache first (with error handling for DB issues)
    try {
      const cached = await RecipeCacheModel.getCachedSearch(ingredientHash);
      if (cached) {
        console.log(`✅ Cache HIT for ingredient search: ${ingredientHash}`);
        
        // Fetch full recipe data from cache
        const recipes: SpoonacularRecipe[] = [];
        for (const recipeId of cached.recipe_ids) {
          const cachedRecipe = await RecipeCacheModel.getCachedRecipe(recipeId);
          if (cachedRecipe) {
            recipes.push(cachedRecipe.recipe_data);
          }
        }
        
        return recipes;
      }
    } catch (cacheError) {
      console.log(`⚠️  Cache check failed (DB issue), skipping cache:`, (cacheError as Error).message);
    }
    
    console.log(`❌ Cache MISS for ingredient search: ${ingredientHash} - Calling Spoonacular API`);
    
    // Cache miss - call Spoonacular API
    try {
      const response = await axios.get(`${SPOONACULAR_BASE_URL}/recipes/findByIngredients`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          ingredients: ingredients.join(','),
          number,
          ranking: 2, // Maximize used ingredients
          ignorePantry: true,
        },
      });
      
      const recipes: SpoonacularRecipe[] = response.data;
      
      // Try to cache (but don't fail if DB is down)
      try {
        const recipeIds: string[] = [];
        for (const recipe of recipes) {
          await RecipeCacheModel.cacheRecipe(recipe.id.toString(), recipe);
          recipeIds.push(recipe.id.toString());
        }
        
        // Cache search results for 30 days
        await RecipeCacheModel.cacheSearch(ingredientHash, recipeIds);
        
        console.log(`✅ Cached ${recipes.length} recipes and search result`);
      } catch (cacheError) {
        console.log(`⚠️  Failed to cache recipes (DB issue), continuing anyway:`, (cacheError as Error).message);
      }
      
      return recipes;
    } catch (error: any) {
      console.error('Spoonacular API error:', error.response?.data || error.message);
      throw new Error('Failed to search recipes');
    }
  }

  // Get recipe details with aggressive caching
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    // Check cache first (with error handling for DB issues)
    try {
      const cached = await RecipeCacheModel.getCachedRecipe(recipeId);
      if (cached && cached.recipe_data.extendedIngredients) {
        console.log(`✅ Cache HIT for recipe details: ${recipeId}`);
        return cached.recipe_data;
      }
    } catch (cacheError) {
      console.log(`⚠️  Cache check failed (DB issue), skipping cache:`, (cacheError as Error).message);
    }
    
    console.log(`❌ Cache MISS for recipe details: ${recipeId} - Calling Spoonacular API`);
    
    // Cache miss - call Spoonacular API
    try {
      const response = await axios.get(`${SPOONACULAR_BASE_URL}/recipes/${recipeId}/information`, {
        params: {
          apiKey: SPOONACULAR_API_KEY,
          includeNutrition: false,
        },
      });
      
      const recipeDetails: RecipeDetails = response.data;
      
      // Try to cache (but don't fail if DB is down)
      try {
        await RecipeCacheModel.cacheRecipe(recipeId, recipeDetails);
        console.log(`✅ Cached recipe details for: ${recipeId}`);
      } catch (cacheError) {
        console.log(`⚠️  Failed to cache recipe details (DB issue), continuing anyway:`, (cacheError as Error).message);
      }
      
      return recipeDetails;
    } catch (error: any) {
      console.error('Spoonacular API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch recipe details');
    }
  }

  // Get cache statistics
  async getCacheStats() {
    return await RecipeCacheModel.getCacheStats();
  }
}

export default new SpoonacularService();
