import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';

export interface Recipe {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: MissedIngredient[];
  usedIngredients: UsedIngredient[];
  likes: number;
  provider?: string;
}

export interface MissedIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  image: string;
}

export interface UsedIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  image: string;
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
  instructions: string;
  ingredients?: string[]; // For TheMealDB format
  extendedIngredients?: ExtendedIngredient[]; // For Edamam format
  analyzedInstructions?: AnalyzedInstruction[]; // For Edamam format
  provider?: string;
}

export interface ExtendedIngredient {
  id: number;
  name: string;
  amount: number;
  unit: string;
  original: string;
}

export interface AnalyzedInstruction {
  name: string;
  steps: InstructionStep[];
}

export interface InstructionStep {
  number: number;
  step: string;
}

export interface SavedRecipe {
  recipe: RecipeDetails;
  savedAt: string;
}

class RecipeService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }
    return token;
  }

  // Search recipes by ingredients
  async searchByIngredients(ingredients: string[]): Promise<Recipe[]> {
    const token = await this.getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/recipes/search?ingredients=${ingredients.join(',')}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search recipes');
    }

    return data.recipes || [];
  }

  // Get recipe details
  async getRecipeDetails(recipeId: number): Promise<RecipeDetails> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/recipes/${recipeId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch recipe details');
    }

    return data.recipe;
  }

  // Save recipe locally
  async saveRecipe(recipe: RecipeDetails): Promise<void> {
    const savedRecipes = await this.getSavedRecipes();

    // Check if already saved
    if (savedRecipes.some(r => r.recipe.id === recipe.id)) {
      throw new Error('Recipe already saved');
    }

    const savedRecipe: SavedRecipe = {
      recipe,
      savedAt: new Date().toISOString(),
    };

    savedRecipes.push(savedRecipe);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(savedRecipes));
  }

  // Get all saved recipes
  async getSavedRecipes(): Promise<SavedRecipe[]> {
    const data = await AsyncStorage.getItem('saved_recipes');
    return data ? JSON.parse(data) : [];
  }

  // Delete saved recipe
  async deleteSavedRecipe(recipeId: number): Promise<void> {
    const savedRecipes = await this.getSavedRecipes();
    const filtered = savedRecipes.filter(r => r.recipe.id !== recipeId);
    await AsyncStorage.setItem('saved_recipes', JSON.stringify(filtered));
  }

  // Check if recipe is saved
  async isRecipeSaved(recipeId: number): Promise<boolean> {
    const savedRecipes = await this.getSavedRecipes();
    return savedRecipes.some(r => r.recipe.id === recipeId);
  }
}

export default new RecipeService();
