/**
 * Recipe Provider Service (Orchestrator)
 *
 * Manages recipe API providers with automatic fallback.
 * Implements cache-first strategy to minimize API calls.
 *
 * Flow:
 * 1. Check cache
 * 2. Try primary provider (FatSecret - 500K calls/month free)
 * 3. Try fallback providers (if configured)
 * 4. Return cached results if all fail
 */

import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';
import {RecipeCacheModel} from '../models/RecipeCache';
import {APIUsageLogModel} from '../models/APIUsageLog';
import crypto from 'crypto';

export class RecipeProviderService {
  private providers: IRecipeProvider[];
  private primaryProvider: IRecipeProvider;
  private fallbackProviders: IRecipeProvider[];
  private lastUsedProvider: string = '';

  constructor(providers: IRecipeProvider[]) {
    if (providers.length === 0) {
      throw new Error('At least one recipe provider must be configured');
    }

    this.providers = providers;
    this.primaryProvider = providers[0]!; // Non-null assertion since we checked length
    this.fallbackProviders = providers.slice(1);
  }

  /**
   * Search for recipes by ingredients with cache-first strategy
   */
  async searchByIngredients(
    ingredients: string[],
    limit: number = 10,
    options?: {maxCalories?: number; mealType?: string},
  ): Promise<Recipe[]> {
    // Generate cache key including filters
    const cacheKey = this.generateCacheKey(ingredients, options);

    // SKIP CACHE for ingredient searches to ensure fresh matching calculations
    // Cached recipes don't have proper ingredient matching data
    console.log(
      `⏭️  Skipping cache for ingredient search to ensure fresh matching`,
    );

    // Step 1: Check cache first (DISABLED for ingredient matching)
    // The cache-first strategy was causing 0% matches because cached recipes
    // don't have proper ingredient matching calculations
    // try {
    //   const cached = await this.checkCache(cacheKey);
    //   if (cached && cached.length > 0) {
    //     console.log(`✅ Cache HIT for ingredient search: ${cacheKey}`);
    //     return cached;
    //   }
    // } catch (cacheError) {
    //   console.log(
    //     `⚠️  Cache check failed, continuing to API:`,
    //     (cacheError as Error).message,
    //   );
    // }

    console.log(
      `⏭️  Forcing fresh API call for ingredient search: ${cacheKey}`,
    );

    // Step 2: Try primary provider
    try {
      if (await this.primaryProvider.isAvailable()) {
        console.log(
          `🔍 Trying primary provider: ${this.primaryProvider.getProviderName()}`,
        );
        const startTime = Date.now();

        try {
          console.log(
            `🔍 Calling ${this.primaryProvider.getProviderName()}.searchByIngredients with:`,
            {ingredients: ingredients.slice(0, 5), limit, options},
          );

          const results = await this.primaryProvider.searchByIngredients(
            ingredients,
            limit,
            options,
          );
          const responseTime = Date.now() - startTime;

          console.log(
            `📊 ${this.primaryProvider.getProviderName()} returned ${results?.length || 0} results in ${responseTime}ms`,
          );

          // Log successful API call (non-blocking)
          try {
            await APIUsageLogModel.logAPICall(
              this.primaryProvider.getProviderName(),
              'searchByIngredients',
              true,
              false,
              responseTime,
            );
          } catch (logError) {
            console.log(`⚠️  API logging failed:`, (logError as Error).message);
          }

          if (results && results.length > 0) {
            // Track which provider was actually used
            this.lastUsedProvider = this.primaryProvider.getProviderName();

            // Try to cache, but don't fail if caching fails
            try {
              await this.cacheResults(cacheKey, results);
            } catch (cacheError) {
              console.log(
                `⚠️  Caching failed, but continuing:`,
                (cacheError as Error).message,
              );
            }

            console.log(
              `✅ ${this.primaryProvider.getProviderName()} returned ${results.length} recipes`,
            );

            // Check rate limit warning (also non-blocking)
            try {
              await this.checkRateLimitWarning(
                this.primaryProvider.getProviderName(),
              );
            } catch (rateLimitError) {
              console.log(
                `⚠️  Rate limit check failed:`,
                (rateLimitError as Error).message,
              );
            }

            return results;
          }
        } catch (apiError) {
          const responseTime = Date.now() - startTime;

          // Log failed API call
          await APIUsageLogModel.logAPICall(
            this.primaryProvider.getProviderName(),
            'searchByIngredients',
            false,
            false,
            responseTime,
            (apiError as Error).message,
          );

          throw apiError;
        }
      } else {
        console.log(
          `⚠️  Primary provider ${this.primaryProvider.getProviderName()} not available (rate limit)`,
        );
      }
    } catch (error) {
      console.log(
        `❌ Primary provider ${this.primaryProvider.getProviderName()} failed:`,
        (error as Error).message,
      );
    }

    // Step 3: Try fallback providers
    for (const provider of this.fallbackProviders) {
      try {
        if (await provider.isAvailable()) {
          console.log(
            `🔍 Trying fallback provider: ${provider.getProviderName()}`,
          );
          const startTime = Date.now();

          try {
            const results = await provider.searchByIngredients(
              ingredients,
              limit,
              options,
            );
            const responseTime = Date.now() - startTime;

            // Log successful API call
            await APIUsageLogModel.logAPICall(
              provider.getProviderName(),
              'searchByIngredients',
              true,
              false,
              responseTime,
            );

            if (results && results.length > 0) {
              await this.cacheResults(cacheKey, results);
              console.log(
                `✅ ${provider.getProviderName()} returned ${results.length} recipes`,
              );
              return results;
            }
          } catch (apiError) {
            const responseTime = Date.now() - startTime;

            // Log failed API call
            await APIUsageLogModel.logAPICall(
              provider.getProviderName(),
              'searchByIngredients',
              false,
              false,
              responseTime,
              (apiError as Error).message,
            );

            throw apiError;
          }
        } else {
          console.log(
            `⚠️  Fallback provider ${provider.getProviderName()} not available`,
          );
        }
      } catch (error) {
        console.log(
          `❌ Fallback provider ${provider.getProviderName()} failed:`,
          (error as Error).message,
        );
      }
    }

    // Step 4: For ingredient searches, DO NOT return cached results
    // This prevents returning old Spoonacular data when we need fresh matching calculations
    console.log(`⚠️  All providers failed for ingredient search`);
    console.log(
      `🚫  NOT returning cached results to avoid stale matching data`,
    );
    console.log(`✅  Returning empty array to force fresh data only`);
    return [];
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(
    recipeId: string,
    skipCache: boolean = false,
  ): Promise<RecipeDetails> {
    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      try {
        const cached = await RecipeCacheModel.getCachedRecipe(recipeId);
        if (cached && cached.recipe_data) {
          console.log(`✅ Cache HIT for recipe details: ${recipeId}`);
          return cached.recipe_data;
        }
      } catch (cacheError) {
        console.log(
          `⚠️  Cache check failed for recipe ${recipeId}:`,
          (cacheError as Error).message,
        );
      }
    } else {
      console.log(`⏭️  Skipping cache, fetching fresh from API: ${recipeId}`);
    }

    console.log(`❌ Cache MISS for recipe details: ${recipeId}`);

    // Try each provider
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          console.log(
            `🔍 Fetching recipe ${recipeId} from ${provider.getProviderName()}`,
          );
          const details = await provider.getRecipeDetails(recipeId);

          if (details) {
            await RecipeCacheModel.cacheRecipe(recipeId, details);
            console.log(
              `✅ Recipe ${recipeId} fetched from ${provider.getProviderName()}`,
            );
            return details;
          }
        }
      } catch (_error) {
        console.log(
          `❌ Provider ${provider.getProviderName()} failed to fetch recipe ${recipeId}`,
        );
      }
    }

    throw new Error('Recipe not found');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await RecipeCacheModel.getCacheStats();
  }

  /**
   * Generate MD5 hash from ingredient list for cache key
   */
  private generateIngredientHash(ingredients: string[]): string {
    const sorted = ingredients.sort().join(',').toLowerCase();
    return crypto.createHash('md5').update(sorted).digest('hex');
  }

  /**
   * Generate cache key including filters
   */
  private generateCacheKey(
    ingredients: string[],
    options?: {maxCalories?: number; mealType?: string},
  ): string {
    const sorted = ingredients.sort().join(',').toLowerCase();
    let cacheString = sorted;

    // Include filters in cache key
    if (options?.maxCalories) {
      cacheString += `|maxCal:${options.maxCalories}`;
    }
    if (options?.mealType) {
      cacheString += `|meal:${options.mealType}`;
    }

    return crypto.createHash('md5').update(cacheString).digest('hex');
  }

  /**
   * Check cache for search results
   */
  private async checkCache(ingredientHash: string): Promise<Recipe[]> {
    const cached = await RecipeCacheModel.getCachedSearch(ingredientHash);

    if (!cached) {
      return [];
    }

    // Fetch full recipe data from cache
    const recipes: Recipe[] = [];
    for (const recipeId of cached.recipe_ids) {
      const cachedRecipe = await RecipeCacheModel.getCachedRecipe(recipeId);
      if (cachedRecipe) {
        recipes.push(cachedRecipe.recipe_data);
      }
    }

    return recipes;
  }

  /**
   * Cache search results and individual recipes
   */
  private async cacheResults(
    ingredientHash: string,
    recipes: Recipe[],
  ): Promise<void> {
    try {
      const recipeIds: string[] = [];

      for (const recipe of recipes) {
        await RecipeCacheModel.cacheRecipe(recipe.id, recipe);
        recipeIds.push(recipe.id);
      }

      await RecipeCacheModel.cacheSearch(ingredientHash, recipeIds);
      console.log(`✅ Cached ${recipes.length} recipes and search result`);
    } catch (error) {
      console.log(`⚠️  Failed to cache recipes:`, (error as Error).message);
    }
  }

  /**
   * Get cached results only (when all providers fail)
   */
  private async getCachedResultsOnly(
    ingredientHash: string,
  ): Promise<Recipe[]> {
    try {
      // Try to get any cached results, even expired ones
      const result = await RecipeCacheModel.getCachedSearch(ingredientHash);

      if (result) {
        const recipes: Recipe[] = [];
        for (const recipeId of result.recipe_ids) {
          const cachedRecipe = await RecipeCacheModel.getCachedRecipe(recipeId);
          if (cachedRecipe) {
            recipes.push(cachedRecipe.recipe_data);
          }
        }
        return recipes;
      }
    } catch (error) {
      console.log(
        `⚠️  Failed to retrieve cached results:`,
        (error as Error).message,
      );
    }

    return [];
  }

  /**
   * Check if provider is approaching rate limit and log warning
   */
  private async checkRateLimitWarning(providerName: string): Promise<void> {
    const limits: {[key: string]: number} = {
      FatSecret: 500000, // 500K calls/month
    };

    const dailyLimit = limits[providerName];
    if (dailyLimit) {
      await APIUsageLogModel.checkRateLimitWarning(providerName, dailyLimit);
    }
  }

  /**
   * Get the name of the provider that was last used
   */
  getLastUsedProvider(): string {
    return this.lastUsedProvider || this.primaryProvider.getProviderName();
  }
}
