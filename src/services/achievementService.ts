import {API_BASE_URL, getAuthHeader} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: number;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_at: string;
  progress?: number;
  target?: number;
}

class AchievementService {
  async getUserAchievements(): Promise<Achievement[]> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return [];

      const response = await fetch(`${API_BASE_URL}/api/v1/achievements`, {
        headers: getAuthHeader(authToken),
      });
      const data = await response.json();
      return data.achievements || [];
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  async getAchievementProgress(): Promise<any> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return null;

      const response = await fetch(
        `${API_BASE_URL}/api/v1/achievements/progress`,
        {
          headers: getAuthHeader(authToken),
        },
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to get achievement progress:', error);
      return null;
    }
  }
}

export default new AchievementService();
