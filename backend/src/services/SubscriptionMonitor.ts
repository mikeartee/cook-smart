import pool from '../config/database';
import {EmailService} from './EmailService';

export class SubscriptionMonitor {
  /**
   * Check for subscriptions expiring soon and send reminders
   */
  static async checkExpiringSubscriptions(): Promise<void> {
    const reminders = [7, 3, 1]; // Days before expiry

    for (const days of reminders) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const query = `
        SELECT u.email, u.first_name, s.current_period_end, s.id as sub_id
        FROM subscriptions s
        JOIN users u ON s.user_id = u.id
        WHERE s.status = 'active'
          AND s.cancel_at_period_end = true
          AND s.current_period_end >= $1
          AND s.current_period_end < $2
          AND NOT EXISTS (
            SELECT 1 FROM subscription_reminders sr
            WHERE sr.subscription_id = s.id
              AND sr.reminder_type = 'expiry'
              AND sr.days_before = $3
              AND sr.sent_at > NOW() - INTERVAL '1 day'
          )
      `;

      const result = await pool.query(query, [targetDate, nextDay, days]);

      for (const row of result.rows) {
        await EmailService.sendSubscriptionExpiryReminder(
          row.email,
          row.first_name,
          days,
          row.current_period_end,
        );

        // Log reminder sent
        await pool.query(
          `INSERT INTO subscription_reminders (subscription_id, reminder_type, days_before, sent_at)
           VALUES ($1, 'expiry', $2, NOW())`,
          [row.sub_id, days],
        );
      }
    }
  }

  /**
   * Check for past_due subscriptions and manage grace period
   */
  static async checkPastDueSubscriptions(): Promise<void> {
    const query = `
      SELECT u.email, u.first_name, u.id as user_id, s.id as sub_id, s.updated_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'past_due'
    `;

    const result = await pool.query(query);

    for (const row of result.rows) {
      const daysPastDue = Math.floor(
        (Date.now() - new Date(row.updated_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      // Day 0: Send initial payment failed notification
      if (daysPastDue === 0) {
        const gracePeriodEnd = new Date(row.updated_at);
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

        await EmailService.sendPaymentFailedNotification(
          row.email,
          row.first_name,
          gracePeriodEnd,
        );

        await pool.query(
          `INSERT INTO subscription_reminders (subscription_id, reminder_type, days_before, sent_at)
           VALUES ($1, 'payment_failed', 0, NOW())`,
          [row.sub_id],
        );
      }

      // Day 3: Warning
      if (daysPastDue === 3) {
        const sent = await pool.query(
          `SELECT 1 FROM subscription_reminders
           WHERE subscription_id = $1 AND reminder_type = 'grace_warning' AND days_before = 3`,
          [row.sub_id],
        );

        if (sent.rows.length === 0) {
          await EmailService.sendGracePeriodWarning(
            row.email,
            row.first_name,
            4,
          );

          await pool.query(
            `INSERT INTO subscription_reminders (subscription_id, reminder_type, days_before, sent_at)
             VALUES ($1, 'grace_warning', 3, NOW())`,
            [row.sub_id],
          );
        }
      }

      // Day 6: Final warning
      if (daysPastDue === 6) {
        const sent = await pool.query(
          `SELECT 1 FROM subscription_reminders
           WHERE subscription_id = $1 AND reminder_type = 'grace_warning' AND days_before = 1`,
          [row.sub_id],
        );

        if (sent.rows.length === 0) {
          await EmailService.sendGracePeriodWarning(
            row.email,
            row.first_name,
            1,
          );

          await pool.query(
            `INSERT INTO subscription_reminders (subscription_id, reminder_type, days_before, sent_at)
             VALUES ($1, 'grace_warning', 1, NOW())`,
            [row.sub_id],
          );
        }
      }

      // Day 7: Restrict access
      if (daysPastDue >= 7) {
        await pool.query(
          `UPDATE users SET subscription_status = 'restricted' WHERE id = $1`,
          [row.user_id],
        );

        const sent = await pool.query(
          `SELECT 1 FROM subscription_reminders
           WHERE subscription_id = $1 AND reminder_type = 'access_restricted'`,
          [row.sub_id],
        );

        if (sent.rows.length === 0) {
          await EmailService.sendAccessRestricted(row.email, row.first_name);

          await pool.query(
            `INSERT INTO subscription_reminders (subscription_id, reminder_type, days_before, sent_at)
             VALUES ($1, 'access_restricted', 0, NOW())`,
            [row.sub_id],
          );
        }
      }
    }
  }

  /**
   * Run all subscription checks
   */
  static async runChecks(): Promise<void> {
    console.log('Running subscription checks...');
    await this.checkExpiringSubscriptions();
    await this.checkPastDueSubscriptions();
    console.log('Subscription checks complete');
  }

  /**
   * Start daily monitoring
   */
  static startDailyMonitoring(): void {
    // Run immediately
    this.runChecks().catch(console.error);

    // Run every 6 hours
    setInterval(
      () => {
        this.runChecks().catch(console.error);
      },
      6 * 60 * 60 * 1000,
    );

    console.log('Subscription monitoring started (runs every 6 hours)');
  }
}
