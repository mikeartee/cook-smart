import pool from '../config/database';

export interface CachedRecipe {
  id: string;
  recipe_id: string;
  recipe_data: any;
  created_at: Date;
  last_accessed: Date;
  access_count: number;
  is_popular: boolean;
}

export interface RecipeSearchCache {
  id: string;
  ingredient_hash: string;
  recipe_ids: string[];
  created_at: Date;
  expires_at: Date;
  access_count: number;
}

export class RecipeCacheModel {
  // Get cached recipe by Spoonacular recipe ID
  static async getCachedRecipe(recipeId: string): Promise<CachedRecipe | null> {
    const result = await pool.query(
      `SELECT * FROM cached_recipes WHERE recipe_id = $1`,
      [recipeId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Update last_accessed and access_count
    await pool.query(
      `UPDATE cached_recipes 
       SET last_accessed = NOW(), 
           access_count = access_count + 1,
           is_popular = CASE WHEN access_count + 1 >= 10 THEN true ELSE is_popular END
       WHERE recipe_id = $1`,
      [recipeId]
    );
    
    return result.rows[0];
  }

  // Cache a recipe permanently
  static async cacheRecipe(recipeId: string, recipeData: any): Promise<void> {
    await pool.query(
      `INSERT INTO cached_recipes (recipe_id, recipe_data, created_at, last_accessed, access_count, is_popular)
       VALUES ($1, $2, NOW(), NOW(), 1, false)
       ON CONFLICT (recipe_id) 
       DO UPDATE SET 
         recipe_data = $2,
         last_accessed = NOW(),
         access_count = cached_recipes.access_count + 1`,
      [recipeId, JSON.stringify(recipeData)]
    );
  }

  // Get cached search results
  static async getCachedSearch(ingredientHash: string): Promise<RecipeSearchCache | null> {
    const result = await pool.query(
      `SELECT * FROM recipe_search_cache 
       WHERE ingredient_hash = $1 
       AND expires_at > NOW()`,
      [ingredientHash]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Update access count
    await pool.query(
      `UPDATE recipe_search_cache 
       SET access_count = access_count + 1
       WHERE ingredient_hash = $1`,
      [ingredientHash]
    );
    
    return result.rows[0];
  }

  // Cache search results for 30 days
  static async cacheSearch(ingredientHash: string, recipeIds: string[]): Promise<void> {
    await pool.query(
      `INSERT INTO recipe_search_cache (ingredient_hash, recipe_ids, created_at, expires_at, access_count)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '30 days', 1)
       ON CONFLICT (ingredient_hash)
       DO UPDATE SET 
         recipe_ids = $2,
         expires_at = NOW() + INTERVAL '30 days',
         access_count = recipe_search_cache.access_count + 1`,
      [ingredientHash, recipeIds]
    );
  }

  // Get cache statistics
  static async getCacheStats(): Promise<any> {
    const recipeCount = await pool.query('SELECT COUNT(*) FROM cached_recipes');
    const searchCount = await pool.query('SELECT COUNT(*) FROM recipe_search_cache WHERE expires_at > NOW()');
    const popularCount = await pool.query('SELECT COUNT(*) FROM cached_recipes WHERE is_popular = true');
    
    return {
      total_recipes: parseInt(recipeCount.rows[0].count),
      active_searches: parseInt(searchCount.rows[0].count),
      popular_recipes: parseInt(popularCount.rows[0].count),
    };
  }

  // Clean up expired search cache (run monthly)
  static async cleanupExpiredSearches(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM recipe_search_cache 
       WHERE expires_at < NOW() 
       AND access_count = 0
       RETURNING id`
    );
    return result.rowCount || 0;
  }
}
