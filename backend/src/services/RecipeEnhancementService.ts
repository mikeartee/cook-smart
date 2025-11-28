import pool from '../config/database';

export class RecipeEnhancementService {
  // RATINGS
  static async rateRecipe(
    userId: number,
    recipeId: string,
    recipeType: 'api' | 'user',
    rating: number,
    review?: string,
  ) {
    const result = await pool.query(
      `INSERT INTO recipe_ratings (user_id, recipe_id, recipe_type, rating, review)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, recipe_id, recipe_type)
       DO UPDATE SET rating = $4, review = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, recipeId, recipeType, rating, review],
    );
    return result.rows[0];
  }

  static async getRecipeRatings(recipeId: string, recipeType: 'api' | 'user') {
    const result = await pool.query(
      `SELECT AVG(rating)::numeric(3,2) as avg_rating, COUNT(*) as total_ratings
       FROM recipe_ratings WHERE recipe_id = $1 AND recipe_type = $2`,
      [recipeId, recipeType],
    );
    return result.rows[0];
  }

  static async getRecipeReviews(recipeId: string, recipeType: 'api' | 'user') {
    const result = await pool.query(
      `SELECT r.*, u.first_name, u.last_name
       FROM recipe_ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.recipe_id = $1 AND r.recipe_type = $2 AND r.review IS NOT NULL
       ORDER BY r.created_at DESC`,
      [recipeId, recipeType],
    );
    return result.rows;
  }

  // COLLECTIONS
  static async createCollection(
    userId: number,
    name: string,
    description?: string,
    icon?: string,
  ) {
    const result = await pool.query(
      `INSERT INTO recipe_collections (user_id, name, description, icon)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, name, description, icon],
    );
    return result.rows[0];
  }

  static async getUserCollections(userId: number) {
    const result = await pool.query(
      `SELECT c.*, COUNT(i.id) as recipe_count
       FROM recipe_collections c
       LEFT JOIN recipe_collection_items i ON c.id = i.collection_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  static async addToCollection(
    collectionId: number,
    recipeId: string,
    recipeType: 'api' | 'user',
  ) {
    const result = await pool.query(
      `INSERT INTO recipe_collection_items (collection_id, recipe_id, recipe_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, recipe_id, recipe_type) DO NOTHING
       RETURNING *`,
      [collectionId, recipeId, recipeType],
    );
    return result.rows[0];
  }

  static async removeFromCollection(
    collectionId: number,
    recipeId: string,
    recipeType: 'api' | 'user',
  ) {
    await pool.query(
      `DELETE FROM recipe_collection_items
       WHERE collection_id = $1 AND recipe_id = $2 AND recipe_type = $3`,
      [collectionId, recipeId, recipeType],
    );
  }

  static async getCollectionRecipes(collectionId: number) {
    const result = await pool.query(
      `SELECT * FROM recipe_collection_items WHERE collection_id = $1 ORDER BY added_at DESC`,
      [collectionId],
    );
    return result.rows;
  }

  // MEAL PLANNING
  static async addMealPlan(
    userId: number,
    recipeId: string,
    recipeType: 'api' | 'user',
    plannedDate: string,
    mealType: string,
    notes?: string,
  ) {
    const result = await pool.query(
      `INSERT INTO meal_plans (user_id, recipe_id, recipe_type, planned_date, meal_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, recipeId, recipeType, plannedDate, mealType, notes],
    );
    return result.rows[0];
  }

  static async getMealPlans(
    userId: number,
    startDate: string,
    endDate: string,
  ) {
    const result = await pool.query(
      `SELECT * FROM meal_plans
       WHERE user_id = $1 AND planned_date BETWEEN $2 AND $3
       ORDER BY planned_date, meal_type`,
      [userId, startDate, endDate],
    );
    return result.rows;
  }

  static async markMealComplete(mealPlanId: number, userId: number) {
    const result = await pool.query(
      `UPDATE meal_plans SET completed = true
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [mealPlanId, userId],
    );
    return result.rows[0];
  }

  static async deleteMealPlan(mealPlanId: number, userId: number) {
    await pool.query(`DELETE FROM meal_plans WHERE id = $1 AND user_id = $2`, [
      mealPlanId,
      userId,
    ]);
  }

  // COOKING HISTORY
  static async markRecipeCooked(
    userId: number,
    recipeId: string,
    recipeType: 'api' | 'user',
    rating?: number,
    notes?: string,
  ) {
    const result = await pool.query(
      `INSERT INTO recipe_cooking_history (user_id, recipe_id, recipe_type, rating, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, recipeId, recipeType, rating, notes],
    );
    return result.rows[0];
  }

  static async getCookingHistory(userId: number, limit = 20) {
    const result = await pool.query(
      `SELECT * FROM recipe_cooking_history
       WHERE user_id = $1
       ORDER BY cooked_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }
}
