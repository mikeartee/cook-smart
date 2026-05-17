// import NotificationService from './NotificationService';
import HealthMonitor from './HealthMonitor';
import pool from '../config/database';

interface SystemHealth {
  backend: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  apis: 'healthy' | 'degraded' | 'down';
  overall: 'healthy' | 'degraded' | 'critical';
}

interface RepairAction {
  type: 'reconnect';
  reason: string;
  timestamp: Date;
  success: boolean;
  details: string;
}

/**
 * System Guardian - Advanced monitoring and auto-repair system
 * Monitors the entire application and performs automatic repairs
 * Sends Discord notifications for all actions
 */
class SystemGuardian {
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private repairHistory: RepairAction[] = [];
  private consecutiveFailures: number = 0;
  private lastHealthCheck: Date = new Date();
  private isMonitoring: boolean = false;

  // Thresholds
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  private readonly CRITICAL_ERROR_RATE = 0.15; // 15%

  /**
   * Start monitoring the system
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('⚠️  System Guardian already monitoring');
      return;
    }

    console.log('🛡️  System Guardian activated - monitoring started');
    this.isMonitoring = true;

    // Send startup notification
    this.sendDiscordNotification(
      '🛡️ System Guardian Activated',
      'Automated monitoring and repair system is now active',
      'info',
    );

    // Start periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    // Perform immediate health check
    this.performHealthCheck();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('🛡️  System Guardian deactivated');

    this.sendDiscordNotification(
      '🛡️ System Guardian Deactivated',
      'Monitoring has been stopped',
      'warning',
    );
  }

  /**
   * Perform comprehensive health check
   *
   * Note: as of issue #22 (PRD #20 / slice #21), exceeding
   * MAX_CONSECUTIVE_FAILURES no longer triggers any in-process
   * recovery action. The Discord notification still fires so a
   * human can intervene.
   */
  private async performHealthCheck(): Promise<void> {
    try {
      this.lastHealthCheck = new Date();
      const health = await this.checkSystemHealth();

      // Log health status
      console.log(`🏥 Health Check: ${health.overall.toUpperCase()}`);

      // Take action based on health
      if (health.overall === 'critical') {
        await this.handleCriticalState(health);
      } else if (health.overall === 'degraded') {
        await this.handleDegradedState(health);
      } else {
        // Reset failure counter on healthy state
        if (this.consecutiveFailures > 0) {
          this.sendDiscordNotification(
            '✅ System Recovered',
            `System is now healthy after ${this.consecutiveFailures} failures`,
            'success',
          );
          this.consecutiveFailures = 0;
        }
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.sendDiscordNotification(
          '🚨 Repeated Health Check Failures',
          `Health checks have failed ${this.consecutiveFailures} times in a row. Manual intervention required.`,
          'error',
        );
      }
    }
  }

  /**
   * Check overall system health
   */
  private async checkSystemHealth(): Promise<SystemHealth> {
    const [backendHealth, databaseHealth, apiHealth] = await Promise.all([
      this.checkBackendHealth(),
      this.checkDatabaseHealth(),
      this.checkAPIHealth(),
    ]);

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';

    if (
      backendHealth === 'down' ||
      databaseHealth === 'down' ||
      apiHealth === 'down'
    ) {
      overall = 'critical';
    } else if (
      backendHealth === 'degraded' ||
      databaseHealth === 'degraded' ||
      apiHealth === 'degraded'
    ) {
      overall = 'degraded';
    }

    return {
      backend: backendHealth,
      database: databaseHealth,
      apis: apiHealth,
      overall,
    };
  }

  /**
   * Check backend health
   */
  private async checkBackendHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const errorRate = HealthMonitor.getErrorRate();

