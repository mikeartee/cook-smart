import pool from '../config/database';

export interface RecipeRating {
  id: string;
  userId: string;
  recipeId: string;
  rating: number;
  review?: string;
  dateCreated: Date;
  dateUpdated: Date;
}

export class RecipeRatingModel {
  static async addRating(userId: string, recipeId: string, rating: number, review?: string): Promise<void> {
    const query = `
      INSERT INTO recipe_ratings (user_id, recipe_id, rating, review, date_created, date_updated)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (user_id, recipe_id) 
      DO UPDATE SET rating = $3, review = $4, date_updated = NOW()
    `;
    await pool.query(query, [userId, recipeId, rating, review]);
  }

  static async getUserRating(userId: string, recipeId: string): Promise<RecipeRating | null> {
    const query = 'SELECT * FROM recipe_ratings WHERE user_id = $1 AND recipe_id = $2';
    const result = await pool.query(query, [userId, recipeId]);
    return result.rows[0] || null;
  }

  static async getRecipeRatings(recipeId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT rr.*, u.username, u.avatar_url
      FROM recipe_ratings rr
      LEFT JOIN users u ON rr.user_id = u.id
      WHERE rr.recipe_id = $1 AND rr.review IS NOT NULL
      ORDER BY rr.date_created DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [recipeId, limit, offset]);
    return result.rows;
  }

  static async getRecipeStats(recipeId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<number, number>;
  }> {
    const statsQuery = `
      SELECT 
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(*) as total_ratings,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM recipe_ratings 
      WHERE recipe_id = $1
    `;
    const result = await pool.query(statsQuery, [recipeId]);
    const row = result.rows[0];

    return {
      averageRating: parseFloat(row.average_rating) || 0,
      totalRatings: parseInt(row.total_ratings) || 0,
      ratingDistribution: {
        5: parseInt(row.five_star) || 0,
        4: parseInt(row.four_star) || 0,
        3: parseInt(row.three_star) || 0,
        2: parseInt(row.two_star) || 0,
        1: parseInt(row.one_star) || 0
      }
    };
  }

  static async deleteRating(userId: string, recipeId: string): Promise<void> {
    const query = 'DELETE FROM recipe_ratings WHERE user_id = $1 AND recipe_id = $2';
    await pool.query(query, [userId, recipeId]);
  }

  static async getUserRatings(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT rr.*, r.title, r.image_url
      FROM recipe_ratings rr
      LEFT JOIN recipes r ON rr.recipe_id = r.id
      WHERE rr.user_id = $1
      ORDER BY rr.date_updated DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }
}