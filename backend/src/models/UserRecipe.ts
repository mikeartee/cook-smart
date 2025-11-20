import pool from '../config/database';

export interface UserRecipe {
  id: number;
  userId: string;
  title: string;
  description?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  category?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  isPublic: boolean;
  views: number;
  favorites: number;
  dateCreated: Date;
  dateUpdated: Date;
}

export interface UserRecipeIngredient {
  id: number;
  recipeId: number;
  name: string;
  quantity?: string;
  unit?: string;
  sortOrder: number;
}

export interface UserRecipeInstruction {
  id: number;
  recipeId: number;
  stepNumber: number;
  instruction: string;
}

export interface UserRecipeWithDetails extends UserRecipe {
  ingredients: UserRecipeIngredient[];
  instructions: UserRecipeInstruction[];
}

export class UserRecipeModel {
  static async createRecipe(
    userId: string,
    recipeData: {
      title: string;
      description?: string;
      prepTime: number;
      cookTime: number;
      servings: number;
      category?: string;
      difficulty: 'easy' | 'medium' | 'hard';
      imageUrl?: string;
      isPublic?: boolean;
      ingredients: Array<{name: string; quantity?: string; unit?: string}>;
      instructions: string[];
    },
  ): Promise<UserRecipeWithDetails> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert recipe
      const recipeQuery = `
        INSERT INTO user_recipes (
          user_id, title, description, prep_time, cook_time, servings,
          category, difficulty, image_url, is_public
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      const recipeResult = await client.query(recipeQuery, [
        userId,
        recipeData.title,
        recipeData.description,
        recipeData.prepTime,
        recipeData.cookTime,
        recipeData.servings,
        recipeData.category,
        recipeData.difficulty,
        recipeData.imageUrl,
        recipeData.isPublic || false,
      ]);
      const recipe = recipeResult.rows[0];

      // Insert ingredients
      const ingredients: UserRecipeIngredient[] = [];
      for (let i = 0; i < recipeData.ingredients.length; i++) {
        const ing = recipeData.ingredients[i];
        if (ing) {
          const ingQuery = `
            INSERT INTO user_recipe_ingredients (recipe_id, name, quantity, unit, sort_order)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
          `;
          const ingResult = await client.query(ingQuery, [
            recipe.id,
            ing.name,
            ing.quantity,
            ing.unit,
            i,
          ]);
          ingredients.push(ingResult.rows[0]);
        }
      }

      // Insert instructions
      const instructions: UserRecipeInstruction[] = [];
      for (let i = 0; i < recipeData.instructions.length; i++) {
        const instruction = recipeData.instructions[i];
        if (instruction) {
          const instQuery = `
            INSERT INTO user_recipe_instructions (recipe_id, step_number, instruction)
            VALUES ($1, $2, $3)
            RETURNING *
          `;
          const instResult = await client.query(instQuery, [
            recipe.id,
            i + 1,
            instruction,
          ]);
          instructions.push(instResult.rows[0]);
        }
      }

      // Award points for creating recipe
      const pointsQuery = `
        INSERT INTO points_transactions (user_id, points, action, description, date_created)
        VALUES ($1, 25, 'recipe_create', 'Created a recipe', NOW())
      `;
      await client.query(pointsQuery, [userId]);

      // Update user points
      const updatePointsQuery = `
        INSERT INTO user_points (user_id, total_points, level, last_updated)
        VALUES ($1, 25, 0, NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET 
          total_points = user_points.total_points + 25,
          level = CASE 
            WHEN (user_points.total_points + 25) >= 10000 THEN 5
            WHEN (user_points.total_points + 25) >= 5000 THEN 4
            WHEN (user_points.total_points + 25) >= 2000 THEN 3
            WHEN (user_points.total_points + 25) >= 500 THEN 2
            WHEN (user_points.total_points + 25) >= 100 THEN 1
            ELSE 0
          END,
          last_updated = NOW()
      `;
      await client.query(updatePointsQuery, [userId]);

      await client.query('COMMIT');

      return {
        ...recipe,
        ingredients,
        instructions,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUserRecipes(userId: string): Promise<UserRecipe[]> {
    const query = `
      SELECT * FROM user_recipes
      WHERE user_id = $1
      ORDER BY date_created DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getRecipeById(
    recipeId: number,
  ): Promise<UserRecipeWithDetails | null> {
    const recipeQuery = 'SELECT * FROM user_recipes WHERE id = $1';
    const recipeResult = await pool.query(recipeQuery, [recipeId]);

    if (recipeResult.rows.length === 0) {
      return null;
    }

    const recipe = recipeResult.rows[0];

    // Get ingredients
    const ingredientsQuery = `
      SELECT * FROM user_recipe_ingredients
      WHERE recipe_id = $1
      ORDER BY sort_order
    `;
    const ingredientsResult = await pool.query(ingredientsQuery, [recipeId]);

    // Get instructions
    const instructionsQuery = `
      SELECT * FROM user_recipe_instructions
      WHERE recipe_id = $1
      ORDER BY step_number
    `;
    const instructionsResult = await pool.query(instructionsQuery, [recipeId]);

    // Increment views
    await pool.query(
      'UPDATE user_recipes SET views = views + 1 WHERE id = $1',
      [recipeId],
    );

    return {
      ...recipe,
      ingredients: ingredientsResult.rows,
      instructions: instructionsResult.rows,
    };
  }

  static async updateRecipe(
    recipeId: number,
    userId: string,
    updates: Partial<UserRecipe>,
  ): Promise<UserRecipe | null> {
    const query = `
      UPDATE user_recipes
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          prep_time = COALESCE($3, prep_time),
          cook_time = COALESCE($4, cook_time),
          servings = COALESCE($5, servings),
          category = COALESCE($6, category),
          difficulty = COALESCE($7, difficulty),
          image_url = COALESCE($8, image_url),
          is_public = COALESCE($9, is_public),
          date_updated = NOW()
      WHERE id = $10 AND user_id = $11
      RETURNING *
    `;
    const result = await pool.query(query, [
      updates.title,
      updates.description,
      updates.prepTime,
      updates.cookTime,
      updates.servings,
      updates.category,
      updates.difficulty,
      updates.imageUrl,
      updates.isPublic,
      recipeId,
      userId,
    ]);
    return result.rows[0] || null;
  }

  static async deleteRecipe(
    recipeId: number,
    userId: string,
  ): Promise<boolean> {
    const query =
      'DELETE FROM user_recipes WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await pool.query(query, [recipeId, userId]);
    return result.rows.length > 0;
  }

  static async getPublicRecipes(
    limit: number = 20,
    offset: number = 0,
  ): Promise<UserRecipe[]> {
    const query = `
      SELECT ur.*, u.username, u.first_name, u.last_name
      FROM user_recipes ur
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE ur.is_public = true
      ORDER BY ur.date_created DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  static async toggleFavorite(
    recipeId: number,
    userId: string,
  ): Promise<boolean> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already favorited
      const checkQuery =
        'SELECT id FROM user_recipe_favorites WHERE recipe_id = $1 AND user_id = $2';
      const checkResult = await client.query(checkQuery, [recipeId, userId]);

      if (checkResult.rows.length > 0) {
        // Remove favorite
        await client.query(
          'DELETE FROM user_recipe_favorites WHERE recipe_id = $1 AND user_id = $2',
          [recipeId, userId],
        );
        await client.query(
          'UPDATE user_recipes SET favorites = favorites - 1 WHERE id = $1',
          [recipeId],
        );
        await client.query('COMMIT');
        return false;
      } else {
        // Add favorite
        await client.query(
          'INSERT INTO user_recipe_favorites (recipe_id, user_id) VALUES ($1, $2)',
          [recipeId, userId],
        );
        await client.query(
          'UPDATE user_recipes SET favorites = favorites + 1 WHERE id = $1',
          [recipeId],
        );
        await client.query('COMMIT');
        return true;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
