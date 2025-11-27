/**
 * Simplified Notification Service
 * This version manages notification preferences without requiring Firebase/Expo setup
 * Push notifications can be added later when Firebase is configured
 */

import {API_BASE_URL, getAuthHeader} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPreferences {
  expiry_alerts: boolean;
  recipe_suggestions: boolean;
  achievement_notifications: boolean;
  daily_reminders: boolean;
}

class NotificationService {
  private notificationsEnabled = false;

  /**
   * Register for push notifications (placeholder for future Firebase integration)
   */
  async registerForPushNotifications(): Promise<string | null> {
    // TODO: Implement Firebase Cloud Messaging
    // For now, just mark as enabled
    this.notificationsEnabled = true;
    return 'placeholder-token';
  }

  /**
   * Register token with backend (placeholder)
   */
  async registerToken(token: string): Promise<void> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return;

      await fetch(`${API_BASE_URL}/api/v1/notifications/register`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(authToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({token, platform: 'android'}),
      });
    } catch (error) {
      console.error('Failed to register notification token:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences | null> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return null;

      const response = await fetch(
        `${API_BASE_URL}/api/v1/notifications/preferences`,
        {
          headers: getAuthHeader(authToken),
        },
      );
      return await response.json();
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    preferences: Partial<NotificationPreferences>,
  ): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('auth_token');
      if (!authToken) return false;

      await fetch(`${API_BASE_URL}/api/v1/notifications/preferences`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(authToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    // For now, return true to allow preference management
    // Later, check actual Firebase permission status
    return true;
  }
}

export default new NotificationService();
