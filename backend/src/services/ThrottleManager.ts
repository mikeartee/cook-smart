import crypto from 'crypto';
import NotificationService from './NotificationService';

type NotificationType = 'error' | 'feedback' | 'activity' | 'health';

interface ThrottleEntry {
  lastSent: Date;
  count: number;
  throttledCount: number;
}

class ThrottleManager {
  private throttleMap: Map<string, ThrottleEntry>;
  private cleanupInterval: ReturnType<typeof setInterval> | null;
  private summaryInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.throttleMap = new Map();
    this.cleanupInterval = null;
    this.summaryInterval = null;
    this.startBackgroundJobs();
  }

  /**
   * Check if notification should be sent based on throttling rules
   */
  shouldSendNotification(key: string, type: NotificationType, severity?: string): boolean {
    // Never throttle critical errors
    if (type === 'error' && severity === 'critical') {
      return true;
    }

    // Never throttle feedback and activity
    if (type === 'feedback' || type === 'activity') {
      return true;
    }

    // Never throttle health summaries
    if (type === 'health') {
      return true;
    }

    // Check throttle for errors
    const entry = this.throttleMap.get(key);
    
    if (!entry) {
      // First occurrence, allow
      return true;
    }

    const now = new Date();
    const timeSinceLastSent = now.getTime() - entry.lastSent.getTime();
    const oneMinute = 60 * 1000;

    if (timeSinceLastSent < oneMinute) {
      // Within throttle window, don't send
      return false;
    }

    // Throttle window passed, allow
    return true;
  }

  /**
   * Record that a notification was sent or throttled
   */
  recordNotification(key: string, type: NotificationType, wasSent: boolean): void {
    const entry = this.throttleMap.get(key);

    if (!entry) {
      this.throttleMap.set(key, {
        lastSent: wasSent ? new Date() : new Date(0),
        count: 1,
        throttledCount: wasSent ? 0 : 1,
      });
    } else {
      entry.count++;
      if (wasSent) {
        entry.lastSent = new Date();
      } else {
        entry.throttledCount++;
      }
    }
  }

  /**
   * Get count of throttled notifications for a key
   */
  getThrottledCount(key: string): number {
    const entry = this.throttleMap.get(key);
    return entry ? entry.throttledCount : 0;
  }

  /**
   * Generate unique key for error throttling
   */
  generateErrorKey(error: Error, endpoint?: string): string {
    const message = error.message || 'unknown';
    const stack = error.stack?.split('\n')[1] || ''; // First line of stack trace
    const combined = `${endpoint || 'unknown'}:${message}:${stack}`;
    
    // Use MD5 hash to create unique but consistent key
    return crypto.createHash('md5').update(combined).digest('hex');
  }

  /**
   * Send summary of throttled notifications
   */
  async sendThrottledSummary(): Promise<void> {
    const throttledEntries: Array<{ key: string; entry: ThrottleEntry }> = [];

    // Collect entries with throttled notifications
    for (const [key, entry] of this.throttleMap.entries()) {
      if (entry.throttledCount > 0) {
        throttledEntries.push({ key, entry });
      }
    }

    if (throttledEntries.length === 0) {
      return;
    }

    console.log(`📊 Sending throttled summary for ${throttledEntries.length} error types`);

    // Group by error type and send summary
    const summaryMessage = this.formatThrottledSummary(throttledEntries);
    
    // Send as a special error notification
    try {
      await NotificationService.sendErrorNotification(
        new Error('Throttled Notifications Summary'),
        'low',
        {
          endpoint: 'throttle-summary',
          affectedUsers: throttledEntries.reduce((sum, e) => sum + e.entry.throttledCount, 0),
        }
      );
    } catch (error) {
      console.error('Failed to send throttled summary:', error);
    }

    // Reset throttled counts
    for (const { entry } of throttledEntries) {
      entry.throttledCount = 0;
    }
  }

  /**
   * Format throttled summary message
   */
  private formatThrottledSummary(entries: Array<{ key: string; entry: ThrottleEntry }>): string {
    const lines = entries.map(({ key, entry }) => {
      return `- ${key.substring(0, 8)}: ${entry.throttledCount} notifications throttled`;
    });

    return `The following errors were throttled in the last 5 minutes:\n\n${lines.join('\n')}`;
  }

  /**
   * Clean up old entries from throttle map
   */
  private cleanup(): void {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    let cleaned = 0;

    for (const [key, entry] of this.throttleMap.entries()) {
      const timeSinceLastSent = now.getTime() - entry.lastSent.getTime();
      
      if (timeSinceLastSent > oneHour) {
        this.throttleMap.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old throttle entries`);
    }
  }

  /**
   * Start background jobs for cleanup and summaries
   */
  private startBackgroundJobs(): void {
    // Cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000);

    // Send throttled summary every 5 minutes
    this.summaryInterval = setInterval(() => {
      this.sendThrottledSummary();
    }, 5 * 60 * 1000);

    console.log('✅ ThrottleManager background jobs started');
  }

  /**
   * Stop background jobs (for testing or shutdown)
   */
  stopBackgroundJobs(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.summaryInterval) {
      clearInterval(this.summaryInterval);
      this.summaryInterval = null;
    }
    console.log('🛑 ThrottleManager background jobs stopped');
  }

  /**
   * Get statistics about throttling
   */
  getStats(): {
    totalKeys: number;
    totalThrottled: number;
    activeKeys: number;
  } {
    let totalThrottled = 0;
    let activeKeys = 0;

    for (const entry of this.throttleMap.values()) {
      totalThrottled += entry.throttledCount;
      if (entry.throttledCount > 0) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.throttleMap.size,
      totalThrottled,
      activeKeys,
    };
  }
}

export default new ThrottleManager();
