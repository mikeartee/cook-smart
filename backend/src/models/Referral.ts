import pool from '../config/database';

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referralCode: string;
  email?: string;
  status: 'pending' | 'completed' | 'expired';
  pointsAwarded: number;
  dateCreated: Date;
  dateCompleted?: Date;
}

export class ReferralModel {
  static async createReferral(referrerId: string, email?: string): Promise<string> {
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

  static async completeReferral(referralCode: string, newUserId: string): Promise<boolean> {
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

  static async getReferralByCode(referralCode: string): Promise<Referral | null> {
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
      totalPointsEarned: parseInt(row.total_points_earned) || 0
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
