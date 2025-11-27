import {API_BASE_URL, getAuthHeader} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserRecipeIngredient {
  name: string;
  quantity?: string;
  unit?: string;
}

export interface UserRecipe {
  id: number;
  userId: string;
  title: string;
  description?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  isPublic: boolean;
  views: number;
  favorites: number;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface UserRecipeWithDetails extends UserRecipe {
  ingredients: Array<{
    id: number;
    name: string;
    quantity?: string;
    unit?: string;
    sortOrder: number;
  }>;
  instructions: Array<{
    id: number;
    stepNumber: number;
    instruction: string;
  }>;
}

export interface CreateRecipeData {
  title: string;
  description?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  isPublic?: boolean;
  ingredients: UserRecipeIngredient[];
  instructions: string[];
}

export const createUserRecipe = async (data: any) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/v1/user-recipes`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create recipe');
  return response.json();
};

export const uploadPhoto = async (
  photo: string,
  entityType: string,
  entityId?: number,
) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/v1/photos/upload`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({photo, entityType, entityId}),
  });

  if (!response.ok) throw new Error('Failed to upload photo');
  const data = await response.json();
  return data.photoUrl;
};

export const getUserRecipes = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/user-recipes/my-recipes`,
    {
      headers: getAuthHeader(token),
    },
  );

  if (!response.ok) throw new Error('Failed to get recipes');
  const data = await response.json();
  return data.recipes;
};

export const userRecipeService = {
  async createRecipe(data: CreateRecipeData): Promise<UserRecipeWithDetails> {
    return createUserRecipe(data);
  },

  async getUserRecipes(): Promise<UserRecipe[]> {
    const token = await getAuthToken();
    const response = await axios.get(`${API_ENDPOINTS.userRecipes.base}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data.recipes;
  },

  async getRecipeById(recipeId: number): Promise<UserRecipeWithDetails> {
    const token = await getAuthToken();
    const response = await axios.get(
      `${API_ENDPOINTS.userRecipes.byId(recipeId)}`,
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );
    return response.data.recipe;
  },

  async updateRecipe(
    recipeId: number,
    updates: Partial<UserRecipe>,
  ): Promise<UserRecipe> {
    const token = await getAuthToken();
    const response = await axios.put(
      `${API_ENDPOINTS.userRecipes.byId(recipeId)}`,
      updates,
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );
    return response.data.recipe;
  },

  async deleteRecipe(recipeId: number): Promise<void> {
    const token = await getAuthToken();
    await axios.delete(`${API_ENDPOINTS.userRecipes.byId(recipeId)}`, {
      headers: {Authorization: `Bearer ${token}`},
    });
  },

  async getPublicRecipes(
    limit: number = 20,
    offset: number = 0,
  ): Promise<UserRecipe[]> {
    const response = await axios.get(
      `${API_ENDPOINTS.userRecipes.public}?limit=${limit}&offset=${offset}`,
    );
    return response.data.recipes;
  },

  async toggleFavorite(recipeId: number): Promise<boolean> {
    const token = await getAuthToken();
    const response = await axios.post(
      `${API_ENDPOINTS.userRecipes.favorite(recipeId)}`,
      {},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );
    return response.data.isFavorited;
  },
};
