import pool from '../config/database';

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  details: object | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface LogAuditData {
  adminId: number;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: object;
  ipAddress?: string;
  userAgent?: string;
}

class AdminAuditLoggerService {
  /**
   * Log an admin action for audit trail
   */
  async log(data: LogAuditData): Promise<void> {
    try {
      const query = `
        INSERT INTO admin_audit_logs (
          admin_id, action, resource_type, resource_id, details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const values = [
        data.adminId,
        data.action,
        data.resourceType,
        data.resourceId,
        data.details ? JSON.stringify(data.details) : null,
        data.ipAddress || null,
        data.userAgent || null,
      ];

      await pool.query(query, values);
    } catch (error) {
      console.error('Failed to log admin audit:', error);
      // Don't throw error - audit logging failure shouldn't break the application
    }
  }

  /**
   * Get audit logs with pagination
   */
  async getLogs(page: number = 1, limit: number = 50, filters?: {
    adminId?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    logs: AdminAuditLog[];
    total: number;
    page: number;
    pages: number;
  }> {
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Build WHERE clause
    if (filters?.adminId) {
      conditions.push(`admin_id = $${paramCount}`);
      values.push(filters.adminId);
      paramCount++;
    }

    if (filters?.action) {
      conditions.push(`action = $${paramCount}`);
      values.push(filters.action);
      paramCount++;
    }

    if (filters?.resourceType) {
      conditions.push(`resource_type = $${paramCount}`);
      values.push(filters.resourceType);
      paramCount++;
    }

    if (filters?.startDate) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(filters.endDate);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM admin_audit_logs ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get logs
    const query = `
      SELECT 
        aal.*,
        au.email as admin_email,
        au.username as admin_username
      FROM admin_audit_logs aal
      LEFT JOIN admin_users au ON aal.admin_id = au.id
      ${whereClause}
      ORDER BY aal.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await pool.query(query, values);

    return {
      logs: result.rows,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs for specific resource
   */
  async getLogsByResource(resourceType: string, resourceId: string, limit: number = 20): Promise<AdminAuditLog[]> {
    const query = `
      SELECT 
        aal.*,
        au.email as admin_email,
        au.username as admin_username
      FROM admin_audit_logs aal
      LEFT JOIN admin_users au ON aal.admin_id = au.id
      WHERE aal.resource_type = $1 AND aal.resource_id = $2
      ORDER BY aal.created_at DESC
      LIMIT $3
    `;

    const result = await pool.query(query, [resourceType, resourceId, limit]);
    return result.rows;
  }

  /**
   * Get audit logs for specific admin
   */
  async getLogsByAdmin(adminId: number, limit: number = 50): Promise<AdminAuditLog[]> {
    const query = `
      SELECT * FROM admin_audit_logs
      WHERE admin_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [adminId, limit]);
    return result.rows;
  }

  /**
   * Clean up old audit logs (older than 1 year)
   */
  async cleanupOldLogs(): Promise<number> {
    const query = `
      DELETE FROM admin_audit_logs
      WHERE created_at < NOW() - INTERVAL '1 year'
      RETURNING id
    `;

    const result = await pool.query(query);
    return result.rows.length;
  }
}

export default new AdminAuditLoggerService();
