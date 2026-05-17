/**
 * TheMealDB API Service
 *
 * Implements IRecipeProvider for TheMealDB API
 * Free tier: UNLIMITED calls (completely free)
 * No API key required for basic tier
 *
 * Documentation: https://www.themealdb.com/api.php
 *
 * Note: TheMealDB only supports single ingredient searches,
 * so we search with the first ingredient and filter results
 */

import {httpGet} from '../utils/httpClient';
import {
  IRecipeProvider,
  Recipe,
  RecipeDetails,
} from '../interfaces/IRecipeProvider';

const THEMEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

export class TheMealDBService implements IRecipeProvider {
  /**
   * Search for recipes by ingredients
   * Note: TheMealDB only supports single ingredient search
   */
  async searchByIngredients(
    ingredients: string[],
    limit: number,
  ): Promise<Recipe[]> {
    if (ingredients.length === 0) {
      return [];
    }

    // Try searching with multiple ingredients until we find results
    for (const ingredient of ingredients) {
      const searchTerms = this.getSearchTerms(ingredient);

      for (const searchTerm of searchTerms) {
        console.log(
          `🔍 Searching TheMealDB for: "${searchTerm}" (original: "${ingredient}")`,
        );

        try {
          const response = await httpGet<{meals?: Array<{idMeal: string}>}>(
            `${THEMEALDB_BASE_URL}/filter.php`,
            {
              params: {i: searchTerm},
              timeout: 10000, // 10 second timeout
            },
          );

          if (
            response.data &&
            response.data.meals &&
            response.data.meals.length > 0
          ) {
            console.log(
              `✅ Found ${response.data.meals.length} meals for "${searchTerm}"`,
            );

            // Get details for each meal (up to limit)
            const meals = response.data.meals.slice(0, limit);
            const detailedRecipes = await Promise.all(
              meals.map((meal: any) => this.getRecipeDetails(meal.idMeal)),
            );

            return detailedRecipes;
          } else {
            console.log(`⚠️  No meals found for "${searchTerm}"`);
          }
        } catch (error: any) {
          console.log(
            `⚠️  Search failed for "${searchTerm}": ${error.message}`,
          );
        }
      }
    }

    // No results found for any ingredient
    console.log(`⚠️  No meals found for any of the provided ingredients`);
    return [];
  }

  /**
   * Get detailed recipe information
   */
  async getRecipeDetails(recipeId: string): Promise<RecipeDetails> {
    try {
      const response = await httpGet<{meals?: Array<Record<string, unknown>>}>(
        `${THEMEALDB_BASE_URL}/lookup.php`,
        {
          params: {i: recipeId},
          timeout: 10000,
        },
      );

      if (
        !response.data ||
        !response.data.meals ||
        response.data.meals.length === 0
      ) {
        throw new Error('Recipe not found');
      }

      const meal = response.data.meals[0];
      return this.mapMealDBToRecipe(meal);
    } catch (error: any) {
      console.error('TheMealDB recipe details error:', error.message);
      throw new Error(`Failed to fetch recipe details: ${error.message}`);
    }
  }

  /**
   * Check if TheMealDB is available
   * Always returns true since it's unlimited and free
   */
  async isAvailable(): Promise<boolean> {
    return true;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'TheMealDB';
  }

  /**
   * Generate multiple search terms for an ingredient
   * Returns array of search terms from most specific to most general
   */
  private getSearchTerms(ingredient: string): string[] {
    const terms: string[] = [];

    // Remove content in parentheses (brand names, details)
    let cleaned = ingredient.replace(/\([^)]*\)/g, '').trim();

    // Remove common prefixes
    cleaned = cleaned.replace(
      /^(sliced|diced|chopped|fresh|frozen|canned|organic)\s+/i,
      '',
    );

    // Try full cleaned name first
    if (cleaned) {
      terms.push(cleaned.toLowerCase());
    }

    // Try each word individually (for compound ingredients)
    const words = cleaned.split(' ').filter(w => w.length > 2);
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (!terms.includes(lowerWord)) {
        terms.push(lowerWord);
      }
    }

    // Fallback to original if nothing else worked
    if (terms.length === 0) {
      terms.push(ingredient.toLowerCase().trim());
    }

    return terms;
  }

  /**
   * Simplify ingredient name for better search results (deprecated - use getSearchTerms)
   * Removes brand names, parentheses, and extra details
   */
  private simplifyIngredientName(ingredient: string): string {
    const terms = this.getSearchTerms(ingredient);
    return terms[0] || ingredient.toLowerCase();
  }

  /**
   * Map TheMealDB meal object to our unified Recipe model
   */
  private mapMealDBToRecipe(meal: any): RecipeDetails {
    // Extract ingredients from meal object (strIngredient1-20)
    const ingredients: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];

      if (ingredient && ingredient.trim()) {
        const ingredientLine =
          measure && measure.trim()
            ? `${measure.trim()} ${ingredient.trim()}`
            : ingredient.trim();
        ingredients.push(ingredientLine);
      }
    }

    // Parse tags if available
    const tags = meal.strTags
      ? meal.strTags.split(',').map((t: string) => t.trim())
      : [];

    return {
      id: meal.idMeal,
      title: meal.strMeal || 'Untitled Recipe',
      image: meal.strMealThumb || '',
      servings: 4, // TheMealDB doesn't provide servings, use default
      readyInMinutes: 30, // TheMealDB doesn't provide time, use default
      sourceUrl: meal.strSource || meal.strYoutube || '',
      summary: `${meal.strCategory || 'Unknown category'} from ${meal.strArea || 'Unknown region'}`,
      ingredients,
      instructions: meal.strInstructions || 'No instructions available.',
      cuisines: meal.strArea ? [meal.strArea] : [],
      dishTypes: meal.strCategory ? [meal.strCategory] : [],
      diets: tags.filter((tag: string) =>
        ['vegetarian', 'vegan', 'gluten free', 'dairy free'].includes(
          tag.toLowerCase(),
        ),
      ),
      provider: 'themealdb',
    };
  }
}

export default new TheMealDBService();
