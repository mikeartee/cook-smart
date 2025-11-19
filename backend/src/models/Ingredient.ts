import pool from '../config/database';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  description?: string;
  common_names: string[];
  barcode?: string;
  nutrition_per_100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  default_unit: string;
  is_common: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserIngredient {
  id: string;
  user_id: string;
  ingredient_id: string;
  quantity?: number;
  unit: string;
  expiration_date?: Date;
  notes?: string;
  ingredient?: Ingredient;
}

export class IngredientModel {
  static async getAll(category?: string, search?: string): Promise<Ingredient[]> {
    let query = 'SELECT * FROM ingredients WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR common_names::text ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY is_common DESC, name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getById(id: string): Promise<Ingredient | null> {
    const query = 'SELECT * FROM ingredients WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getByBarcode(barcode: string): Promise<Ingredient | null> {
    const query = 'SELECT * FROM ingredients WHERE barcode = $1';
    const result = await pool.query(query, [barcode]);
    return result.rows[0] || null;
  }

  static async getCategories(): Promise<string[]> {
    const query = 'SELECT DISTINCT category FROM ingredients ORDER BY category';
    const result = await pool.query(query);
    return result.rows.map(row => row.category);
  }

  static async searchIngredients(searchTerm: string, limit: number = 20): Promise<Ingredient[]> {
    const query = `
      SELECT * FROM ingredients 
      WHERE name ILIKE $1 OR common_names::text ILIKE $1
      ORDER BY 
        CASE WHEN name ILIKE $2 THEN 1 ELSE 2 END,
        is_common DESC,
        name ASC
      LIMIT $3
    `;
    const result = await pool.query(query, [`%${searchTerm}%`, `${searchTerm}%`, limit]);
    return result.rows;
  }

  static async addCustomIngredient(ingredientData: {
    name: string;
    category: string;
    description?: string;
    nutrition_per_100g?: any;
    default_unit?: string;
  }): Promise<Ingredient> {
    const query = `
      INSERT INTO ingredients (name, category, description, nutrition_per_100g, default_unit, is_common)
      VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `;
    const values = [
      ingredientData.name,
      ingredientData.category,
      ingredientData.description,
      JSON.stringify(ingredientData.nutrition_per_100g || {}),
      ingredientData.default_unit || 'piece'
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // User Ingredient Management
  static async getUserIngredients(userId: string): Promise<UserIngredient[]> {
    const query = `
      SELECT ui.*, i.name, i.category, i.default_unit, i.nutrition_per_100g
      FROM user_ingredients ui
      JOIN ingredients i ON ui.ingredient_id = i.id
      WHERE ui.user_id = $1
      ORDER BY i.category, i.name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async addUserIngredient(userId: string, ingredientData: {
    ingredient_id: string;
    quantity?: number;
    unit?: string;
    expiration_date?: Date;
    notes?: string;
  }): Promise<UserIngredient> {
    const query = `
      INSERT INTO user_ingredients (user_id, ingredient_id, quantity, unit, expiration_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, ingredient_id) 
      DO UPDATE SET 
        quantity = EXCLUDED.quantity,
        unit = EXCLUDED.unit,
        expiration_date = EXCLUDED.expiration_date,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `;
    const values = [
      userId,
      ingredientData.ingredient_id,
      ingredientData.quantity,
      ingredientData.unit,
      ingredientData.expiration_date,
      ingredientData.notes
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async removeUserIngredient(userId: string, userIngredientId: string): Promise<void> {
    const query = 'DELETE FROM user_ingredients WHERE user_id = $1 AND id = $2';
    await pool.query(query, [userId, userIngredientId]);
  }

  static async updateUserIngredient(userId: string, ingredientId: string, updateData: {
    quantity?: number;
    unit?: string;
    expiration_date?: Date;
    notes?: string;
  }): Promise<UserIngredient | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(userId, ingredientId);

    const query = `
      UPDATE user_ingredients 
      SET ${fields.join(', ')}
      WHERE user_id = $${paramIndex} AND ingredient_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }
}
