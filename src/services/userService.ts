import {API_BASE_URL} from '../config/api';
import {getAuthToken} from '../utils/auth';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  dietaryRestrictions?: string[];
  allergies?: string[];
  showNutrition?: boolean;
  preferredUnits?: string;
}

export interface UserStats {
  totalRecipes: number;
  totalFavorites: number;
  totalRatings: number;
  averageRating: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalPoints: number;
  level: number;
  rank?: number;
}

class UserService {
  // Get current user profile
  async getCurrentUser(): Promise<UserProfile> {
    try {
      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user profile');
      }

      return {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        username: data.user.email?.split('@')[0] || 'user',
        dietaryRestrictions: data.user.dietary_restrictions,
        allergies: data.user.allergies,
        showNutrition: data.user.show_nutrition,
        preferredUnits: data.user.preferred_units,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Get leaderboard
  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const token = await getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/api/v1/points/leaderboard?limit=${limit}`,
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
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }

      return data.map((entry: any, index: number) => ({
        userId: entry.user_id,
        username: entry.username || entry.email?.split('@')[0] || 'user',
        totalPoints: entry.total_points,
        level: entry.level,
        rank: index + 1,
      }));
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

  // Get user stats (placeholder - would need backend endpoint)
  async getUserStats(): Promise<UserStats> {
    // TODO: Implement when backend endpoint is available
    return {
      totalRecipes: 0,
      totalFavorites: 0,
      totalRatings: 0,
      averageRating: 0,
    };
  }
}

export const userService = new UserService();
