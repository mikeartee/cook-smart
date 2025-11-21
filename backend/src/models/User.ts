import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_co_founder: boolean;
  is_special_user: boolean;
  is_creator: boolean;
  has_lifetime_subscription: boolean;
  subscription_status: 'free' | 'trial' | 'active' | 'expired';
  subscription_expires_at?: Date;
  points: number;
  age_verified: boolean;
  dietary_restrictions: string[];
  allergies: string[];
  show_nutrition: boolean;
  preferred_units: 'imperial' | 'metric';
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  email_verified: boolean;
}

export class UserModel {
  static async create(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    age_verified: boolean;
  }): Promise<User> {
    const password_hash = await bcrypt.hash(userData.password, 12);

    // CORRECT USER FLAGS:
    // Brad (bradturnbough80@gmail.com) = Developer, lifetime subscription, NO special screens
    // Briana (brianaolszewski1@gmail.com) = Creator (is_creator), lifetime subscription, sees Brad's love note
    // Donna (dwoodswoods2@gmail.com) = Special User (is_special_user), lifetime subscription, sees Brad's mom note

    const is_creator = userData.email === 'brianaolszewski1@gmail.com';
    const is_special_user = userData.email === 'dwoodswoods2@gmail.com';
    const is_developer = userData.email === 'bradturnbough80@gmail.com';
    const has_lifetime = is_creator || is_special_user || is_developer;

    // Generate unique ID (matching the format used in JSON migration)
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        age_verified, is_creator, is_special_user, has_lifetime_subscription,
        points
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      id,
      userData.email,
      password_hash,
      userData.first_name,
      userData.last_name,
      userData.age_verified,
      is_creator,
      is_special_user,
      has_lifetime,
      is_creator ? 1000 : is_special_user ? 500 : is_developer ? 1000 : 0, // Bonus points
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(id: string): Promise<void> {
    const query = 'UPDATE users SET last_login_at = NOW() WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async deleteUser(id: string): Promise<void> {
    // GDPR compliance - delete all user data
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [id]);
  }

  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const password_hash = await bcrypt.hash(newPassword, 12);
    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(query, [password_hash, id]);
  }

  static async exportUserData(id: string): Promise<any> {
    // GDPR compliance - export all user data
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const ingredientsQuery =
      'SELECT * FROM user_ingredients WHERE user_id = $1';
    const recipesQuery = 'SELECT * FROM user_recipes WHERE user_id = $1';
    const shoppingQuery = 'SELECT * FROM shopping_lists WHERE user_id = $1';

    const [user, ingredients, recipes, shopping] = await Promise.all([
      pool.query(userQuery, [id]),
      pool.query(ingredientsQuery, [id]),
      pool.query(recipesQuery, [id]),
      pool.query(shoppingQuery, [id]),
    ]);

    return {
      user: user.rows[0],
      ingredients: ingredients.rows,
      recipes: recipes.rows,
      shopping_lists: shopping.rows,
      exported_at: new Date().toISOString(),
    };
  }
}
