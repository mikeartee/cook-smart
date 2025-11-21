/**
 * API Usage Log Model
 *
 * Tracks all API calls to external recipe providers for monitoring and analytics
 */

import pool from '../config/database';

export interface APIUsageLog {
  id: string;
  provider: string;
  endpoint: string;
  timestamp: Date;
  success: boolean;
  cached: boolean;
  response_time: number;
  error_message?: string;
}

export class APIUsageLogModel {
  /**
   * Log an API call
   */
  static async logAPICall(
    provider: string,
    endpoint: string,
    success: boolean,
    cached: boolean,
    responseTime: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO api_usage_logs (provider, endpoint, timestamp, success, cached, response_time, error_message)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6)`,
        [
          provider,
          endpoint,
          success,
          cached,
          responseTime,
          errorMessage || null,
        ],
      );
    } catch (_error) {
      // Silently fail if table doesn't exist - logging is optional
      // The recipe system will work fine without it
    }
  }

  /**
   * Get usage statistics for today
   */
  static async getTodayStats(): Promise<any> {
    const result = await pool.query(
      `SELECT 
        provider,
        COUNT(*) as total_calls,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
        SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_calls,
        AVG(response_time) as avg_response_time
       FROM api_usage_logs
       WHERE timestamp >= CURRENT_DATE
       GROUP BY provider`,
    );

    return result.rows;
  }

  /**
   * Get usage statistics for a specific provider today
   */
  static async getProviderStatsToday(provider: string): Promise<any> {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_calls,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
        SUM(CASE WHEN cached THEN 1 ELSE 0 END) as cached_calls,
        AVG(response_time) as avg_response_time
       FROM api_usage_logs
       WHERE provider = $1 AND timestamp >= CURRENT_DATE`,
      [provider],
    );

    return (
      result.rows[0] || {
        total_calls: 0,
        successful_calls: 0,
        cached_calls: 0,
        avg_response_time: 0,
      }
    );
  }

  /**
   * Check if provider is approaching rate limit (80% threshold)
   */
  static async checkRateLimitWarning(
    provider: string,
    dailyLimit: number,
  ): Promise<boolean> {
    const stats = await this.getProviderStatsToday(provider);
    const threshold = dailyLimit * 0.8;

    if (parseInt(stats.total_calls) >= threshold) {
      console.warn(
        `⚠️  ${provider} approaching rate limit: ${stats.total_calls}/${dailyLimit} (${Math.round((stats.total_calls / dailyLimit) * 100)}%)`,
      );
      return true;
    }

    return false;
  }

  /**
   * Get recent errors for debugging
   */
  static async getRecentErrors(limit: number = 10): Promise<APIUsageLog[]> {
    const result = await pool.query(
      `SELECT * FROM api_usage_logs
       WHERE success = false
       ORDER BY timestamp DESC
       LIMIT $1`,
      [limit],
    );

    return result.rows;
  }

  /**
   * Clean up old logs (keep last 30 days)
   */
  static async cleanupOldLogs(): Promise<number> {
    const result = await pool.query(
      `DELETE FROM api_usage_logs
       WHERE timestamp < NOW() - INTERVAL '30 days'
       RETURNING id`,
    );

    return result.rowCount || 0;
  }
}
