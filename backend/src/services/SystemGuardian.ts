import {exec} from 'child_process';
import {promisify} from 'util';
import NotificationService from './NotificationService';
import AutoRepairSystem from './AutoRepairSystem';
import HealthMonitor from './HealthMonitor';

const execAsync = promisify(exec);

interface SystemHealth {
  backend: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  apis: 'healthy' | 'degraded' | 'down';
  overall: 'healthy' | 'degraded' | 'critical';
}

interface RepairAction {
  type: 'restart' | 'reconnect' | 'rebuild' | 'nuke';
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
        await this.initiateNuclearOption(
          'Health check failures exceeded threshold',
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
   */
  private async handleCriticalState(health: SystemHealth): Promise<void> {
    console.log('🚨 CRITICAL: System in critical state');
    this.consecutiveFailures++;

    this.sendDiscordNotification(
      '🚨 CRITICAL: System Failure',
      `Backend: ${health.backend}\nDatabase: ${health.database}\nAPIs: ${health.apis}\nConsecutive failures: ${this.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES}`,
      'error',
    );

    // Attempt repairs based on what's failing
    if (health.database === 'down') {
      await this.repairDatabase();
    }

    if (health.backend === 'down') {
      await this.restartBackend();
    }

    // If too many consecutive failures, initiate nuclear option
    if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      await this.initiateNuclearOption('Maximum consecutive failures reached');
    }
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

      const error = new Error('Database connection issue');
      const result = await AutoRepairSystem.attemptRepair(error);

      if (result?.success) {
        action.success = true;
        action.details = result.message;

        this.sendDiscordNotification(
          '✅ Database Repaired',
          result.message,
          'success',
        );
      } else {
        action.details = result?.message || 'Repair failed';

        this.sendDiscordNotification(
          '❌ Database Repair Failed',
          action.details,
          'error',
        );
      }
    } catch (error) {
      action.details = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Database repair failed:', error);
    }

    this.repairHistory.push(action);
  }

  /**
   * Restart backend service
   */
  private async restartBackend(): Promise<void> {
    const action: RepairAction = {
      type: 'restart',
      reason: 'Backend service failure',
      timestamp: new Date(),
      success: false,
      details: '',
    };

    try {
      console.log('🔄 Restarting backend service...');

      this.sendDiscordNotification(
        '🔄 Restarting Backend',
        'Attempting to restart PM2 process',
        'warning',
      );

      // Restart PM2 process
      await execAsync('pm2 restart cook-smart-backend');

      action.success = true;
      action.details = 'Backend restarted successfully';

      this.sendDiscordNotification(
        '✅ Backend Restarted',
        'PM2 process restarted successfully',
        'success',
      );

      // Reset failure counter
      this.consecutiveFailures = 0;
    } catch (error) {
      action.details = error instanceof Error ? error.message : 'Unknown error';

      this.sendDiscordNotification(
        '❌ Backend Restart Failed',
        action.details,
        'error',
      );

      console.error('❌ Backend restart failed:', error);
    }

    this.repairHistory.push(action);
  }

  /**
   * Nuclear option - rebuild everything
   * This is the last resort when all other repairs fail
   */
  private async initiateNuclearOption(reason: string): Promise<void> {
    console.log('☢️  NUCLEAR OPTION INITIATED');

    this.sendDiscordNotification(
      '☢️ NUCLEAR OPTION INITIATED',
      `Reason: ${reason}\n\nRebuilding entire system...`,
      'error',
    );

    const action: RepairAction = {
      type: 'nuke',
      reason,
      timestamp: new Date(),
      success: false,
      details: '',
    };

    try {
      // Step 1: Stop all services
      await execAsync('pm2 stop all');

      // Step 2: Pull latest code
      await execAsync('git pull origin fresh-project-migration');

      // Step 3: Reinstall dependencies
      await execAsync('npm install');

      // Step 4: Rebuild
      await execAsync('npm run build');

      // Step 5: Restart services
      await execAsync('pm2 restart all');

      action.success = true;
      action.details = 'System rebuilt and restarted successfully';

      this.sendDiscordNotification(
        '✅ System Rebuilt',
        'Nuclear option completed successfully. System is back online.',
        'success',
      );

      // Reset failure counter
      this.consecutiveFailures = 0;
    } catch (error) {
      action.details = error instanceof Error ? error.message : 'Unknown error';

      this.sendDiscordNotification(
        '🚨 NUCLEAR OPTION FAILED',
        `System rebuild failed: ${action.details}\n\n**MANUAL INTERVENTION REQUIRED**`,
        'error',
      );

      console.error('☢️  Nuclear option failed:', error);
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
      const colors = {
        info: 3447003, // Blue
        success: 3066993, // Green
        warning: 16776960, // Yellow
        error: 15158332, // Red
      };

      const emoji = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '🚨',
      };

      await NotificationService.sendCustomNotification({
        title: `${emoji[type]} ${title}`,
        description: message,
        color: colors[type],
        timestamp: new Date().toISOString(),
        footer: 'System Guardian',
      });
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

  /**
   * Manual trigger for nuclear option (for testing or emergency)
   */
  async manualNuke(reason: string): Promise<void> {
    console.log('☢️  Manual nuclear option triggered');
    await this.initiateNuclearOption(`Manual trigger: ${reason}`);
  }
}

export default new SystemGuardian();
