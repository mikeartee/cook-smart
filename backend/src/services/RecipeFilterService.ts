import { DietaryRestrictionModel } from '../models/DietaryRestriction';
import { AllergyModel } from '../models/Allergy';

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
  static async analyzeRecipe(userId: string, recipeIngredients: string[]): Promise<FilteredRecipe> {
    const conflicts: RecipeConflict[] = [];
    
    // Get user's dietary restrictions and allergies
    const [dietaryRestrictions, _allergies, excludedIngredients, triggerIngredients] = await Promise.all([
      DietaryRestrictionModel.getUserRestrictions(userId),
      AllergyModel.getUserAllergies(userId),
      DietaryRestrictionModel.getAllUserExcludedIngredients(userId),
      AllergyModel.getAllUserTriggerIngredients(userId)
    ]);

    // Check dietary restrictions
    for (const restriction of dietaryRestrictions) {
      const conflicting = recipeIngredients.filter(ingredient => 
        excludedIngredients.some(excluded => 
          ingredient.toLowerCase().includes(excluded.toLowerCase())
        )
      );
      
      if (conflicting.length > 0) {
        conflicts.push({
          type: 'dietary',
          restriction: restriction.name,
          conflictingIngredients: conflicting
        });
      }
    }

    // Check allergies (prioritize by severity)
    const allTriggers = [...triggerIngredients.severe, ...triggerIngredients.moderate, ...triggerIngredients.mild];
    const conflictingAllergies = recipeIngredients.filter(ingredient =>
      allTriggers.some(trigger =>
        ingredient.toLowerCase().includes(trigger.toLowerCase())
      )
    );

    if (conflictingAllergies.length > 0) {
      conflicts.push({
        type: 'allergy',
        restriction: 'Food Allergies',
        conflictingIngredients: conflictingAllergies
      });
    }

    return {
      recipeId: '', // Will be set by caller
      isCompatible: conflicts.length === 0,
      conflicts
    };
  }

  static async filterRecipes(userId: string, recipes: Array<{id: string, ingredients: string[]}>): Promise<FilteredRecipe[]> {
    const results: FilteredRecipe[] = [];
    
    for (const recipe of recipes) {
      const analysis = await this.analyzeRecipe(userId, recipe.ingredients);
      results.push({
        ...analysis,
        recipeId: recipe.id
      });
    }
    
    return results;
  }
}
