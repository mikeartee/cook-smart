import pool from '../config/database';

export interface ErrorLog {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  error_type: string;
  message: string;
  stack?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  user_id?: string;
  request_body?: any;
  resolved: boolean;
  resolved_at?: Date;
  resolved_by?: string;
  created_at: Date;
}

class ErrorLogModel {
  /**
   * Log an error to the database
   */
  static async log(data: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    errorType: string;
    message: string;
    stack?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    userId?: string;
    requestBody?: any;
  }): Promise<ErrorLog> {
    const query = `
      INSERT INTO error_logs (
        severity, error_type, message, stack, endpoint, method, 
        status_code, user_id, request_body, resolved, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW())
      RETURNING *
    `;

    const values = [
      data.severity,
      data.errorType,
      data.message,
      data.stack || null,
      data.endpoint || null,
      data.method || null,
      data.statusCode || null,
      data.userId || null,
      data.requestBody ? JSON.stringify(data.requestBody) : null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent errors
   */
  static async getRecent(limit: number = 50): Promise<ErrorLog[]> {
    const query = `
      SELECT * FROM error_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get unresolved errors
   */
  static async getUnresolved(): Promise<ErrorLog[]> {
    const query = `
      SELECT * FROM error_logs
      WHERE resolved = false
      ORDER BY 
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        created_at DESC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Mark error as resolved
   */
  static async markResolved(id: number, resolvedBy: string): Promise<void> {
    const query = `
      UPDATE error_logs
      SET resolved = true, resolved_at = NOW(), resolved_by = $2
      WHERE id = $1
    `;

    await pool.query(query, [id, resolvedBy]);
  }

  /**
   * Get error statistics
   */
  static async getStats(): Promise<{
    total: number;
    unresolved: number;
    bySeverity: Record<string, number>;
    last24Hours: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE resolved = false) as unresolved,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium,
        COUNT(*) FILTER (WHERE severity = 'low') as low,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24_hours
      FROM error_logs
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      unresolved: parseInt(row.unresolved),
      bySeverity: {
        critical: parseInt(row.critical),
        high: parseInt(row.high),
        medium: parseInt(row.medium),
        low: parseInt(row.low),
      },
      last24Hours: parseInt(row.last_24_hours),
    };
  }
}

export default ErrorLogModel;
