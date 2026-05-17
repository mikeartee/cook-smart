/**
 * Push Notification Service
 * Handles sending push notifications to users
 */

import pool from '../config/database';
import {httpPost} from '../utils/httpClient';

export class PushNotificationService {
  /**
   * Register push notification token
   */
  static async registerToken(
    userId: number,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO push_notification_tokens (user_id, token, platform, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, token) 
         DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        [userId, token, platform],
      );
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Send notification to user
   */
  static async sendNotification(
    userId: number,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      // Check user preferences
      const prefs = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId],
      );

      if (prefs.rows.length === 0 || !prefs.rows[0].daily_reminders) {
        return; // User has disabled notifications
      }

      // Get user's push tokens
      const tokens = await pool.query(
        'SELECT token, platform FROM push_notification_tokens WHERE user_id = $1',
        [userId],
      );

      if (tokens.rows.length === 0) {
        return; // No tokens registered
      }

      // Send to each token
      for (const row of tokens.rows) {
        await this.sendPushNotification(
          row.token,
          row.platform,
          title,
          body,
          data,
        );
      }

      // Log notification
      await pool.query(
        `INSERT INTO notification_history (user_id, notification_type, title, body)
         VALUES ($1, $2, $3, $4)`,
        [userId, data?.type || 'general', title, body],
      );
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send push notification via Expo
   */
  private static async sendPushNotification(
    token: string,
    platform: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      // Using Expo Push Notifications (free for React Native)
      await httpPost('https://exp.host/--/api/v2/push/send', {
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Send expiry alert
   */
  static async sendExpiryAlert(
    userId: number,
    expiringCount: number,
  ): Promise<void> {
    const title = '⏰ Ingredients Expiring Soon!';
    const body = `${expiringCount} ingredient${expiringCount > 1 ? 's' : ''} expiring in the next 3 days`;

    await this.sendNotification(userId, title, body, {
      type: 'expiry_alert',
      count: expiringCount,
    });
  }

  /**
   * Send recipe suggestion
   */
  static async sendRecipeSuggestion(
    userId: number,
    recipeName: string,
  ): Promise<void> {
    const title = '🍽️ New Recipe Match!';
    const body = `Try making ${recipeName} with your ingredients`;

    await this.sendNotification(userId, title, body, {
      type: 'recipe_suggestion',
    });
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(
    userId: number,
    achievementName: string,
    icon: string,
  ): Promise<void> {
    const title = `${icon} Achievement Unlocked!`;
    const body = `You earned: ${achievementName}`;

    await this.sendNotification(userId, title, body, {
      type: 'achievement',
    });
  }

  /**
   * Send daily reminder
   */
  static async sendDailyReminder(userId: number): Promise<void> {
    const title = '👋 Time to Cook!';
    const body = "You haven't cooked in 3 days. Check out some easy recipes!";

    await this.sendNotification(userId, title, body, {
      type: 'daily_reminder',
    });
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: number,
    preferences: {
      expiry_alerts?: boolean;
      recipe_suggestions?: boolean;
      achievement_notifications?: boolean;
      daily_reminders?: boolean;
    },
  ): Promise<void> {
    try {
      const fields = Object.keys(preferences)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const values = [userId, ...Object.values(preferences)];

      await pool.query(
        `INSERT INTO notification_preferences (user_id, ${Object.keys(preferences).join(', ')})
         VALUES ($1, ${Object.keys(preferences)
           .map((_, i) => `$${i + 2}`)
           .join(', ')})
         ON CONFLICT (user_id) 
         DO UPDATE SET ${fields}, updated_at = CURRENT_TIMESTAMP`,
        values,
      );
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(userId: number) {
    try {
      const result = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = $1',
        [userId],
      );

      if (result.rows.length === 0) {
        // Return defaults
        return {
          expiry_alerts: true,
          recipe_suggestions: true,
          achievement_notifications: true,
          daily_reminders: true,
        };
      }

      return result.rows[0];
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }
}
