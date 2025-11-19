import pool from '../config/database';

export interface ShoppingListItem {
  id: string;
  userId: string;
  ingredient: string;
  quantity: string;
  unit: string;
  category: string;
  isCompleted: boolean;
  recipeId?: string;
  dateAdded: Date;
}

export class ShoppingListModel {
  static async addItem(
    userId: string,
    ingredient: string,
    quantity: string,
    unit: string,
    category: string = 'other',
    recipeId?: string,
  ): Promise<ShoppingListItem> {
    const query = `
      INSERT INTO shopping_list_items (user_id, ingredient, quantity, unit, category, recipe_id, date_added)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const result = await pool.query(query, [
      userId,
      ingredient,
      quantity,
      unit,
      category,
      recipeId,
    ]);
    return result.rows[0];
  }

  static async getUserItems(userId: string): Promise<ShoppingListItem[]> {
    const query = `
      SELECT * FROM shopping_list_items 
      WHERE user_id = $1 
      ORDER BY category, ingredient
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async toggleItemCompleted(
    userId: string,
    itemId: string,
  ): Promise<void> {
    const query = `
      UPDATE shopping_list_items 
      SET is_completed = NOT is_completed 
      WHERE id = $1 AND user_id = $2
    `;
    await pool.query(query, [itemId, userId]);
  }

  static async removeItem(userId: string, itemId: string): Promise<void> {
    const query =
      'DELETE FROM shopping_list_items WHERE id = $1 AND user_id = $2';
    await pool.query(query, [itemId, userId]);
  }

  static async updateItem(
    userId: string,
    itemId: string,
    ingredient: string,
    quantity: string,
    unit: string,
    category: string,
  ): Promise<void> {
    const query = `
      UPDATE shopping_list_items 
      SET ingredient = $3, quantity = $4, unit = $5, category = $6
      WHERE id = $1 AND user_id = $2
    `;
    await pool.query(query, [
      itemId,
      userId,
      ingredient,
      quantity,
      unit,
      category,
    ]);
  }

  static async addRecipeIngredients(
    userId: string,
    recipeId: string,
    ingredients: Array<{ingredient: string; quantity: string; unit: string}>,
  ): Promise<void> {
    const query = `
      INSERT INTO shopping_list_items (user_id, ingredient, quantity, unit, category, recipe_id, date_added)
      VALUES ($1, $2, $3, $4, 'recipe', $5, NOW())
    `;

    for (const item of ingredients) {
      await pool.query(query, [
        userId,
        item.ingredient,
        item.quantity,
        item.unit,
        recipeId,
      ]);
    }
  }

  static async clearCompleted(userId: string): Promise<void> {
    const query =
      'DELETE FROM shopping_list_items WHERE user_id = $1 AND is_completed = true';
    await pool.query(query, [userId]);
  }

  static async getItemsByCategory(
    userId: string,
  ): Promise<Record<string, ShoppingListItem[]>> {
    const items = await this.getUserItems(userId);
    const categorized: Record<string, ShoppingListItem[]> = {};

    items.forEach(item => {
      if (!categorized[item.category]) {
        categorized[item.category] = [];
      }
      const categoryArray = categorized[item.category];
      if (categoryArray) {
        categoryArray.push(item);
      }
    });

    return categorized;
  }
}
