import pool from '../config/database';

export class DietaryRestrictionModel {
  static async getAll(): Promise<any[]> {
    const query = 'SELECT * FROM dietary_restrictions WHERE is_active = true ORDER BY category, name';
    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      excluded_ingredients: JSON.parse(row.excluded_ingredients || '[]'),
      excluded_tags: JSON.parse(row.excluded_tags || '[]')
    }));
  }

  static async getUserRestrictions(userId: string): Promise<any[]> {
    const query = `
      SELECT udr.*, dr.name, dr.category, dr.description, dr.excluded_ingredients, dr.excluded_tags
      FROM user_dietary_restrictions udr
      JOIN dietary_restrictions dr ON udr.restriction_id = dr.id
      WHERE udr.user_id = $1 AND dr.is_active = true
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      excluded_ingredients: JSON.parse(row.excluded_ingredients || '[]'),
      excluded_tags: JSON.parse(row.excluded_tags || '[]')
    }));
  }

  static async addUserRestriction(userId: string, restrictionId: string, notes?: string): Promise<void> {
    const query = `
      INSERT INTO user_dietary_restrictions (user_id, restriction_id, custom_notes)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [userId, restrictionId, notes]);
  }

  static async removeUserRestriction(userId: string, restrictionId: string): Promise<void> {
    const query = 'DELETE FROM user_dietary_restrictions WHERE user_id = $1 AND restriction_id = $2';
    await pool.query(query, [userId, restrictionId]);
  }

  static async addCustomRestriction(userId: string, name: string, description?: string, excludedIngredients: string[] = []): Promise<void> {
    const query = `
      INSERT INTO custom_dietary_restrictions (user_id, name, description, excluded_ingredients)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [userId, name, description, JSON.stringify(excludedIngredients)]);
  }

  static async getUserCustomRestrictions(userId: string): Promise<any[]> {
    const query = 'SELECT * FROM custom_dietary_restrictions WHERE user_id = $1 ORDER BY name';
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      excluded_ingredients: JSON.parse(row.excluded_ingredients || '[]')
    }));
  }

  static async getAllUserExcludedIngredients(userId: string): Promise<string[]> {
    const [restrictions, customRestrictions] = await Promise.all([
      this.getUserRestrictions(userId),
      this.getUserCustomRestrictions(userId)
    ]);
    const excludedIngredients = new Set<string>();
    
    restrictions.forEach(restriction => {
      restriction.excluded_ingredients.forEach((ingredient: string) => 
        excludedIngredients.add(ingredient.toLowerCase())
      );
    });
    
    customRestrictions.forEach(restriction => {
      restriction.excluded_ingredients.forEach((ingredient: string) => 
        excludedIngredients.add(ingredient.toLowerCase())
      );
    });
    
    return Array.from(excludedIngredients);
  }
}