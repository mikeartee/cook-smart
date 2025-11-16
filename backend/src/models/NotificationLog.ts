import pool from '../config/database';

interface NotificationLog {
  id: string;
  type: 'error' | 'feedback' | 'activity' | 'health';
  channel: 'error' | 'feedback' | 'activity';
  payload: any;
  sent_at: Date;
  success: boolean;
  error_message?: string;
  created_at: Date;
}

interface CreateNotificationLogParams {
  type: 'error' | 'feedback' | 'activity' | 'health';
  channel: 'error' | 'feedback' | 'activity';
  payload: any;
  success: boolean;
  error_message?: string;
}

class NotificationLogModel {
  /**
   * Create a new notification log entry
   */
  async create(params: CreateNotificationLogParams): Promise<NotificationLog> {
    const query = `
      INSERT INTO notification_logs (type, channel, payload, success, error_message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [
      params.type,
      params.channel,
      JSON.stringify(params.payload),
      params.success,
      params.error_message || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find recent notification logs
   */
  async findRecent(limit: number = 50): Promise<NotificationLog[]> {
    const query = `
      SELECT * FROM notification_logs
      ORDER BY sent_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Find logs by type
   */
  async findByType(type: string, limit: number = 50): Promise<NotificationLog[]> {
    const query = `
      SELECT * FROM notification_logs
      WHERE type = $1
      ORDER BY sent_at DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [type, limit]);
    return result.rows;
  }

  /**
   * Find failed notifications
   */
  async findFailed(limit: number = 50): Promise<NotificationLog[]> {
    const query = `
      SELECT * FROM notification_logs
      WHERE success = false
      ORDER BY sent_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get notification statistics
   */
  async getStats(since?: Date): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    byType: Record<string, number>;
  }> {
    const sinceClause = since ? 'WHERE sent_at >= $1' : '';
    const values = since ? [since] : [];

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
        type,
        COUNT(*) as type_count
      FROM notification_logs
      ${sinceClause}
      GROUP BY type
    `;

    const result = await pool.query(query, values);

    let total = 0;
    let successful = 0;
    let failed = 0;
    const byType: Record<string, number> = {};

    for (const row of result.rows) {
      total += parseInt(row.total);
      successful += parseInt(row.successful);
      failed += parseInt(row.failed);
      byType[row.type] = parseInt(row.type_count);
    }

    const successRate = total > 0 ? successful / total : 0;

    return {
      total,
      successful,
      failed,
      successRate,
      byType,
    };
  }

  /**
   * Delete old logs (older than 30 days)
   */
  async deleteOld(): Promise<number> {
    const query = `
      DELETE FROM notification_logs
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;

    const result = await pool.query(query);
    return result.rowCount || 0;
  }
}

export default new NotificationLogModel();
export { NotificationLog, CreateNotificationLogParams };
