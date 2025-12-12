/**
 * Dietary-Aware Recipe Service
 *
 * Integrates dietary restrictions and allergies with recipe search results.
 * Provides options to filter out or modify recipes based on user preferences.
 */

import {DietaryRestrictionModel} from '../models/DietaryRestriction';
import {AllergyModel} from '../models/Allergy';
import {RecipeFilterService} from './RecipeFilterService';
import {IngredientSubstitutionService} from './IngredientSubstitutionService';

export interface DietaryAwareRecipe {
  id: string;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  sourceUrl: string;
  summary: string;
  ingredients: string[];
  instructions: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  provider: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  likes: number;

  // Dietary awareness fields
  dietaryStatus: 'safe' | 'warning' | 'conflict';
  dietaryIssues?: {
    restrictions: string[];
    allergies: string[];
  };
  substitutions?: Array<{
    original: string;
    substitutes: Array<{
      ingredient: string;
      ratio: string;
      notes?: string;
    }>;
    reason: 'dietary' | 'allergy' | 'availability';
  }>;
  modifiedTitle?: string; // e.g., "Chicken Alfredo (Vegan Version)"
}

export interface DietarySearchOptions {
  userId: number;
  showConflictingRecipes: boolean; // true = show with substitutions, false = hide
  maxCalories?: number;
  mealType?: string;
}

export class DietaryAwareRecipeService {
  /**
   * Process recipes with dietary awareness
   */
  static async processRecipesWithDietaryAwareness(
    recipes: any[],
    options: DietarySearchOptions,
  ): Promise<DietaryAwareRecipe[]> {
    if (!options.userId) {
      console.log(
        '[DietaryAware] No userId provided, returning recipes as safe',
      );
      // No user context, return recipes as-is with safe status
      return recipes.map(recipe => ({
        ...recipe,
        dietaryStatus: 'safe' as const,
      }));
    }

    try {
      console.log(
        `[DietaryAware] Starting processing for user ${options.userId}`,
      );

      // Get user's dietary restrictions and allergies
      const [restrictions, allergies] = await Promise.all([
        DietaryRestrictionModel.getUserRestrictions(options.userId.toString()),
        AllergyModel.getUserAllergies(options.userId.toString()),
      ]);

      console.log(
        `[DietaryAware] Found ${restrictions.length} restrictions, ${allergies.length} allergies`,
      );

      if (restrictions.length === 0 && allergies.length === 0) {
        console.log(
          '[DietaryAware] No dietary restrictions found, returning recipes as safe',
        );
        // No dietary restrictions, return recipes as-is
        return recipes.map(recipe => ({
          ...recipe,
          dietaryStatus: 'safe' as const,
        }));
      }

      console.log(
        `[DietaryAware] Processing ${recipes.length} recipes for user ${options.userId}`,
      );
      console.log(
        `[DietaryAware] User has ${restrictions.length} restrictions, ${allergies.length} allergies`,
      );

      // Log the restrictions for debugging
      restrictions.forEach(r => {
        console.log(`[DietaryAware] Restriction: ${r.name} (${r.category})`);
      });

      const processedRecipes: DietaryAwareRecipe[] = [];

      for (const recipe of recipes) {
        console.log(`[DietaryAware] Processing recipe: "${recipe.title}"`);
        console.log(
          `[DietaryAware] Recipe ingredients: ${JSON.stringify(recipe.ingredients?.slice(0, 3) || [])}`,
        );

        const processed = await this.processRecipeForDietaryCompliance(
          recipe,
          restrictions,
          allergies,
          options.showConflictingRecipes,
          options.userId,
        );

        console.log(
          `[DietaryAware] Recipe "${recipe.title}" processed with status: ${processed.dietaryStatus}`,
        );

        // If user chose to hide conflicting recipes, skip them
        if (
          !options.showConflictingRecipes &&
          processed.dietaryStatus === 'conflict'
        ) {
          console.log(
            `[DietaryAware] Skipping conflicting recipe: "${recipe.title}"`,
          );
          continue;
        }

        processedRecipes.push(processed);
      }

      console.log(
        `[DietaryAware] Processed ${processedRecipes.length} recipes after dietary filtering`,
      );

      return processedRecipes;
    } catch (error) {
      console.error('[DietaryAware] Error processing recipes:', error);
      // Fallback: return original recipes with safe status
      return recipes.map(recipe => ({
        ...recipe,
        dietaryStatus: 'safe' as const,
      }));
    }
  }

  /**
   * Process a single recipe for dietary compliance
   */
  private static async processRecipeForDietaryCompliance(
    recipe: any,
    restrictions: any[],
    allergies: any[],
    showSubstitutions: boolean,
    _userId: number,
  ): Promise<DietaryAwareRecipe> {
    try {
      // Analyze recipe for conflicts
      const analysis = await RecipeFilterService.analyzeRecipe(
        _userId.toString(),
        recipe.ingredients || [],
      );

      const hasConflicts = analysis.conflicts.length > 0;

      if (!hasConflicts) {
        // Recipe is safe for user
        return {
          ...recipe,
          dietaryStatus: 'safe',
        };
      }

      // Recipe has conflicts
      const dietaryIssues = {
        restrictions: analysis.conflicts
          .filter((c: any) => c.type === 'dietary')
          .map((c: any) => c.restriction),
        allergies: analysis.conflicts
          .filter((c: any) => c.type === 'allergy')
          .map((c: any) => c.restriction),
      };

      if (!showSubstitutions) {
        // User wants to hide conflicting recipes
        return {
          ...recipe,
          dietaryStatus: 'conflict',
          dietaryIssues,
        };
      }

      // Generate substitutions for conflicting ingredients
      const allConflictingIngredients = analysis.conflicts.flatMap(
        (c: any) => c.conflictingIngredients,
      );
      const substitutions = IngredientSubstitutionService.getSubstitutions(
        allConflictingIngredients,
        analysis.conflicts.some((c: any) => c.type === 'allergy')
          ? 'allergy'
          : 'dietary',
      );

      // Create modified title if substitutions are available
      let modifiedTitle = recipe.title;
      if (substitutions.length > 0) {
        const hasVeganSubs = substitutions.some(s =>
          s.substitutes.some(
            sub =>
              sub.ingredient.includes('vegan') ||
              sub.ingredient.includes('plant') ||
              sub.ingredient.includes('coconut') ||
              sub.ingredient.includes('almond'),
          ),
        );

        if (
          hasVeganSubs &&
          restrictions.some(r => r.name?.toLowerCase().includes('vegan'))
        ) {
          modifiedTitle = `${recipe.title} (Vegan Version)`;
        } else if (substitutions.length > 0) {
          modifiedTitle = `${recipe.title} (Modified)`;
        }
      }

      return {
        ...recipe,
        dietaryStatus: substitutions.length > 0 ? 'warning' : 'conflict',
        dietaryIssues,
        substitutions,
        modifiedTitle,
      };
    } catch (error) {
      console.error(
        '[DietaryAware] Error processing recipe:',
        recipe.id,
        error,
      );
      // Fallback: mark as safe
      return {
        ...recipe,
        dietaryStatus: 'safe',
      };
    }
  }

  /**
   * Get user's dietary preference for showing conflicting recipes
   */
  static async getUserDietaryPreference(_userId: number): Promise<boolean> {
    try {
      // Check if user has a preference stored
      // For now, default to showing substitutions (true)
      // This could be stored in user preferences table later
      return true;
    } catch (error) {
      console.error('[DietaryAware] Error getting user preference:', error);
      return true; // Default to showing substitutions
    }
  }
}
