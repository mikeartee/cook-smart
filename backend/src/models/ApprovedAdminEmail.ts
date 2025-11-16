import pool from '../config/database';

export interface ApprovedAdminEmail {
  id: number;
  email: string;
  is_super_admin: boolean;
  added_by: number | null;
  added_at: Date;
}

class ApprovedAdminEmailModel {
  /**
   * Get all approved admin emails
   */
  async getAll(): Promise<ApprovedAdminEmail[]> {
    const query = `
      SELECT * FROM approved_admin_emails
      ORDER BY added_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Check if email is approved
   */
  async isApproved(email: string): Promise<boolean> {
    const query = 'SELECT id FROM approved_admin_emails WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Check if email is super admin
   */
  async isSuperAdmin(email: string): Promise<boolean> {
    const query = 'SELECT id FROM approved_admin_emails WHERE email = $1 AND is_super_admin = TRUE';
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Add email to approved list
   */
  async add(email: string, isSuperAdmin: boolean, addedBy: number): Promise<ApprovedAdminEmail> {
    const query = `
      INSERT INTO approved_admin_emails (email, is_super_admin, added_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [email, isSuperAdmin, addedBy]);
    return result.rows[0];
  }

  /**
   * Remove email from approved list
   */
  async remove(email: string): Promise<boolean> {
    // Don't allow removing the initial super admin email
    const query = `
      DELETE FROM approved_admin_emails 
      WHERE email = $1 AND email != 'tootallgames2020@gmail.com'
      RETURNING id
    `;
    const result = await pool.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Update super admin status
   */
  async updateSuperAdminStatus(email: string, isSuperAdmin: boolean): Promise<boolean> {
    const query = `
      UPDATE approved_admin_emails 
      SET is_super_admin = $1
      WHERE email = $2
      RETURNING id
    `;
    const result = await pool.query(query, [isSuperAdmin, email]);
    return result.rows.length > 0;
  }

  /**
   * Change super admin email (transfer super admin privileges)
   */
  async changeSuperAdminEmail(oldEmail: string, newEmail: string, addedBy: number): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove super admin from old email
      await client.query(
        'UPDATE approved_admin_emails SET is_super_admin = FALSE WHERE email = $1',
        [oldEmail]
      );

      // Check if new email exists
      const checkQuery = 'SELECT id FROM approved_admin_emails WHERE email = $1';
      const checkResult = await client.query(checkQuery, [newEmail]);

      if (checkResult.rows.length > 0) {
        // Update existing email to super admin
        await client.query(
          'UPDATE approved_admin_emails SET is_super_admin = TRUE WHERE email = $1',
          [newEmail]
        );
      } else {
        // Add new email as super admin
        await client.query(
          'INSERT INTO approved_admin_emails (email, is_super_admin, added_by) VALUES ($1, TRUE, $2)',
          [newEmail, addedBy]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new ApprovedAdminEmailModel();
