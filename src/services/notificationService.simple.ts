/**
 * Simplified Notification Service
 * This version manages notification preferences without requiring Firebase/Expo setup
 * Push notifications can be added later when Firebase is configured
 */

import api from './api';

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
      await api.post('/notifications/register', {
        token,
        platform: 'android', // or detect Platform.OS
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
    // For now, return true to allow preference management
    // Later, check actual Firebase permission status
    return true;
  }
}

export default new NotificationService();
