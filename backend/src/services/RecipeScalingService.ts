/**
 * Recipe Scaling Service
 *
 * Handles scaling recipes up or down based on desired servings.
 * Adjusts ingredients, nutrition, and cooking times proportionally.
 */

export interface ScaledIngredient {
  name: string;
  amount: number;
  unit: string;
  originalAmount: number;
  scaleFactor: number;
}

export interface ScaledRecipe {
  id: string;
  title: string;
  image: string;
  servings: number;
  originalServings: number;
  scaleFactor: number;
  readyInMinutes: number;
  sourceUrl: string;
  summary: string;
  ingredients: any[]; // Keep flexible to support both string[] and ScaledIngredient[]
  scaledIngredients?: ScaledIngredient[]; // Detailed scaling info
  instructions: string;
  cuisines: string[];
  dishTypes: string[];
  diets: string[];
  provider: string;

  // Scaled nutrition
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;

  // Original nutrition (for reference)
  originalNutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };

  likes: number;

  // Dietary fields (preserved from original)
  dietaryStatus?: 'safe' | 'warning' | 'conflict';
  dietaryIssues?: {
    restrictions: string[];
    allergies: string[];
  };
  substitutions?: any[];
  modifiedTitle?: string;

  // Matching fields (preserved from original)
  matchPercentage?: number;
  usedIngredientCount?: number;
  usedIngredients?: string[];
  missedIngredients?: string[];
}

export class RecipeScalingService {
  /**
   * Scale a recipe to a different number of servings
   */
  static scaleRecipe(recipe: any, targetServings: number): ScaledRecipe {
    const originalServings = recipe.servings || 4;
    const scaleFactor = targetServings / originalServings;

    console.log(
      `[RecipeScaling] Scaling recipe "${recipe.title}" from ${originalServings} to ${targetServings} servings (factor: ${scaleFactor})`,
    );

    // Scale ingredients
    const scaledIngredients = this.scaleIngredients(
      recipe.ingredients || [],
      scaleFactor,
    );

    // Scale nutrition
    const scaledNutrition = this.scaleNutrition(recipe, scaleFactor);

    // Adjust cooking time (minimal adjustment for scaling)
    const adjustedCookingTime = this.adjustCookingTime(
      recipe.readyInMinutes || 30,
      scaleFactor,
    );

    return {
      ...recipe, // Preserve all original fields
      servings: targetServings,
      originalServings,
      scaleFactor,
      readyInMinutes: adjustedCookingTime,
      ingredients: recipe.ingredients, // Keep original ingredients format for compatibility
      scaledIngredients, // Add detailed scaling info separately

      // Scaled nutrition
      calories: scaledNutrition.calories,
      protein: scaledNutrition.protein,
      carbs: scaledNutrition.carbs,
      fat: scaledNutrition.fat,

      // Original nutrition for reference
      originalNutrition: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
      },
    };
  }

  /**
   * Scale ingredient amounts
   */
  private static scaleIngredients(
    ingredients: any[],
    scaleFactor: number,
  ): ScaledIngredient[] {
    return ingredients.map(ingredient => {
      const originalAmount = this.parseAmount(
        ingredient.amount || ingredient.quantity || 1,
      );
      const scaledAmount = this.roundToReasonableAmount(
        originalAmount * scaleFactor,
      );

      return {
        name:
          ingredient.name ||
          ingredient.ingredient_description ||
          'Unknown ingredient',
        amount: scaledAmount,
        unit: ingredient.unit || ingredient.measurement_description || '',
        originalAmount,
        scaleFactor,
      };
    });
  }

  /**
   * Scale nutrition values
   */
  private static scaleNutrition(recipe: any, scaleFactor: number) {
    return {
      calories: recipe.calories
        ? Math.round(recipe.calories * scaleFactor)
        : undefined,
      protein: recipe.protein
        ? Math.round(recipe.protein * scaleFactor * 10) / 10
        : undefined,
      carbs: recipe.carbs
        ? Math.round(recipe.carbs * scaleFactor * 10) / 10
        : undefined,
      fat: recipe.fat
        ? Math.round(recipe.fat * scaleFactor * 10) / 10
        : undefined,
    };
  }

  /**
   * Adjust cooking time based on serving size
   * Cooking time doesn't scale linearly, so we make minimal adjustments
   */
  private static adjustCookingTime(
    originalTime: number,
    scaleFactor: number,
  ): number {
    // For very small portions (< 0.5x), reduce time slightly
    if (scaleFactor < 0.5) {
      return Math.round(originalTime * 0.9);
    }

    // For large portions (> 3x), increase time slightly
    if (scaleFactor > 3) {
      return Math.round(originalTime * 1.2);
    }

    // For normal scaling (0.5x - 3x), keep original time
    return originalTime;
  }

  /**
   * Parse amount from various formats
   */
  private static parseAmount(amount: any): number {
    if (typeof amount === 'number') {
      return amount;
    }

    if (typeof amount === 'string') {
      // Handle fractions like "1/2", "3/4"
      if (amount.includes('/')) {
        const parts = amount.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0]);
          const denominator = parseFloat(parts[1]);
          if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return numerator / denominator;
          }
        }
      }

      // Handle mixed numbers like "1 1/2"
      const mixedMatch = amount.match(/(\d+)\s+(\d+)\/(\d+)/);
      if (mixedMatch) {
        const whole = parseFloat(mixedMatch[1]);
        const numerator = parseFloat(mixedMatch[2]);
        const denominator = parseFloat(mixedMatch[3]);
        if (
          !isNaN(whole) &&
          !isNaN(numerator) &&
          !isNaN(denominator) &&
          denominator !== 0
        ) {
          return whole + numerator / denominator;
        }
      }

      // Handle regular numbers
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    // Default fallback
    return 1;
  }

  /**
   * Round amounts to reasonable precision for cooking
   */
  private static roundToReasonableAmount(amount: number): number {
    // For very small amounts (< 0.1), round to 2 decimal places
    if (amount < 0.1) {
      return Math.round(amount * 100) / 100;
    }

    // For small amounts (< 1), round to 1 decimal place
    if (amount < 1) {
      return Math.round(amount * 10) / 10;
    }

    // For medium amounts (1-10), round to nearest 0.25
    if (amount < 10) {
      return Math.round(amount * 4) / 4;
    }

    // For large amounts (>= 10), round to nearest 0.5
    return Math.round(amount * 2) / 2;
  }

  /**
   * Get common serving size options for a recipe
   */
  static getServingSizeOptions(originalServings: number): number[] {
    const options = [1, 2, 4, 6, 8, 12];

    // Always include the original serving size
    if (!options.includes(originalServings)) {
      options.push(originalServings);
      options.sort((a, b) => a - b);
    }

    return options;
  }

  /**
   * Validate serving size input
   */
  static validateServingSize(servings: any): {
    isValid: boolean;
    servings?: number;
    error?: string;
  } {
    const parsed = parseInt(servings);

    if (isNaN(parsed)) {
      return {isValid: false, error: 'Servings must be a number'};
    }

    if (parsed < 1) {
      return {isValid: false, error: 'Servings must be at least 1'};
    }

    if (parsed > 50) {
      return {isValid: false, error: 'Servings cannot exceed 50'};
    }

    return {isValid: true, servings: parsed};
  }
}
