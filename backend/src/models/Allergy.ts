import pool from '../config/database';

export class AllergyModel {
  static async getAll(): Promise<any[]> {
    const query = 'SELECT * FROM allergies WHERE is_active = true ORDER BY severity DESC, name';
    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      trigger_ingredients: JSON.parse(row.trigger_ingredients || '[]'),
      cross_reactive_ingredients: JSON.parse(row.cross_reactive_ingredients || '[]')
    }));
  }

  static async getUserAllergies(userId: string): Promise<any[]> {
    const query = `
      SELECT ua.*, a.name, a.severity, a.description, a.trigger_ingredients, a.cross_reactive_ingredients
      FROM user_allergies ua
      JOIN allergies a ON ua.allergy_id = a.id
      WHERE ua.user_id = $1 AND a.is_active = true
    `;
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      trigger_ingredients: JSON.parse(row.trigger_ingredients || '[]'),
      cross_reactive_ingredients: JSON.parse(row.cross_reactive_ingredients || '[]')
    }));
  }

  static async addUserAllergy(userId: string, allergyId: string, severityOverride?: string, notes?: string): Promise<void> {
    const query = `
      INSERT INTO user_allergies (user_id, allergy_id, severity_override, custom_notes)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [userId, allergyId, severityOverride, notes]);
  }

  static async removeUserAllergy(userId: string, allergyId: string): Promise<void> {
    const query = 'DELETE FROM user_allergies WHERE user_id = $1 AND allergy_id = $2';
    await pool.query(query, [userId, allergyId]);
  }

  static async addCustomAllergy(userId: string, name: string, severity: string = 'moderate', description?: string, triggerIngredients: string[] = []): Promise<void> {
    const query = `
      INSERT INTO custom_allergies (user_id, name, severity, description, trigger_ingredients)
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [userId, name, severity, description, JSON.stringify(triggerIngredients)]);
  }

  static async getUserCustomAllergies(userId: string): Promise<any[]> {
    const query = 'SELECT * FROM custom_allergies WHERE user_id = $1 ORDER BY severity DESC, name';
    const result = await pool.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      trigger_ingredients: JSON.parse(row.trigger_ingredients || '[]')
    }));
  }

  static async getAllUserTriggerIngredients(userId: string): Promise<{
    severe: string[];
    moderate: string[];
    mild: string[];
  }> {
    const [allergies, customAllergies] = await Promise.all([
      this.getUserAllergies(userId),
      this.getUserCustomAllergies(userId)
    ]);
    const triggers = { severe: new Set<string>(), moderate: new Set<string>(), mild: new Set<string>() };
    
    allergies.forEach(allergy => {
      const severity = (allergy.severity_override || allergy.severity) as keyof typeof triggers;
      allergy.trigger_ingredients.forEach((ingredient: string) => {
        triggers[severity].add(ingredient.toLowerCase());
      });
      allergy.cross_reactive_ingredients.forEach((ingredient: string) => {
        triggers[severity].add(ingredient.toLowerCase());
      });
    });
    
    customAllergies.forEach(allergy => {
      const severity = allergy.severity as keyof typeof triggers;
      allergy.trigger_ingredients.forEach((ingredient: string) => {
        triggers[severity].add(ingredient.toLowerCase());
      });
    });
    
    return {
      severe: Array.from(triggers.severe),
      moderate: Array.from(triggers.moderate),
      mild: Array.from(triggers.mild)
    };
  }
}