import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export interface Ingredient {
  id: number;
  ingredient_id?: number;
  ingredient_name?: string;
  name?: string;
  category: string;
  quantity?: number;
  unit?: string;
  expiration_date?: string;
  added_at: string;
}

export interface CreateIngredientDto {
  ingredientId?: number;
  customName?: string;
  category?: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
}

export interface UpdateIngredientDto {
  quantity?: number;
  unit?: string;
  expirationDate?: string;
}

export interface GetIngredientsResponse {
  ingredients: Ingredient[];
  customIngredients: Ingredient[];
  total: number;
}

class IngredientService {
  private async getAuthToken(): Promise<string> {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }
    return token;
  }

  async getUserIngredients(): Promise<GetIngredientsResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/ingredients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch ingredients');
    }

    return data;
  }

  async addIngredient(ingredientData: CreateIngredientDto): Promise<Ingredient> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/ingredients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ingredientData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add ingredient');
    }

    // Handle both data.ingredient and direct ingredient response
    const ingredient = data.ingredient || data;
    
    if (!ingredient || !ingredient.id) {
      console.error('Invalid ingredient response:', data);
      throw new Error('Invalid response from server');
    }

    return ingredient;
  }

  async updateIngredient(id: number, updates: UpdateIngredientDto): Promise<Ingredient> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/ingredients/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update ingredient');
    }

    return data.ingredient;
  }

  async deleteIngredient(id: number): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/api/v1/ingredients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete ingredient');
    }
  }

  async searchIngredients(query: string): Promise<Ingredient[]> {
    const token = await this.getAuthToken();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/ingredients/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search ingredients');
    }

    return data.ingredients || [];
  }
}

export default new IngredientService();
