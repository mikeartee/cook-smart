import pool from '../config/database';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_co_founder: boolean;
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
    
    // Check if Co-Founder
    const is_co_founder = userData.email === 'brianaolszewski1@gmail.com';
    
    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, 
        age_verified, is_co_founder, has_lifetime_subscription
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      userData.email,
      password_hash,
      userData.first_name,
      userData.last_name,
      userData.age_verified,
      is_co_founder,
      is_co_founder // Co-founder gets lifetime subscription
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
  
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
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
  
  static async exportUserData(id: string): Promise<any> {
    // GDPR compliance - export all user data
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const ingredientsQuery = 'SELECT * FROM user_ingredients WHERE user_id = $1';
    const recipesQuery = 'SELECT * FROM user_recipes WHERE user_id = $1';
    const shoppingQuery = 'SELECT * FROM shopping_lists WHERE user_id = $1';
    
    const [user, ingredients, recipes, shopping] = await Promise.all([
      pool.query(userQuery, [id]),
      pool.query(ingredientsQuery, [id]),
      pool.query(recipesQuery, [id]),
      pool.query(shoppingQuery, [id])
    ]);
    
    return {
      user: user.rows[0],
      ingredients: ingredients.rows,
      recipes: recipes.rows,
      shopping_lists: shopping.rows,
      exported_at: new Date().toISOString()
    };
  }
}
