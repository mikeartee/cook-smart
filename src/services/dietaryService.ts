import {API_BASE_URL} from '../config/api';
import {getAuthToken} from '../utils/auth';

export interface DietaryRestriction {
  id: number;
  name: string;
  category: string;
  description?: string;
  excluded_ingredients: string[];
  excluded_tags: string[];
}

export interface Allergy {
  id: number;
  name: string;
  severity: string;
  description?: string;
  trigger_ingredients: string[];
  cross_reactive_ingredients: string[];
}

export interface UserDietaryPreferences {
  dietary_restrictions: number[];
  allergies: number[];
  custom_diets: string[];
  custom_allergies: string[];
}

class DietaryService {
  // Get all available dietary restrictions
  async getAllRestrictions(): Promise<DietaryRestriction[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/dietary/restrictions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dietary restrictions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching dietary restrictions:', error);
      throw error;
    }
  }

  // Get all available allergies
  async getAllAllergies(): Promise<Allergy[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/dietary/allergies`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch allergies');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching allergies:', error);
      throw error;
    }
  }

  // Get user's selected dietary restrictions
  async getUserRestrictions(userId: string): Promise<DietaryRestriction[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/restrictions/user/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user restrictions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user restrictions:', error);
      throw error;
    }
  }

  // Get user's selected allergies
  async getUserAllergies(userId: string): Promise<Allergy[]> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/allergies/user/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user allergies');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user allergies:', error);
      throw error;
    }
  }

  // Add dietary restriction for user
  async addUserRestriction(userId: string, restrictionId: number, notes?: string): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/restrictions/user/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({restrictionId, notes}),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add dietary restriction');
      }
    } catch (error) {
      console.error('Error adding dietary restriction:', error);
      throw error;
    }
  }

  // Add allergy for user
  async addUserAllergy(
    userId: string,
    allergyId: number,
    severityOverride?: string,
    notes?: string,
  ): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/allergies/user/${userId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({allergyId, severityOverride, notes}),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to add allergy');
      }
    } catch (error) {
      console.error('Error adding allergy:', error);
      throw error;
    }
  }

  // Remove dietary restriction
  async removeUserRestriction(userId: string, restrictionId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/restrictions/user/${userId}/${restrictionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to remove dietary restriction');
      }
    } catch (error) {
      console.error('Error removing dietary restriction:', error);
      throw error;
    }
  }

  // Remove allergy
  async removeUserAllergy(userId: string, allergyId: number): Promise<void> {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dietary/allergies/user/${userId}/${allergyId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to remove allergy');
      }
    } catch (error) {
      console.error('Error removing allergy:', error);
      throw error;
    }
  }
}

export const dietaryService = new DietaryService();
