import pool from '../config/database';

export interface AdminActivityLog {
  id: number;
  admin_id: number | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  details: object | null;
  created_at: Date;
}

export interface LogActivityData {
  adminId?: number;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: object;
}

class AdminActivityLoggerService {
  /**
   * Log an admin activity
   */
  async log(data: LogActivityData): Promise<void> {
    try {
      const query = `
        INSERT INTO admin_activity_logs (
          admin_id, action, ip_address, user_agent, success, details
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

      const values = [
        data.adminId || null,
        data.action,
        data.ipAddress || null,
        data.userAgent || null,
        data.success,
        data.details ? JSON.stringify(data.details) : null,
      ];

      await pool.query(query, values);
    } catch (error) {
      console.error('Failed to log admin activity:', error);
      // Don't throw error - logging failure shouldn't break the application
    }
  }

  /**
   * Log successful login
   */
  async logLogin(adminId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      adminId,
      action: 'login',
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log failed login attempt
   */
  async logFailedLogin(username: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'failed_login',
      ipAddress,
      userAgent,
      success: false,
      details: { username },
    });
  }

  /**
   * Log logout
   */
  async logLogout(adminId: number, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      adminId,
      action: 'logout',
      ipAddress,
      userAgent,
      success: true,
    });
  }

  /**
   * Log signup attempt
   */
  async logSignup(email: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.log({
      action: 'signup',
      ipAddress,
      userAgent,
      success,
      details: { email },
    });
  }

  /**
   * Log email verification
   */
  async logEmailVerification(adminId: number, success: boolean): Promise<void> {
    await this.log({
      adminId,
      action: 'email_verification',
      success,
    });
  }

  /**
   * Log password reset request
   */
  async logPasswordResetRequest(email: string, ipAddress?: string): Promise<void> {
    await this.log({
      action: 'password_reset_request',
      ipAddress,
      success: true,
      details: { email },
    });
  }

  /**
   * Log password reset completion
   */
  async logPasswordReset(adminId: number, success: boolean): Promise<void> {
    await this.log({
      adminId,
      action: 'password_reset',
      success,
    });
  }

  /**
   * Get recent activity logs
   */
  async getRecentLogs(limit: number = 100): Promise<AdminActivityLog[]> {
    const query = `
      SELECT 
        aal.*,
        au.email as admin_email,
        au.username as admin_username
      FROM admin_activity_logs aal
      LEFT JOIN admin_users au ON aal.admin_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get activity logs for specific admin
   */
  async getLogsByAdmin(adminId: number, limit: number = 50): Promise<AdminActivityLog[]> {
    const query = `
      SELECT * FROM admin_activity_logs
      WHERE admin_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [adminId, limit]);
    return result.rows;
  }

  /**
   * Get failed login attempts
   */
  async getFailedLogins(limit: number = 50): Promise<AdminActivityLog[]> {
    const query = `
      SELECT * FROM admin_activity_logs
      WHERE action = 'failed_login' AND success = FALSE
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get activity logs with pagination
   */
  async getLogsPaginated(page: number = 1, limit: number = 50): Promise<{
    logs: AdminActivityLog[];
    total: number;
    page: number;
    pages: number;
  }> {
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM admin_activity_logs';
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    // Get logs
    const query = `
      SELECT 
        aal.*,
        au.email as admin_email,
        au.username as admin_username
      FROM admin_activity_logs aal
      LEFT JOIN admin_users au ON aal.admin_id = au.id
      ORDER BY aal.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await pool.query(query, [limit, offset]);

    return {
      logs: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Clean up old logs (older than 90 days)
   */
  async cleanupOldLogs(): Promise<number> {
    const query = `
      DELETE FROM admin_activity_logs
      WHERE created_at < NOW() - INTERVAL '90 days'
      RETURNING id
    `;

    const result = await pool.query(query);
    return result.rows.length;
  }
}

export default new AdminActivityLoggerService();
