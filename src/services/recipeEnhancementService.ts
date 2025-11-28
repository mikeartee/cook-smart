import {API_BASE_URL, getAuthHeader} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const rateRecipe = async (
  recipeId: string,
  recipeType: 'api' | 'user',
  rating: number,
  review?: string,
) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/ratings`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({recipeId, recipeType, rating, review}),
    },
  );

  if (!response.ok) throw new Error('Failed to rate recipe');
  return response.json();
};

export const getRecipeRatings = async (
  recipeId: string,
  recipeType: 'api' | 'user',
) => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/ratings/${recipeId}/${recipeType}`,
  );
  if (!response.ok) throw new Error('Failed to get ratings');
  return response.json();
};

export const markRecipeCooked = async (
  recipeId: string,
  recipeType: 'api' | 'user',
  rating?: number,
) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/cooking-history`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({recipeId, recipeType, rating}),
    },
  );

  if (!response.ok) throw new Error('Failed to mark recipe cooked');
  return response.json();
};

export const addMealPlan = async (
  recipeId: string,
  recipeType: 'api' | 'user',
  plannedDate: string,
  mealType: string,
) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/meal-plans`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({recipeId, recipeType, plannedDate, mealType}),
    },
  );

  if (!response.ok) throw new Error('Failed to add meal plan');
  return response.json();
};

export const getMealPlans = async (startDate: string, endDate: string) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/meal-plans?startDate=${startDate}&endDate=${endDate}`,
    {
      headers: getAuthHeader(token),
    },
  );

  if (!response.ok) throw new Error('Failed to get meal plans');
  const data = await response.json();
  return data.mealPlans;
};

export const deleteMealPlan = async (mealPlanId: number) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/meal-plans/${mealPlanId}`,
    {
      method: 'DELETE',
      headers: getAuthHeader(token),
    },
  );

  if (!response.ok) throw new Error('Failed to delete meal plan');
  return response.json();
};

export const createCollection = async (name: string, icon?: string) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/collections`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name, icon}),
    },
  );

  if (!response.ok) throw new Error('Failed to create collection');
  return response.json();
};

export const getUserCollections = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/collections`,
    {
      headers: getAuthHeader(token),
    },
  );

  if (!response.ok) throw new Error('Failed to get collections');
  const data = await response.json();
  return data.collections;
};

export const addToCollection = async (
  collectionId: number,
  recipeId: string,
  recipeType: 'api' | 'user',
) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(
    `${API_BASE_URL}/api/v1/recipe-enhancements/collections/${collectionId}/recipes`,
    {
      method: 'POST',
      headers: {
        ...getAuthHeader(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({recipeId, recipeType}),
    },
  );

  if (!response.ok) throw new Error('Failed to add to collection');
  return response.json();
};
