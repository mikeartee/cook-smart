import pool from '../config/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface AdminUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  name: string | null;
  is_super_admin: boolean;
  email_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAdminUserData {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface UpdateAdminUserData {
  name?: string;
  email?: string;
  password?: string;
  email_verified?: boolean;
  last_login?: Date;
}

class AdminUserModel {
  private readonly SALT_ROUNDS = 10;

  /**
   * Hash a password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verify a password against a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a random token for email verification or password reset
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new admin user
   */
  async create(data: CreateAdminUserData): Promise<AdminUser> {
    const passwordHash = await this.hashPassword(data.password);
    const verificationToken = this.generateToken();

    const query = `
      INSERT INTO admin_users (
        email, username, password_hash, name, verification_token
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      data.email,
      data.username,
      passwordHash,
      data.name || null,
      verificationToken,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find admin user by email
   */
  async findByEmail(email: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM admin_users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find admin user by username
   */
  async findByUsername(username: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM admin_users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * Find admin user by ID
   */
  async findById(id: number): Promise<AdminUser | null> {
    const query = 'SELECT * FROM admin_users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find admin user by verification token
   */
  async findByVerificationToken(token: string): Promise<AdminUser | null> {
    const query = 'SELECT * FROM admin_users WHERE verification_token = $1';
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Find admin user by reset token
   */
  async findByResetToken(token: string): Promise<AdminUser | null> {
    const query = `
      SELECT * FROM admin_users 
      WHERE reset_token = $1 
      AND reset_token_expires > NOW()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Update admin user
   */
  async update(id: number, data: UpdateAdminUserData): Promise<AdminUser | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }

    if (data.password !== undefined) {
      const passwordHash = await this.hashPassword(data.password);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (data.email_verified !== undefined) {
      updates.push(`email_verified = $${paramCount++}`);
      values.push(data.email_verified);
    }

    if (data.last_login !== undefined) {
      updates.push(`last_login = $${paramCount++}`);
      values.push(data.last_login);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE admin_users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<boolean> {
    const query = `
      UPDATE admin_users 
      SET email_verified = TRUE, verification_token = NULL, updated_at = NOW()
      WHERE verification_token = $1
      RETURNING id
    `;
    const result = await pool.query(query, [token]);
    return result.rows.length > 0;
  }

  /**
   * Set password reset token
   */
  async setResetToken(email: string): Promise<string | null> {
    const resetToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    const query = `
      UPDATE admin_users 
      SET reset_token = $1, reset_token_expires = $2, updated_at = NOW()
      WHERE email = $3
      RETURNING id
    `;

    const result = await pool.query(query, [resetToken, expiresAt, email]);
    return result.rows.length > 0 ? resetToken : null;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(newPassword);

    const query = `
      UPDATE admin_users 
      SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
      WHERE reset_token = $2 AND reset_token_expires > NOW()
      RETURNING id
    `;

    const result = await pool.query(query, [passwordHash, token]);
    return result.rows.length > 0;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<void> {
    const query = 'UPDATE admin_users SET last_login = NOW() WHERE id = $1';
    await pool.query(query, [id]);
  }

  /**
   * Get all admin users
   */
  async getAll(): Promise<AdminUser[]> {
    const query = `
      SELECT id, email, username, name, is_super_admin, email_verified, last_login, created_at
      FROM admin_users
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Delete admin user
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM admin_users WHERE id = $1 AND is_super_admin = FALSE RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Check if email is approved for admin access
   */
  async isEmailApproved(email: string): Promise<boolean> {
    const query = 'SELECT id FROM approved_admin_emails WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Check if email is approved as super admin
   */
  async isSuperAdminEmail(email: string): Promise<boolean> {
    const query = 'SELECT id FROM approved_admin_emails WHERE email = $1 AND is_super_admin = TRUE';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }
}

export default new AdminUserModel();
