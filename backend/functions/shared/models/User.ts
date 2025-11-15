/**
 * User Model
 * Database operations for users table
 */

import { query } from '../db';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_co_founder: boolean;
  subscription_status: string;
  subscription_expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_co_founder?: boolean;
  subscription_status?: string;
}

/**
 * Create a new user
 */
export const create = async (data: CreateUserData): Promise<User> => {
  const sql = `
    INSERT INTO users (
      email, password_hash, first_name, last_name, 
      is_co_founder, subscription_status
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  const values = [
    data.email,
    data.password_hash,
    data.first_name || null,
    data.last_name || null,
    data.is_co_founder || false,
    data.subscription_status || 'free',
  ];

  const result = await query(sql, values);
  return result.rows[0];
};

/**
 * Find user by email
 */
export const findByEmail = async (email: string): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const result = await query(sql, [email]);
  return result.rows[0] || null;
};

/**
 * Find user by ID
 */
export const findById = async (id: number): Promise<User | null> => {
  const sql = 'SELECT * FROM users WHERE id = $1';
  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

/**
 * Update user
 */
export const update = async (
  id: number,
  updates: Partial<User>
): Promise<User | null> => {
  const allowedFields = ['first_name', 'last_name', 'password_hash'];
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key as keyof User]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const sql = `
    UPDATE users 
    SET ${fields.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;

  const result = await query(sql, values);
  return result.rows[0] || null;
};

/**
 * Delete user
 */
export const deleteUser = async (id: number): Promise<boolean> => {
  const sql = 'DELETE FROM users WHERE id = $1';
  const result = await query(sql, [id]);
  return (result.rowCount || 0) > 0;
};
