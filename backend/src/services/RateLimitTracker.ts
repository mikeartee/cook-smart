/**
 * Rate Limit Tracker
 * 
 * Tracks API usage for each provider to ensure we stay within daily limits.
 * Automatically resets counters at midnight.
 */

interface RateLimitInfo {
  count: number;
  resetTime: Date;
}

export class RateLimitTracker {
  private limits: Map<string, RateLimitInfo>;

  constructor() {
    this.limits = new Map();
  }

  /**
   * Check if a provider is within its daily limit
   * @param provider - Provider name
   * @param dailyLimit - Maximum calls allowed per day
   * @returns True if within limit, false otherwise
   */
  async checkLimit(provider: string, dailyLimit: number): Promise<boolean> {
    const current = this.limits.get(provider);
    const now = new Date();

    // Reset if no entry exists or if we've passed the reset time
    if (!current || now > current.resetTime) {
      this.limits.set(provider, {
        count: 0,
        resetTime: this.getNextMidnight(),
      });
      return true;
    }

    return current.count < dailyLimit;
  }

  /**
   * Increment the call count for a provider
   * @param provider - Provider name
   */
  async incrementCount(provider: string): Promise<void> {
    const current = this.limits.get(provider);
    
    if (current) {
      current.count++;
    } else {
      this.limits.set(provider, {
        count: 1,
        resetTime: this.getNextMidnight(),
      });
    }
  }

  /**
   * Get current usage for a provider
   * @param provider - Provider name
   * @returns Current count and reset time
   */
  getUsage(provider: string): { count: number; resetTime: Date } | null {
    const current = this.limits.get(provider);
    
    if (!current) {
      return null;
    }

    return {
      count: current.count,
      resetTime: current.resetTime,
    };
  }

  /**
   * Calculate the next midnight (UTC)
   * @returns Date object representing next midnight
   */
  private getNextMidnight(): Date {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  }

  /**
   * Reset all counters (useful for testing)
   */
  reset(): void {
    this.limits.clear();
  }
}

// Singleton instance
export default new RateLimitTracker();
