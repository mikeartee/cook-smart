export interface IngredientSubstitution {
  original: string;
  substitutes: Array<{
    ingredient: string;
    ratio: string;
    notes?: string;
  }>;
  reason: 'dietary' | 'allergy' | 'availability';
}

export class IngredientSubstitutionService {
  private static substitutions: Record<string, Array<{ingredient: string, ratio: string, notes?: string}>> = {
    // Meat substitutions
    'beef': [
      { ingredient: 'mushrooms', ratio: '1:1', notes: 'Use portobello for texture' },
      { ingredient: 'lentils', ratio: '1:1', notes: 'Cooked brown lentils' },
      { ingredient: 'tofu', ratio: '1:1', notes: 'Extra firm, pressed' }
    ],
    'chicken': [
      { ingredient: 'cauliflower', ratio: '1:1', notes: 'Cut into chunks' },
      { ingredient: 'tofu', ratio: '1:1', notes: 'Extra firm' },
      { ingredient: 'chickpeas', ratio: '1:1', notes: 'Cooked or canned' }
    ],
    'pork': [
      { ingredient: 'jackfruit', ratio: '1:1', notes: 'Young green jackfruit' },
      { ingredient: 'mushrooms', ratio: '1:1', notes: 'King oyster mushrooms' }
    ],
    
    // Dairy substitutions
    'milk': [
      { ingredient: 'almond milk', ratio: '1:1' },
      { ingredient: 'oat milk', ratio: '1:1' },
      { ingredient: 'coconut milk', ratio: '1:1' }
    ],
    'butter': [
      { ingredient: 'coconut oil', ratio: '1:1', notes: 'Solid at room temp' },
      { ingredient: 'olive oil', ratio: '3:4', notes: 'For cooking only' }
    ],
    'cheese': [
      { ingredient: 'nutritional yeast', ratio: '1:4', notes: 'For flavor only' },
      { ingredient: 'cashew cream', ratio: '1:1', notes: 'Soaked cashews blended' }
    ],
    
    // Egg substitutions
    'eggs': [
      { ingredient: 'flax eggs', ratio: '1:1', notes: '1 tbsp ground flax + 3 tbsp water per egg' },
      { ingredient: 'applesauce', ratio: '1:1', notes: '1/4 cup per egg, for baking' }
    ],
    
    // Nut substitutions
    'peanuts': [
      { ingredient: 'sunflower seeds', ratio: '1:1' },
      { ingredient: 'pumpkin seeds', ratio: '1:1' }
    ],
    'almonds': [
      { ingredient: 'sunflower seeds', ratio: '1:1' },
      { ingredient: 'pumpkin seeds', ratio: '1:1' }
    ],
    
    // Gluten substitutions
    'wheat flour': [
      { ingredient: 'rice flour', ratio: '1:1', notes: 'Add xanthan gum' },
      { ingredient: 'almond flour', ratio: '1:1', notes: 'For baking' }
    ]
  };

  static getSubstitutions(conflictingIngredients: string[], reason: 'dietary' | 'allergy' | 'availability'): IngredientSubstitution[] {
    const substitutions: IngredientSubstitution[] = [];
    
    for (const ingredient of conflictingIngredients) {
      const lowerIngredient = ingredient.toLowerCase();
      
      // Find matching substitution
      for (const [key, subs] of Object.entries(this.substitutions)) {
        if (lowerIngredient.includes(key)) {
          substitutions.push({
            original: ingredient,
            substitutes: subs,
            reason
          });
          break;
        }
      }
    }
    
    return substitutions;
  }

  static addCustomSubstitution(original: string, substitute: string, ratio: string, notes?: string): void {
    const key = original.toLowerCase();
    if (!this.substitutions[key]) {
      this.substitutions[key] = [];
    }
    this.substitutions[key].push({ ingredient: substitute, ratio, ...(notes && { notes }) });
  }
}
