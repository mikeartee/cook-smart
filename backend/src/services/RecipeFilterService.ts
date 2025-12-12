import {DietaryRestrictionModel} from '../models/DietaryRestriction';
import {AllergyModel} from '../models/Allergy';

export interface RecipeConflict {
  type: 'dietary' | 'allergy';
  restriction: string;
  conflictingIngredients: string[];
}

export interface FilteredRecipe {
  recipeId: string;
  isCompatible: boolean;
  conflicts: RecipeConflict[];
}

export class RecipeFilterService {
  static async analyzeRecipe(
    userId: string,
    recipeIngredients: string[],
    recipeTitle?: string,
    recipeSummary?: string,
  ): Promise<FilteredRecipe> {
    const conflicts: RecipeConflict[] = [];

    // Get user's dietary restrictions and allergies
    const [
      dietaryRestrictions,
      _allergies,
      excludedIngredients,
      triggerIngredients,
    ] = await Promise.all([
      DietaryRestrictionModel.getUserRestrictions(userId),
      AllergyModel.getUserAllergies(userId),
      DietaryRestrictionModel.getAllUserExcludedIngredients(userId),
      AllergyModel.getAllUserTriggerIngredients(userId),
    ]);

    console.log(`[RecipeFilter] Analyzing recipe for user ${userId}`);
    console.log(
      `[RecipeFilter] Recipe ingredients: ${JSON.stringify(recipeIngredients)}`,
    );
    console.log(`[RecipeFilter] Recipe title: "${recipeTitle}"`);
    console.log(
      `[RecipeFilter] Excluded ingredients: ${JSON.stringify(excludedIngredients)}`,
    );

    // For FatSecret recipes, ingredients array is often empty, so we need to analyze title and summary
    let textToAnalyze = recipeIngredients.join(' ').toLowerCase();
    if (recipeTitle) textToAnalyze += ' ' + recipeTitle.toLowerCase();
    if (recipeSummary) textToAnalyze += ' ' + recipeSummary.toLowerCase();

    console.log(
      `[RecipeFilter] Text to analyze: "${textToAnalyze.substring(0, 100)}..."`,
    );

    // Check dietary restrictions
    for (const restriction of dietaryRestrictions) {
      console.log(`[RecipeFilter] Checking restriction: ${restriction.name}`);

      // Check both ingredients array and recipe text
      const conflictingFromIngredients = recipeIngredients.filter(ingredient =>
        excludedIngredients.some(excluded =>
          ingredient.toLowerCase().includes(excluded.toLowerCase()),
        ),
      );

      // Check recipe title and summary for excluded ingredients
      const conflictingFromText = excludedIngredients.filter(excluded =>
        textToAnalyze.includes(excluded.toLowerCase()),
      );

      const allConflicting = [
        ...conflictingFromIngredients,
        ...conflictingFromText,
      ];

      console.log(
        `[RecipeFilter] Found ${allConflicting.length} conflicts for ${restriction.name}: ${JSON.stringify(allConflicting)}`,
      );

      if (allConflicting.length > 0) {
        conflicts.push({
          type: 'dietary',
          restriction: restriction.name,
          conflictingIngredients: allConflicting,
        });
      }
    }

    // Check allergies (prioritize by severity)
    const allTriggers = [
      ...triggerIngredients.severe,
      ...triggerIngredients.moderate,
      ...triggerIngredients.mild,
    ];
    const conflictingAllergies = recipeIngredients.filter(ingredient =>
      allTriggers.some(trigger =>
        ingredient.toLowerCase().includes(trigger.toLowerCase()),
      ),
    );

    if (conflictingAllergies.length > 0) {
      conflicts.push({
        type: 'allergy',
        restriction: 'Food Allergies',
        conflictingIngredients: conflictingAllergies,
      });
    }

    return {
      recipeId: '', // Will be set by caller
      isCompatible: conflicts.length === 0,
      conflicts,
    };
  }

  static async filterRecipes(
    userId: string,
    recipes: Array<{id: string; ingredients: string[]}>,
  ): Promise<FilteredRecipe[]> {
    const results: FilteredRecipe[] = [];

    for (const recipe of recipes) {
      const analysis = await this.analyzeRecipe(userId, recipe.ingredients);
      results.push({
        ...analysis,
        recipeId: recipe.id,
      });
    }

    return results;
  }
}
