import api from './api';

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
      const response = await api.get('/achievements');
      return response.data.achievements || [];
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  async getAchievementProgress(): Promise<any> {
    try {
      const response = await api.get('/achievements/progress');
      return response.data;
    } catch (error) {
      console.error('Failed to get achievement progress:', error);
      return null;
    }
  }
}

export default new AchievementService();
