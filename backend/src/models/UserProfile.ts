import pool from '../config/database';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  dateJoined: Date;
  lastActive: Date;
  isEmailVerified: boolean;
  preferences: {
    notifications: boolean;
    publicProfile: boolean;
    shareActivity: boolean;
  };
}

export class UserProfileModel {
  static async getProfile(userId: string): Promise<UserProfile | null> {
    const query = `
      SELECT u.*, up.bio, up.location, up.avatar_url, up.preferences
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      preferences: row.preferences ? JSON.parse(row.preferences) : {
        notifications: true,
        publicProfile: true,
        shareActivity: true
      }
    };
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update users table
      if (updates.username || updates.email || updates.firstName || updates.lastName) {
        const userFields = [];
        const userValues = [];
        let paramIndex = 1;
        
        if (updates.username) {
          userFields.push(`username = $${paramIndex++}`);
          userValues.push(updates.username);
        }
        if (updates.email) {
          userFields.push(`email = $${paramIndex++}`);
          userValues.push(updates.email);
        }
        if (updates.firstName) {
          userFields.push(`first_name = $${paramIndex++}`);
          userValues.push(updates.firstName);
        }
        if (updates.lastName) {
          userFields.push(`last_name = $${paramIndex++}`);
          userValues.push(updates.lastName);
        }
        
        if (userFields.length > 0) {
          userValues.push(userId);
          const userQuery = `UPDATE users SET ${userFields.join(', ')} WHERE id = $${paramIndex}`;
          await client.query(userQuery, userValues);
        }
      }
      
      // Update user_profiles table
      if (updates.bio || updates.location || updates.avatarUrl || updates.preferences) {
        const profileQuery = `
          INSERT INTO user_profiles (user_id, bio, location, avatar_url, preferences)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id)
          DO UPDATE SET
            bio = COALESCE($2, user_profiles.bio),
            location = COALESCE($3, user_profiles.location),
            avatar_url = COALESCE($4, user_profiles.avatar_url),
            preferences = COALESCE($5, user_profiles.preferences)
        `;
        await client.query(profileQuery, [
          userId,
          updates.bio || null,
          updates.location || null,
          updates.avatarUrl || null,
          updates.preferences ? JSON.stringify(updates.preferences) : null
        ]);
      }
      
      await client.query('COMMIT');
    } catch (_error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateLastActive(userId: string): Promise<void> {
    const query = 'UPDATE users SET last_active = NOW() WHERE id = $1';
    await pool.query(query, [userId]);
  }

  static async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    const searchQuery = `
      SELECT u.*, up.bio, up.location, up.avatar_url, up.preferences
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE (u.username ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)
      AND up.preferences->>'publicProfile' = 'true'
      ORDER BY u.username
      LIMIT $2
    `;
    const result = await pool.query(searchQuery, [`%${query}%`, limit]);
    return result.rows.map(row => ({
      ...row,
      preferences: row.preferences ? JSON.parse(row.preferences) : {
        notifications: true,
        publicProfile: true,
        shareActivity: true
      }
    }));
  }

  static async getUserStats(userId: string): Promise<{
    totalRecipes: number;
    totalFavorites: number;
    totalRatings: number;
    averageRating: number;
  }> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM user_recipes WHERE user_id = $1) as total_recipes,
        (SELECT COUNT(*) FROM favorite_recipes WHERE user_id = $1) as total_favorites,
        (SELECT COUNT(*) FROM recipe_ratings WHERE user_id = $1) as total_ratings,
        (SELECT AVG(rating)::numeric(3,2) FROM recipe_ratings WHERE user_id = $1) as average_rating
    `;
    const result = await pool.query(query, [userId]);
    const row = result.rows[0];
    
    return {
      totalRecipes: parseInt(row.total_recipes) || 0,
      totalFavorites: parseInt(row.total_favorites) || 0,
      totalRatings: parseInt(row.total_ratings) || 0,
      averageRating: parseFloat(row.average_rating) || 0
    };
  }
}
