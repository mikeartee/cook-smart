import {Platform} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import {API_BASE_URL, getAuthHeader} from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      console.log('🔔 Step 1: Requesting permission...');

      // Request permission
      const authStatus = await messaging().requestPermission();
      console.log('🔔 Step 2: Auth status received:', authStatus);

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('🔔 Step 3: Enabled?', enabled);

      if (!enabled) {
        console.log('🔔 Permission denied');
        return null;
      }

      console.log('🔔 Step 4: Getting FCM token...');
      // Get FCM token
      const token = await messaging().getToken();
      console.log('🔔 Step 5: Token received:', token ? 'YES' : 'NO');

      if (!token) {
        console.log('🔔 Failed to get token');
        return null;
      }

      // Register token with backend
      console.log('🔔 Step 6: Registering with backend...');
      await this.registerToken(token);
      console.log('🔔 Step 7: Complete!');

      return token;
    } catch (error) {
      console.error('🔔 ERROR:', error);
      return null;
    }
  }

  /**
   * Register token with backend
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
        body: JSON.stringify({token, platform: Platform.OS}),
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
    try {
      console.log('🔍 Checking notification permissions...');

      // Try to get a token - if we can get one, notifications are enabled
      try {
        const token = await messaging().getToken();
        console.log(
          '🔑 FCM Token check:',
          token ? 'GOT TOKEN - ENABLED' : 'NO TOKEN - DISABLED',
        );

        if (token) {
          // We have a token, so notifications ARE enabled
          await this.registerToken(token);
          return true;
        }
      } catch (tokenError) {
        console.log('❌ Cannot get token:', tokenError);
      }

      // If we couldn't get a token, check permission status
      const authStatus = await messaging().hasPermission();
      console.log('📱 Firebase auth status:', authStatus);

      const isEnabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log('✅ Final result - Notifications enabled:', isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('Failed to check notification status:', error);
      return false;
    }
  }
}

export default new NotificationService();
