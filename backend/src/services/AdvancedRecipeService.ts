import pool from '../config/database';
import fetch from 'node-fetch';

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
  async startCookingSession(userId: string, recipeId: string) {
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

  async getCookingSession(userId: string, recipeId: string) {
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
    try {
      const result = await pool.query(
        'SELECT * FROM seasonal_recipes WHERE season = $1 ORDER BY priority DESC LIMIT $2',
        [season, limit],
      );

      // If no seasonal recipes in database, fetch from external API
      if (result.rows.length === 0) {
        console.log(
          'No seasonal recipes in database, fetching from Spoonacular API',
        );
        return this.fetchSeasonalRecipesFromAPI(season, limit);
      }

      return result.rows;
    } catch (error) {
      // If database is down, go straight to Spoonacular API
      console.error(
        'Database error when fetching seasonal recipes, falling back to API:',
        error,
      );
      return this.fetchSeasonalRecipesFromAPI(season, limit);
    }
  }

  private async fetchSeasonalRecipesFromAPI(season: string, limit: number) {
    try {
      const seasonalTags = this.getSeasonalTags(season);
      const apiKey = process.env.SPOONACULAR_API_KEY;

      if (!apiKey) {
        console.warn('No Spoonacular API key found, returning empty array');
        return [];
      }

      console.log(
        `Fetching seasonal recipes for ${season} with tags: ${seasonalTags}`,
      );

      const url = `https://api.spoonacular.com/recipes/complexSearch?tags=${seasonalTags}&number=${limit}&sort=popularity&addRecipeInformation=true&apiKey=${apiKey}`;
      console.log('API URL:', url.replace(apiKey, 'HIDDEN'));

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          'Failed to fetch seasonal recipes from API:',
          response.status,
          errorText,
        );
        return [];
      }

      const data: any = await response.json();
      console.log(
        `Received ${data.results?.length || 0} seasonal recipes from Spoonacular`,
      );

      if (!data.results || data.results.length === 0) {
        console.warn('No seasonal recipes found from API');
        return [];
      }

      // Transform API response to match our format
      const recipes = data.results.map((recipe: any) => ({
        recipe_id: recipe.id.toString(),
        season: season,
        priority: 0,
        title: recipe.title,
        image: recipe.image,
        readyInMinutes: recipe.readyInMinutes,
      }));

      // Cache the results in the database to avoid future API calls
      if (recipes.length > 0) {
        console.log(`Caching ${recipes.length} seasonal recipes to database`);
        try {
          for (const recipe of recipes) {
            await this.addSeasonalRecipe(recipe.recipe_id, season, 0);
          }
          console.log('✅ Seasonal recipes cached successfully');
        } catch (cacheError) {
          console.error('Failed to cache seasonal recipes:', cacheError);
          // Continue anyway - we still have the recipes to return
        }
      }

      return recipes;
    } catch (error) {
      console.error('Error fetching seasonal recipes from API:', error);
      return [];
    }
  }

  private getSeasonalTags(season: string): string {
    const seasonalIngredients: Record<string, string> = {
      spring: 'asparagus,peas,strawberries,spring',
      summer: 'tomatoes,corn,berries,summer,grilling',
      fall: 'pumpkin,squash,apples,fall,autumn',
      winter: 'root vegetables,winter,comfort food,soup',
    };
    return seasonalIngredients[season] || '';
  }

  getCurrentSeason(): string {
    const month = new Date().getMonth(); // 0-11 (Jan=0, Dec=11)
    // Spring: March-May (2-4)
    if (month >= 2 && month <= 4) return 'spring';
    // Summer: June-August (5-7)
    if (month >= 5 && month <= 7) return 'summer';
    // Fall: September-October (8-9)
    if (month >= 8 && month <= 9) return 'fall';
    // Winter: November-February (10-11, 0-1)
    return 'winter';
  }
}

export default new AdvancedRecipeService();
