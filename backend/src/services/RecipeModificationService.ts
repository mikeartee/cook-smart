import { RecipeFilterService, RecipeConflict } from './RecipeFilterService';
import { IngredientSubstitutionService, IngredientSubstitution } from './IngredientSubstitutionService';

export interface RecipeModification {
  recipeId: string;
  originalIngredients: string[];
  modifiedIngredients: string[];
  substitutions: IngredientSubstitution[];
  difficultyIncrease: 'none' | 'low' | 'medium' | 'high';
  notes: string[];
}

export class RecipeModificationService {
  static async generateModifications(userId: string, recipeId: string, ingredients: string[]): Promise<RecipeModification> {
    // Analyze recipe for conflicts
    const analysis = await RecipeFilterService.analyzeRecipe(userId, ingredients);
    
    if (analysis.isCompatible) {
      return {
        recipeId,
        originalIngredients: ingredients,
        modifiedIngredients: ingredients,
        substitutions: [],
        difficultyIncrease: 'none',
        notes: ['Recipe is already compatible with your dietary preferences']
      };
    }

    // Get substitutions for conflicting ingredients
    const allConflictingIngredients = analysis.conflicts.flatMap(c => c.conflictingIngredients);
    const substitutions = IngredientSubstitutionService.getSubstitutions(
      allConflictingIngredients, 
      analysis.conflicts[0]?.type === 'allergy' ? 'allergy' : 'dietary'
    );

    // Generate modified ingredient list
    const modifiedIngredients = ingredients.map(ingredient => {
      const substitution = substitutions.find(s => s.original === ingredient);
      if (substitution && substitution.substitutes.length > 0) {
        const bestSub = substitution.substitutes[0];
        if (bestSub) {
          return `${bestSub.ingredient} (${bestSub.ratio} ratio)`;
        }
      }
      return ingredient;
    });

    // Calculate difficulty increase
    const difficultyIncrease = this.calculateDifficultyIncrease(substitutions);

    // Generate notes
    const notes = this.generateModificationNotes(analysis.conflicts, substitutions);

    return {
      recipeId,
      originalIngredients: ingredients,
      modifiedIngredients,
      substitutions,
      difficultyIncrease,
      notes
    };
  }

  private static calculateDifficultyIncrease(substitutions: IngredientSubstitution[]): 'none' | 'low' | 'medium' | 'high' {
    if (substitutions.length === 0) return 'none';
    if (substitutions.length <= 2) return 'low';
    if (substitutions.length <= 4) return 'medium';
    return 'high';
  }

  private static generateModificationNotes(conflicts: RecipeConflict[], substitutions: IngredientSubstitution[]): string[] {
    const notes: string[] = [];
    
    // Add conflict summary
    const allergyConflicts = conflicts.filter(c => c.type === 'allergy').length;
    const dietaryConflicts = conflicts.filter(c => c.type === 'dietary').length;
    
    if (allergyConflicts > 0) {
      notes.push(`⚠️ ${allergyConflicts} allergy conflict(s) resolved`);
    }
    if (dietaryConflicts > 0) {
      notes.push(`🥗 ${dietaryConflicts} dietary restriction(s) addressed`);
    }

    // Add substitution notes
    substitutions.forEach(sub => {
      const bestSub = sub.substitutes[0];
      if (bestSub && bestSub.notes) {
        notes.push(`💡 ${sub.original} → ${bestSub.ingredient}: ${bestSub.notes}`);
      }
    });

    return notes;
  }
}
