import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import api from './api';

export interface NotificationPreferences {
  expiry_alerts: boolean;
  recipe_suggestions: boolean;
  achievement_notifications: boolean;
  daily_reminders: boolean;
}

class NotificationService {
  /**
   * Request notification permissions and register token
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Request permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();

      // Register token with backend
      await this.registerToken(token);

      return token;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  async registerToken(token: string): Promise<void> {
    try {
      await api.post('/notifications/register', {
        token,
        platform: Platform.OS,
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
      const response = await api.get('/notifications/preferences');
      return response.data;
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
      await api.put('/notifications/preferences', preferences);
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
    const authStatus = await messaging().hasPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }
}

export default new NotificationService();
