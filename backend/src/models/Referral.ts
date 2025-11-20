import pool from '../config/database';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referralCode: string;
  email?: string;
  status: 'pending' | 'completed' | 'expired';
  pointsAwarded: number;
  subscriptionPurchased: boolean;
  subscriptionType?: string;
  subscriptionDate?: Date;
  accessMonthsAwarded: number;
  dateCreated: Date;
  dateCompleted?: Date;
}

export class ReferralModel {
  static async createReferral(
    referrerId: string,
    email?: string,
  ): Promise<string> {
    const referralCode = this.generateReferralCode();
    const query = `
      INSERT INTO referrals (referrer_id, referral_code, email, status, date_created)
      VALUES ($1, $2, $3, 'pending', NOW())
      RETURNING referral_code
    `;
    const result = await pool.query(query, [referrerId, referralCode, email]);
    return result.rows[0].referral_code;
  }

  static async getUserReferrals(userId: string): Promise<Referral[]> {
    const query = `
      SELECT r.*, u.username as referred_username
      FROM referrals r
      LEFT JOIN users u ON r.referred_user_id = u.id
      WHERE r.referrer_id = $1
      ORDER BY r.date_created DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async completeReferral(
    referralCode: string,
    newUserId: string,
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update referral status
      const updateQuery = `
        UPDATE referrals 
        SET referred_user_id = $1, status = 'completed', date_completed = NOW(), points_awarded = 50
        WHERE referral_code = $2 AND status = 'pending'
        RETURNING referrer_id
      `;
      const result = await client.query(updateQuery, [newUserId, referralCode]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      const referrerId = result.rows[0].referrer_id;

      // Award points to referrer
      const pointsQuery = `
        INSERT INTO points_transactions (user_id, points, action, description, date_created)
        VALUES ($1, 50, 'referral_signup', 'Successful referral signup', NOW())
      `;
      await client.query(pointsQuery, [referrerId]);

      // Update referrer's total points
      const updatePointsQuery = `
        INSERT INTO user_points (user_id, total_points, level, last_updated)
        VALUES ($1, 50, 0, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          total_points = user_points.total_points + 50,
          level = CASE 
            WHEN (user_points.total_points + 50) >= 10000 THEN 5
            WHEN (user_points.total_points + 50) >= 5000 THEN 4
            WHEN (user_points.total_points + 50) >= 2000 THEN 3
            WHEN (user_points.total_points + 50) >= 500 THEN 2
            WHEN (user_points.total_points + 50) >= 100 THEN 1
            ELSE 0
          END,
          last_updated = NOW()
      `;
      await client.query(updatePointsQuery, [referrerId]);

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getReferralByCode(
    referralCode: string,
  ): Promise<Referral | null> {
    const query = 'SELECT * FROM referrals WHERE referral_code = $1';
    const result = await pool.query(query, [referralCode]);
    return result.rows[0] || null;
  }

  static async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalPointsEarned: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN points_awarded ELSE 0 END), 0) as total_points_earned
      FROM referrals 
      WHERE referrer_id = $1
    `;
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      totalReferrals: parseInt(row.total_referrals) || 0,
      completedReferrals: parseInt(row.completed_referrals) || 0,
      pendingReferrals: parseInt(row.pending_referrals) || 0,
      totalPointsEarned: parseInt(row.total_points_earned) || 0,
    };
  }

  static async recordSubscriptionPurchase(
    userId: string,
    subscriptionType: 'monthly' | 'yearly',
  ): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Find if this user was referred
      const referralQuery = `
        SELECT r.*, r.referrer_id
        FROM referrals r
        WHERE r.referred_user_id = $1 
        AND r.status = 'completed'
        AND r.subscription_purchased = false
      `;
      const referralResult = await client.query(referralQuery, [userId]);

      if (referralResult.rows.length > 0) {
        const referral = referralResult.rows[0];
        const referrerId = referral.referrer_id;

        // Only award access extension for yearly subscriptions
        if (subscriptionType === 'yearly') {
          const monthsToAward = 1; // 1 month free access per yearly subscription

          // Update referral record
          const updateReferralQuery = `
            UPDATE referrals
            SET subscription_purchased = true,
                subscription_type = $1,
                subscription_date = NOW(),
                access_months_awarded = $2
            WHERE id = $3
          `;
          await client.query(updateReferralQuery, [
            subscriptionType,
            monthsToAward,
            referral.id,
          ]);

          // Extend referrer's access
          const extendAccessQuery = `
            UPDATE users
            SET referral_access_months = referral_access_months + $1,
                access_extended_until = CASE
                  WHEN access_extended_until IS NULL OR access_extended_until < NOW()
                  THEN NOW() + INTERVAL '1 month' * $1
                  ELSE access_extended_until + INTERVAL '1 month' * $1
                END
            WHERE id = $2
          `;
          await client.query(extendAccessQuery, [monthsToAward, referrerId]);

          // Award bonus points for successful referral with subscription
          const bonusPoints = 100; // Extra points for subscription purchase
          const pointsQuery = `
            INSERT INTO points_transactions (user_id, points, action, description, date_created)
            VALUES ($1, $2, 'referral_subscription', 'Referral purchased yearly subscription', NOW())
          `;
          await client.query(pointsQuery, [referrerId, bonusPoints]);

          // Update referrer's total points
          const updatePointsQuery = `
            INSERT INTO user_points (user_id, total_points, level, last_updated)
            VALUES ($1, $2, 0, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET 
              total_points = user_points.total_points + $2,
              level = CASE 
                WHEN (user_points.total_points + $2) >= 10000 THEN 5
                WHEN (user_points.total_points + $2) >= 5000 THEN 4
                WHEN (user_points.total_points + $2) >= 2000 THEN 3
                WHEN (user_points.total_points + $2) >= 500 THEN 2
                WHEN (user_points.total_points + $2) >= 100 THEN 1
                ELSE 0
              END,
              last_updated = NOW()
          `;
          await client.query(updatePointsQuery, [referrerId, bonusPoints]);
        } else {
          // Just mark subscription as purchased for monthly
          const updateReferralQuery = `
            UPDATE referrals
            SET subscription_purchased = true,
                subscription_type = $1,
                subscription_date = NOW()
            WHERE id = $2
          `;
          await client.query(updateReferralQuery, [
            subscriptionType,
            referral.id,
          ]);
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getReferralAccessInfo(userId: string): Promise<{
    totalMonthsEarned: number;
    accessExtendedUntil: Date | null;
    activeReferrals: number;
  }> {
    const query = `
      SELECT 
        u.referral_access_months,
        u.access_extended_until,
        COUNT(r.id) FILTER (WHERE r.subscription_purchased = true) as active_referrals
      FROM users u
      LEFT JOIN referrals r ON r.referrer_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.referral_access_months, u.access_extended_until
    `;
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];

    return {
      totalMonthsEarned: row?.referral_access_months || 0,
      accessExtendedUntil: row?.access_extended_until || null,
      activeReferrals: parseInt(row?.active_referrals) || 0,
    };
  }

  private static generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
