import pool from '../config/database';

export interface UserRecipe {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  is_public?: boolean;
  ingredients: Array<{name: string; quantity?: string; unit?: string}>;
  instructions: Array<{step_number: number; instruction: string}>;
  photos?: string[];
}

export class UserRecipeService {
  /**
   * Create new recipe
   */
  static async createRecipe(
    userId: number,
    recipe: UserRecipe,
  ): Promise<number> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert recipe
      const recipeResult = await client.query(
        `INSERT INTO user_recipes (user_id, title, description, prep_time, cook_time, servings, category, difficulty, is_public)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          userId,
          recipe.title,
          recipe.description,
          recipe.prep_time || 0,
          recipe.cook_time || 0,
          recipe.servings || 4,
          recipe.category,
          recipe.difficulty || 'medium',
          recipe.is_public || false,
        ],
      );

      const recipeId = recipeResult.rows[0].id;

      // Insert ingredients
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ing = recipe.ingredients[i];
        if (ing) {
          await client.query(
            `INSERT INTO user_recipe_ingredients (recipe_id, name, quantity, unit, sort_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [recipeId, ing.name, ing.quantity, ing.unit, i],
          );
        }
      }

      // Insert instructions
      for (const inst of recipe.instructions) {
        await client.query(
          `INSERT INTO user_recipe_instructions (recipe_id, step_number, instruction)
           VALUES ($1, $2, $3)`,
          [recipeId, inst.step_number, inst.instruction],
        );
      }

      // Insert photos if provided
      if (recipe.photos && recipe.photos.length > 0) {
        for (let i = 0; i < recipe.photos.length; i++) {
          await client.query(
            `INSERT INTO user_recipe_photos (recipe_id, photo_url, is_primary, sort_order)
             VALUES ($1, $2, $3, $4)`,
            [recipeId, recipe.photos[i], i === 0, i],
          );
        }
      }

      await client.query('COMMIT');
      return recipeId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get user's recipes
   */
  static async getUserRecipes(userId: number) {
    const result = await pool.query(
      `SELECT r.*, 
              COALESCE(json_agg(DISTINCT jsonb_build_object('url', p.photo_url, 'is_primary', p.is_primary)) 
                FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM user_recipes r
       LEFT JOIN user_recipe_photos p ON r.id = p.recipe_id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.date_created DESC`,
      [userId],
    );
    return result.rows;
  }

  /**
   * Get recipe details
   */
  static async getRecipeDetails(recipeId: number, userId?: number) {
    const result = await pool.query(
      `SELECT r.*, 
              COALESCE(json_agg(DISTINCT jsonb_build_object('url', p.photo_url, 'is_primary', p.is_primary, 'sort_order', p.sort_order)) 
                FILTER (WHERE p.id IS NOT NULL) ORDER BY p.sort_order, '[]') as photos,
              COALESCE(json_agg(DISTINCT jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit', i.unit)) 
                FILTER (WHERE i.id IS NOT NULL) ORDER BY i.sort_order, '[]') as ingredients,
              COALESCE(json_agg(DISTINCT jsonb_build_object('step_number', inst.step_number, 'instruction', inst.instruction)) 
                FILTER (WHERE inst.id IS NOT NULL) ORDER BY inst.step_number, '[]') as instructions
       FROM user_recipes r
       LEFT JOIN user_recipe_photos p ON r.id = p.recipe_id
       LEFT JOIN user_recipe_ingredients i ON r.id = i.recipe_id
       LEFT JOIN user_recipe_instructions inst ON r.id = inst.recipe_id
       WHERE r.id = $1 AND (r.is_public = true OR r.user_id = $2)
       GROUP BY r.id`,
      [recipeId, userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Note: View count tracking will be added in future update

    return result.rows[0];
  }

  /**
   * Search public recipes
   */
  static async searchPublicRecipes(query: string, limit = 20) {
    const result = await pool.query(
      `SELECT r.*, 
              COALESCE(json_agg(DISTINCT jsonb_build_object('url', p.photo_url, 'is_primary', p.is_primary)) 
                FILTER (WHERE p.id IS NOT NULL AND p.is_primary = true), '[]') as photos
       FROM user_recipes r
       LEFT JOIN user_recipe_photos p ON r.id = p.recipe_id
       WHERE r.is_public = true 
         AND (r.title ILIKE $1 OR r.description ILIKE $1)
       GROUP BY r.id
       ORDER BY r.date_created DESC
       LIMIT $2`,
      [`%${query}%`, limit],
    );
    return result.rows;
  }

  /**
   * Delete recipe
   */
  static async deleteRecipe(recipeId: number, userId: number): Promise<void> {
    const result = await pool.query(
      'DELETE FROM user_recipes WHERE id = $1 AND user_id = $2 RETURNING id',
      [recipeId, userId],
    );

    if (result.rows.length === 0) {
      throw new Error('Recipe not found or unauthorized');
    }
  }
}
