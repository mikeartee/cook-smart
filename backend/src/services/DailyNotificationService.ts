/**
 * Daily Notification Service
 * Runs daily checks and sends notifications
 */

import pool from '../config/database';
import {PushNotificationService} from './PushNotificationService';
import cron from 'node-cron';

export class DailyNotificationService {
  /**
   * Start daily notification checks
   */
  static startDailyChecks(): void {
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('🔔 Running daily notification checks...');
      await this.checkExpiringIngredients();
      await this.checkInactiveUsers();
    });

    console.log('📅 Daily notification service started');
  }

  /**
   * Check for expiring ingredients and send alerts
   */
  static async checkExpiringIngredients(): Promise<void> {
    try {
      // Get users with ingredients expiring in next 3 days
      const result = await pool.query(`
        SELECT 
          ui.user_id,
          COUNT(*) as expiring_count
        FROM user_ingredients ui
        WHERE ui.expiration_date IS NOT NULL
          AND ui.expiration_date <= CURRENT_DATE + INTERVAL '3 days'
          AND ui.expiration_date >= CURRENT_DATE
        GROUP BY ui.user_id
        HAVING COUNT(*) > 0
      `);

      console.log(
        `📦 Found ${result.rows.length} users with expiring ingredients`,
      );

      for (const row of result.rows) {
        await PushNotificationService.sendExpiryAlert(
          row.user_id,
          parseInt(row.expiring_count),
        );
      }
    } catch (error) {
      console.error('Error checking expiring ingredients:', error);
    }
  }

  /**
   * Check for inactive users and send reminders
   */
  static async checkInactiveUsers(): Promise<void> {
    try {
      // Get users who haven't logged in for 3 days
      const result = await pool.query(`
        SELECT id
        FROM users
        WHERE last_login < CURRENT_DATE - INTERVAL '3 days'
          AND created_at < CURRENT_DATE - INTERVAL '7 days'
      `);

      console.log(`👤 Found ${result.rows.length} inactive users`);

      for (const row of result.rows) {
        await PushNotificationService.sendDailyReminder(row.id);
      }
    } catch (error) {
      console.error('Error checking inactive users:', error);
    }
  }

  /**
   * Send recipe suggestions based on ingredients
   */
  static async sendRecipeSuggestions(): Promise<void> {
    try {
      // Get users with ingredients but no recent recipe views
      const result = await pool.query(`
        SELECT DISTINCT ui.user_id
        FROM user_ingredients ui
        LEFT JOIN recipe_views rv ON rv.user_id = ui.user_id 
          AND rv.viewed_at > CURRENT_DATE - INTERVAL '1 day'
        WHERE rv.id IS NULL
        GROUP BY ui.user_id
        HAVING COUNT(ui.id) >= 3
      `);

      console.log(
        `🍽️ Sending recipe suggestions to ${result.rows.length} users`,
      );

      for (const row of result.rows) {
        // You would get a recipe suggestion here
        await PushNotificationService.sendRecipeSuggestion(
          row.user_id,
          'Chicken Stir Fry', // Placeholder
        );
      }
    } catch (error) {
      console.error('Error sending recipe suggestions:', error);
    }
  }
}
