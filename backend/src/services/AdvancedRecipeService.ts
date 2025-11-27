import pool from '../config/database';

export class AdvancedRecipeService {
  // Nutrition
  async addNutrition(recipeId: string, nutrition: any) {
    const result = await pool.query(
      `INSERT INTO recipe_nutrition 
       (recipe_id, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, servings) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       ON CONFLICT (recipe_id) DO UPDATE 
       SET calories = $2, protein_g = $3, carbs_g = $4, fat_g = $5, fiber_g = $6, sugar_g = $7, sodium_mg = $8, servings = $9, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [
        recipeId,
        nutrition.calories,
        nutrition.protein_g,
        nutrition.carbs_g,
        nutrition.fat_g,
        nutrition.fiber_g,
        nutrition.sugar_g,
        nutrition.sodium_mg,
        nutrition.servings || 1,
      ],
    );
    return result.rows[0];
  }

  async getNutrition(recipeId: string) {
    const result = await pool.query(
      'SELECT * FROM recipe_nutrition WHERE recipe_id = $1',
      [recipeId],
    );
    return result.rows[0];
  }

  // Timers
  async addTimer(
    recipeId: string,
    stepNumber: number,
    durationMinutes: number,
    label?: string,
  ) {
    const result = await pool.query(
      'INSERT INTO recipe_timers (recipe_id, step_number, duration_minutes, timer_label) VALUES ($1, $2, $3, $4) RETURNING *',
      [recipeId, stepNumber, durationMinutes, label],
    );
    return result.rows[0];
  }

  async getTimers(recipeId: string) {
    const result = await pool.query(
      'SELECT * FROM recipe_timers WHERE recipe_id = $1 ORDER BY step_number',
      [recipeId],
    );
    return result.rows;
  }

  // Cooking Sessions
  async startCookingSession(userId: number, recipeId: string) {
    const result = await pool.query(
      'INSERT INTO cooking_sessions (user_id, recipe_id, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, recipeId, 'in_progress'],
    );
    return result.rows[0];
  }

  async updateCookingSession(
    sessionId: number,
    currentStep: number,
    status?: string,
  ) {
    const result = await pool.query(
      'UPDATE cooking_sessions SET current_step = $1, status = COALESCE($2, status) WHERE id = $3 RETURNING *',
      [currentStep, status, sessionId],
    );
    return result.rows[0];
  }

  async completeCookingSession(sessionId: number) {
    const result = await pool.query(
      `UPDATE cooking_sessions 
       SET status = 'completed', completed_at = CURRENT_TIMESTAMP, 
       total_time_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))/60 
       WHERE id = $1 RETURNING *`,
      [sessionId],
    );
    return result.rows[0];
  }

  async getCookingSession(userId: number, recipeId: string) {
    const result = await pool.query(
      'SELECT * FROM cooking_sessions WHERE user_id = $1 AND recipe_id = $2 AND status = $3 ORDER BY started_at DESC LIMIT 1',
      [userId, recipeId, 'in_progress'],
    );
    return result.rows[0];
  }

  // Tags
  async addTag(recipeId: string, tag: string, tagType: string) {
    const result = await pool.query(
      'INSERT INTO recipe_tags (recipe_id, tag, tag_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *',
      [recipeId, tag, tagType],
    );
    return result.rows[0];
  }

  async getTags(recipeId: string) {
    const result = await pool.query(
      'SELECT * FROM recipe_tags WHERE recipe_id = $1',
      [recipeId],
    );
    return result.rows;
  }

  async searchByTags(tags: string[], tagType?: string) {
    let query =
      'SELECT DISTINCT recipe_id FROM recipe_tags WHERE tag = ANY($1)';
    const params: any[] = [tags];

    if (tagType) {
      query += ' AND tag_type = $2';
      params.push(tagType);
    }

    const result = await pool.query(query, params);
    return result.rows.map(r => r.recipe_id);
  }

  // Seasonal
  async addSeasonalRecipe(recipeId: string, season: string, priority = 0) {
    const result = await pool.query(
      'INSERT INTO seasonal_recipes (recipe_id, season, priority) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *',
      [recipeId, season, priority],
    );
    return result.rows[0];
  }

  async getSeasonalRecipes(season: string, limit = 20) {
    const result = await pool.query(
      'SELECT * FROM seasonal_recipes WHERE season = $1 ORDER BY priority DESC LIMIT $2',
      [season, limit],
    );
    return result.rows;
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }
}

export default new AdvancedRecipeService();
