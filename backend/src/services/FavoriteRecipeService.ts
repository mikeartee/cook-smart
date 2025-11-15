import pool from '../config/database';

export interface FavoriteRecipe {
  id: string;
  userId: string;
  recipeId: string;
  dateAdded: Date;
  notes?: string;
}

export class FavoriteRecipeService {
  static async addFavorite(userId: string, recipeId: string, notes?: string): Promise<void> {
    const query = `
      INSERT INTO favorite_recipes (user_id, recipe_id, notes, date_added)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, recipe_id) DO NOTHING
    `;
    await pool.query(query, [userId, recipeId, notes]);
  }

  static async removeFavorite(userId: string, recipeId: string): Promise<void> {
    const query = 'DELETE FROM favorite_recipes WHERE user_id = $1 AND recipe_id = $2';
    await pool.query(query, [userId, recipeId]);
  }

  static async getUserFavorites(userId: string): Promise<FavoriteRecipe[]> {
    const query = `
      SELECT * FROM favorite_recipes 
      WHERE user_id = $1 
      ORDER BY date_added DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM favorite_recipes WHERE user_id = $1 AND recipe_id = $2';
    const result = await pool.query(query, [userId, recipeId]);
    return result.rows.length > 0;
  }

  static async getFavoriteCount(recipeId: string): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM favorite_recipes WHERE recipe_id = $1';
    const result = await pool.query(query, [recipeId]);
    return parseInt(result.rows[0].count);
  }

  static async getUserFavoriteRecipes(userId: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    const query = `
      SELECT fr.*, r.title, r.description, r.cooking_time, r.difficulty, r.cuisine, r.image_url
      FROM favorite_recipes fr
      LEFT JOIN recipes r ON fr.recipe_id = r.id
      WHERE fr.user_id = $1
      ORDER BY fr.date_added DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }
}
