import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL} from '../config/api';

const API_URL = `${API_BASE_URL}/api/v1`;

class AdvancedRecipeService {
  private async getAuthHeader() {
    const token = await AsyncStorage.getItem('userToken');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async addNutrition(recipeId: string, nutrition: any) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/nutrition/${recipeId}`,
      {
        method: 'POST',
        headers: await this.getAuthHeader(),
        body: JSON.stringify(nutrition),
      },
    );
    return response.json();
  }

  async getNutrition(recipeId: string) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/nutrition/${recipeId}`,
    );
    return response.json();
  }

  async addTimer(
    recipeId: string,
    stepNumber: number,
    durationMinutes: number,
    label?: string,
  ) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/timers/${recipeId}`,
      {
        method: 'POST',
        headers: await this.getAuthHeader(),
        body: JSON.stringify({stepNumber, durationMinutes, label}),
      },
    );
    return response.json();
  }

  async getTimers(recipeId: string) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/timers/${recipeId}`,
    );
    return response.json();
  }

  async startCookingSession(recipeId: string) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/cooking-session/start`,
      {
        method: 'POST',
        headers: await this.getAuthHeader(),
        body: JSON.stringify({recipeId}),
      },
    );
    return response.json();
  }

  async updateCookingSession(
    sessionId: number,
    currentStep: number,
    status?: string,
  ) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/cooking-session/${sessionId}`,
      {
        method: 'PUT',
        headers: await this.getAuthHeader(),
        body: JSON.stringify({currentStep, status}),
      },
    );
    return response.json();
  }

  async completeCookingSession(sessionId: number) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/cooking-session/${sessionId}/complete`,
      {
        method: 'POST',
        headers: await this.getAuthHeader(),
      },
    );
    return response.json();
  }

  async getCookingSession(recipeId: string) {
    const response = await fetch(
      `${API_URL}/advanced-recipes/cooking-session/${recipeId}`,
      {
        headers: await this.getAuthHeader(),
      },
    );
    return response.json();
  }

  async searchByTags(tags: string[], tagType?: string) {
    const response = await fetch(`${API_URL}/advanced-recipes/search-by-tags`, {
      method: 'POST',
      headers: await this.getAuthHeader(),
      body: JSON.stringify({tags, tagType}),
    });
    return response.json();
  }

  async getSeasonalRecipes(season: string, limit = 20) {
    const response = await fetch(
      `${API_URL}/seasonal-recipes?season=${season}&limit=${limit}`,
    );
    return response.json();
  }

  async getCurrentSeasonalRecipes(limit = 20) {
    const response = await fetch(`${API_URL}/seasonal/current?limit=${limit}`);
    return response.json();
  }
}

export default new AdvancedRecipeService();
