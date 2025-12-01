/**
 * Push Notification Service - Firebase Cloud Messaging
 * Handles sending push notifications via Firebase Admin SDK
 */

import pool from '../config/database';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

function initializeFirebase(): void {
  if (firebaseInitialized) {
    return;
  }

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      console.warn(
        '⚠️  FIREBASE_SERVICE_ACCOUNT_PATH not set - push notifications disabled',
      );
      return;
    }

    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  }
}

// Initialize on module load
initializeFirebase();

export class PushNotificationService {
  /**
   * Register push notification token
   */
  static async registerToken(
    userId: string,
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
      console.log(`✅ Registered FCM token for user ${userId}`);
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  /**
   * Send notification to user
   */
  static async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    if (!firebaseInitialized) {
      console.warn('Firebase not initialized - skipping notification');
      return;
    }

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
        console.log(`No FCM tokens found for user ${userId}`);
        return;
      }

      // Send to each token
      const sendPromises = tokens.rows.map((row: any) =>
        this.sendFCMNotification(row.token, row.platform, title, body, data),
      );

      await Promise.all(sendPromises);

      // Log notification
      await pool.query(
        `INSERT INTO notification_history (user_id, notification_type, title, body)
         VALUES ($1, $2, $3, $4)`,
        [userId, data?.type || 'general', title, body],
      );

      console.log(`✅ Sent notification to user ${userId}: ${title}`);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   */
  private static async sendFCMNotification(
    token: string,
    platform: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: data ? JSON.parse(JSON.stringify(data)) : {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ FCM notification sent successfully: ${response}`);
    } catch (error: any) {
      // Handle invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        console.log(`🗑️  Removing invalid token: ${token}`);
        await this.removeInvalidToken(token);
      } else {
        console.error('Error sending FCM notification:', error);
      }
    }
  }

  /**
   * Remove invalid token from database
   */
  private static async removeInvalidToken(token: string): Promise<void> {
    try {
      await pool.query(
        'DELETE FROM push_notification_tokens WHERE token = $1',
        [token],
      );
    } catch (error) {
      console.error('Error removing invalid token:', error);
    }
  }

  /**
   * Send expiry alert
   */
  static async sendExpiryAlert(
    userId: string,
    expiringCount: number,
  ): Promise<void> {
    const title = '⏰ Ingredients Expiring Soon!';
    const body = `${expiringCount} ingredient${expiringCount > 1 ? 's' : ''} expiring in the next 3 days`;

    await this.sendNotification(userId, title, body, {
      type: 'expiry_alert',
      count: expiringCount.toString(),
    });
  }

  /**
   * Send recipe suggestion
   */
  static async sendRecipeSuggestion(
    userId: string,
    recipeName: string,
  ): Promise<void> {
    const title = '🍽️ New Recipe Match!';
    const body = `Try making ${recipeName} with your ingredients`;

    await this.sendNotification(userId, title, body, {
      type: 'recipe_suggestion',
      recipe: recipeName,
    });
  }

  /**
   * Send achievement notification
   */
  static async sendAchievementNotification(
    userId: string,
    achievementName: string,
    icon: string,
  ): Promise<void> {
    const title = `${icon} Achievement Unlocked!`;
    const body = `You earned: ${achievementName}`;

    await this.sendNotification(userId, title, body, {
      type: 'achievement',
      achievement: achievementName,
    });
  }

  /**
   * Send daily reminder
   */
  static async sendDailyReminder(userId: string): Promise<void> {
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
    userId: string,
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
  static async getPreferences(userId: string) {
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

  /**
   * Send test notification (for debugging)
   */
  static async sendTestNotification(userId: string): Promise<boolean> {
    try {
      await this.sendNotification(
        userId,
        '🧪 Test Notification',
        'If you see this, notifications are working!',
        {type: 'test'},
      );
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }
}
