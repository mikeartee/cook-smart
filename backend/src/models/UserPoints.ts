import pool from '../config/database';

export interface UserPoints {
  userId: string;
  totalPoints: number;
  level: number;
  lastUpdated: Date;
}

export interface PointsTransaction {
  id: string;
  userId: string;
  points: number;
  action: string;
  description: string;
  dateCreated: Date;
}

export class UserPointsModel {
  static async getUserPoints(userId: string): Promise<UserPoints | null> {
    const query = 'SELECT * FROM user_points WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  static async addPoints(userId: string, points: number, action: string, description: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Add points transaction
      const transactionQuery = `
        INSERT INTO points_transactions (user_id, points, action, description, date_created)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await client.query(transactionQuery, [userId, points, action, description]);
      
      // Update user points
      const updateQuery = `
        INSERT INTO user_points (user_id, total_points, level, last_updated)
        VALUES ($1, $2, $3, NOW())
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
      await client.query(updateQuery, [userId, points, this.calculateLevel(points)]);
      
      await client.query('COMMIT');
    } catch (_error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserTransactions(userId: string, limit: number = 20, offset: number = 0): Promise<PointsTransaction[]> {
    const query = `
      SELECT * FROM points_transactions 
      WHERE user_id = $1 
      ORDER BY date_created DESC 
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async getLeaderboard(limit: number = 10): Promise<any[]> {
    const query = `
      SELECT up.*, u.username, u.avatar_url
      FROM user_points up
      LEFT JOIN users u ON up.user_id = u.id
      ORDER BY up.total_points DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  private static calculateLevel(totalPoints: number): number {
    if (totalPoints >= 10000) return 5;
    if (totalPoints >= 5000) return 4;
    if (totalPoints >= 2000) return 3;
    if (totalPoints >= 500) return 2;
    if (totalPoints >= 100) return 1;
    return 0;
  }

  static getLevelInfo(level: number): { name: string; icon: string; minPoints: number; maxPoints: number } {
    const levels = [
      { name: 'Beginner', icon: '🥄', minPoints: 0, maxPoints: 99 },
      { name: 'Home Cook', icon: '👨‍🍳', minPoints: 100, maxPoints: 499 },
      { name: 'Chef', icon: '👩‍🍳', minPoints: 500, maxPoints: 1999 },
      { name: 'Master Chef', icon: '🔥', minPoints: 2000, maxPoints: 4999 },
      { name: 'Culinary Expert', icon: '⭐', minPoints: 5000, maxPoints: 9999 },
      { name: 'Kitchen Legend', icon: '👑', minPoints: 10000, maxPoints: Infinity }
    ];
    return levels[level] ?? levels[0]!;
  }

  static getPointsForAction(action: string): number {
    const pointsMap: Record<string, number> = {
      'recipe_view': 1,
      'recipe_favorite': 5,
      'recipe_rating': 10,
      'recipe_review': 15,
      'recipe_share': 8,
      'shopping_list_complete': 3,
      'daily_login': 2,
      'profile_complete': 25,
      'referral_signup': 50
    };
    return pointsMap[action] || 0;
  }
}
