import pool from '../config/database';
import {APIUsageLogModel} from '../models/APIUsageLog';
import NotificationService from './NotificationService';

interface HealthStats {
  totalErrors: number;
  errorRate: number;
  uptime: number;
  apiUsage: {
    edamam: number;
    themealdb: number;
  };
  databaseStatus: 'healthy' | 'degraded' | 'down';
}

class HealthMonitor {
  private startTime: Date;
  private totalRequests: number;
  private errorCount: number;
  private lastErrorRate: number;
  private isInErrorState: boolean;

  constructor() {
    this.startTime = new Date();
    this.totalRequests = 0;
    this.errorCount = 0;
    this.lastErrorRate = 0;
    this.isInErrorState = false;
  }

  /**
   * Record a request
   */
  recordRequest(isError: boolean = false): void {
    this.totalRequests++;
    if (isError) {
      this.errorCount++;
    }

    // Check if error rate exceeds threshold
    const errorRate = this.getErrorRate();
    if (errorRate > 0.05 && !this.isInErrorState) {
      this.sendHighErrorRateAlert(errorRate);
      this.isInErrorState = true;
    } else if (errorRate <= 0.01 && this.isInErrorState) {
      this.sendRecoveryNotification(errorRate);
      this.isInErrorState = false;
    }

    this.lastErrorRate = errorRate;
  }

  /**
   * Get current error rate
   */
  getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return this.errorCount / this.totalRequests;
  }

  /**
   * Get uptime percentage
   */
  getUptime(): number {
    // Simple uptime calculation - could be enhanced with actual downtime tracking
    return this.isInErrorState ? 0.95 : 0.99;
  }

  /**
   * Check database status
   */
  async checkDatabaseStatus(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const client = await pool.connect();
      const start = Date.now();
      await client.query('SELECT 1');
      const duration = Date.now() - start;
      client.release();

      if (duration < 100) return 'healthy';
      if (duration < 500) return 'degraded';
      return 'down';
    } catch (error) {
      console.error('Database health check failed:', error);
      return 'down';
    }
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsage(): Promise<{edamam: number; themealdb: number}> {
    try {
      const todayStats = await APIUsageLogModel.getTodayStats();

      // todayStats is an array of rows, convert to object
      const stats = {
        edamam: 0,
        themealdb: 0,
      };

      if (Array.isArray(todayStats)) {
        todayStats.forEach((row: any) => {
          if (row.provider === 'edamam') {
            stats.edamam = parseInt(row.total_calls) || 0;
          } else if (row.provider === 'themealdb') {
            stats.themealdb = parseInt(row.total_calls) || 0;
          }
        });
      }

      return stats;
    } catch (_error) {
      // Silently handle - table might not exist yet
      return {edamam: 0, themealdb: 0};
    }
  }

  /**
   * Get complete health statistics
   */
  async getHealthStats(): Promise<HealthStats> {
    const databaseStatus = await this.checkDatabaseStatus();
    const apiUsage = await this.getAPIUsage();

    return {
      totalErrors: this.errorCount,
      errorRate: this.getErrorRate(),
      uptime: this.getUptime(),
      apiUsage,
      databaseStatus,
    };
  }

  /**
   * Send daily health summary
   */
  async sendDailyHealthSummary(): Promise<void> {
    try {
      console.log('📊 Sending daily health summary...');

      const stats = await this.getHealthStats();
      await NotificationService.sendHealthSummary(stats);

      console.log('✅ Daily health summary sent');

      // Reset daily counters
      this.errorCount = 0;
      this.totalRequests = 0;
    } catch (error) {
      console.error('Failed to send daily health summary:', error);
    }
  }

  /**
   * Send high error rate alert
   */
  private async sendHighErrorRateAlert(errorRate: number): Promise<void> {
    try {
      console.log(
        `⚠️  High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
      );

      // Temporarily disable Discord notifications to prevent cascade errors
      // TODO: Re-enable after Discord webhook issues are resolved
      console.log(
        `High error rate alert: ${(errorRate * 100).toFixed(2)}% - Discord notification disabled`,
      );

      // await NotificationService.sendErrorNotification(
      //   new Error(`High error rate: ${(errorRate * 100).toFixed(2)}%`),
      //   'high',
      //   {
      //     endpoint: 'system-health',
      //     affectedUsers: Math.floor(this.totalRequests * errorRate),
      //   },
      // ).catch(err => {
      //   console.error('Failed to send high error rate alert (non-critical):', err.message);
      // });
    } catch (error) {
      // Catch any synchronous errors and log them without throwing
      console.error('Failed to send high error rate alert:', error);
    }
  }

  /**
   * Send recovery notification
   */
  private async sendRecoveryNotification(errorRate: number): Promise<void> {
    try {
      console.log(
        `✅ System recovered - error rate: ${(errorRate * 100).toFixed(2)}%`,
      );

      await NotificationService.sendErrorNotification(
        new Error(
          `System recovered - error rate normalized to ${(errorRate * 100).toFixed(2)}%`,
        ),
        'low',
        {
          endpoint: 'system-health',
        },
      );
    } catch (error) {
      console.error('Failed to send recovery notification:', error);
    }
  }

  /**
   * Start daily health summary job
   */
  startDailyHealthSummary(): void {
    // Send summary at midnight UTC every day
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);

    const msUntilMidnight = midnight.getTime() - now.getTime();

    // Schedule first summary
    setTimeout(() => {
      this.sendDailyHealthSummary();

      // Then schedule daily
      setInterval(
        () => {
          this.sendDailyHealthSummary();
        },
        24 * 60 * 60 * 1000,
      ); // 24 hours
    }, msUntilMidnight);

    console.log(
      `✅ Daily health summary scheduled (next in ${Math.round(msUntilMidnight / 1000 / 60)} minutes)`,
    );
  }
}

export default new HealthMonitor();