      if (errorRate > this.CRITICAL_ERROR_RATE) return 'down';
      if (errorRate > 0.05) return 'degraded';
      return 'healthy';
    } catch (_error) {
      return 'down';
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth(): Promise<
    'healthy' | 'degraded' | 'down'
  > {
    return await HealthMonitor.checkDatabaseStatus();
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      await HealthMonitor.getAPIUsage();

      // Check if APIs are responding (basic check)
      // Could be enhanced with actual API health endpoints
      return 'healthy';
    } catch (_error) {
      return 'degraded';
    }
  }

  /**
   * Handle degraded system state
   */
  private async handleDegradedState(health: SystemHealth): Promise<void> {
    console.log('⚠️  System degraded - attempting repairs');

    this.sendDiscordNotification(
      '⚠️ System Degraded',
      `Backend: ${health.backend}\nDatabase: ${health.database}\nAPIs: ${health.apis}`,
      'warning',
    );

    // Attempt targeted repairs
    if (health.database === 'degraded') {
      await this.repairDatabase();
    }
  }

  /**
   * Handle critical system state
   *
   * As of issue #22, this method only attempts the database-reconnect
   * advisory and notifies Discord. The prior `restartBackend` and
   * `initiateNuclearOption` paths — which spawned `pm2 restart` /
   * `git pull` / `npm install` from inside the running Node process —
   * have been removed. As of issue #42 the database probe is a direct
   * `pool.query('SELECT 1')` instead of going through the deleted
   * AutoRepairSystem wrapper.
   */
  private async handleCriticalState(health: SystemHealth): Promise<void> {
    console.log('🚨 CRITICAL: System in critical state');
    this.consecutiveFailures++;

    this.sendDiscordNotification(
      '🚨 CRITICAL: System Failure',
      `Backend: ${health.backend}\nDatabase: ${health.database}\nAPIs: ${health.apis}\nConsecutive failures: ${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES}`,
      'error',
    );

    // Attempt non-destructive repairs based on what's failing
    if (health.database === 'down') {
      await this.repairDatabase();
    }

    // Note: backend-restart path removed in issue #22; if backend is
    // 'down' we surface the alert and rely on external supervision.
  }

  /**
   * Repair database connection
   */
  private async repairDatabase(): Promise<void> {
    const action: RepairAction = {
      type: 'reconnect',
      reason: 'Database connection issues',
      timestamp: new Date(),
      success: false,
      details: '',
    };

    try {
      console.log('🔧 Attempting database repair...');

      // Direct pg probe (replaces AutoRepairSystem.attemptRepair from #42).
      // The pg Pool reconnects on demand; this just confirms reachability
      // and surfaces any auth/network failures to the Discord channel.
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      action.success = true;
      action.details = 'Database connection probe succeeded';

      this.sendDiscordNotification(
        '✅ Database Repaired',
        action.details,
        'success',
      );
    } catch (error) {
      action.details = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database repair failed:', error);

      this.sendDiscordNotification(
        '❌ Database Repair Failed',
        action.details,
        'error',
      );
    }

    this.repairHistory.push(action);
  }

  /**
   * Send notification to Discord
   */
  private async sendDiscordNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
  ): Promise<void> {
    try {
      // const colors = {
      //   info: 3447003, // Blue
      //   success: 3066993, // Green
      //   warning: 16776960, // Yellow
      //   error: 15158332, // Red
      // };

      // const emoji = {
      //   info: 'ℹ️',
      //   success: '✅',
      //   warning: '⚠️',
      //   error: '🚨',
      // };

      // TODO: Implement sendCustomNotification in NotificationService
      // await NotificationService.sendCustomNotification({
      //   title: `${emoji[type]} ${title}`,
      //   description: message,
      //   color: colors[type],
      //   timestamp: new Date().toISOString(),
      //   footer: 'System Guardian',
      // });
      console.log(
        `[SystemGuardian] ${type.toUpperCase()}: ${title} - ${message}`,
      );
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }

  /**
   * Get repair history
   */
  getRepairHistory(): RepairAction[] {
    return this.repairHistory;
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    lastHealthCheck: Date;
    consecutiveFailures: number;
    repairCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      repairCount: this.repairHistory.length,
    };
  }
}

export default new SystemGuardian();
