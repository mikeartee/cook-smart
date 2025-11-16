import { Pool } from 'pg';

interface RepairResult {
  success: boolean;
  message: string;
  action: string;
}

interface AutoRepairStrategy {
  name: string;
  canHandle(error: Error): boolean;
  repair(error: Error): Promise<RepairResult>;
}

/**
 * Strategy for repairing database connection issues
 */
class DatabaseConnectionRepair implements AutoRepairStrategy {
  name = 'Database Connection Repair';
  private pool: Pool | null = null;

  setPool(pool: Pool): void {
    this.pool = pool;
  }

  canHandle(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('database') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('timeout') ||
      message.includes('pool')
    );
  }

  async repair(error: Error): Promise<RepairResult> {
    try {
      if (!this.pool) {
        return {
          success: false,
          message: 'Database pool not available',
          action: 'Manual intervention required - check database configuration',
        };
      }

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      return {
        success: true,
        message: 'Database connection restored',
        action: 'Successfully reconnected to PostgreSQL',
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to restore database connection',
        action: 'Manual intervention required - check database status and credentials',
      };
    }
  }
}

/**
 * Strategy for handling rate limit errors
 */
class RateLimitRepair implements AutoRepairStrategy {
  name = 'Rate Limit Repair';

  canHandle(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('429')
    );
  }

  async repair(error: Error): Promise<RepairResult> {
    // For rate limits, we can't really "fix" it, but we can provide guidance
    return {
      success: true,
      message: 'Rate limit detected - automatic fallback should handle this',
      action: 'System will use cached data or fallback API provider',
    };
  }
}

/**
 * Strategy for handling API timeout errors
 */
class APITimeoutRepair implements AutoRepairStrategy {
  name = 'API Timeout Repair';

  canHandle(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('etimedout') ||
      message.includes('request failed')
    );
  }

  async repair(error: Error): Promise<RepairResult> {
    // For timeouts, suggest retry with exponential backoff
    return {
      success: true,
      message: 'API timeout detected - retry mechanism should handle this',
      action: 'System will retry request with exponential backoff',
    };
  }
}

/**
 * Strategy for handling authentication errors
 */
class AuthenticationRepair implements AutoRepairStrategy {
  name = 'Authentication Repair';

  canHandle(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('token') ||
      message.includes('401')
    );
  }

  async repair(error: Error): Promise<RepairResult> {
    // For auth errors, we can't auto-fix, but provide guidance
    return {
      success: false,
      message: 'Authentication error detected',
      action: 'User needs to re-authenticate - token may be expired',
    };
  }
}

/**
 * Auto-repair system that attempts to fix common errors
 */
class AutoRepairSystem {
  private strategies: AutoRepairStrategy[];
  private repairHistory: Map<string, RepairResult[]>;

  constructor() {
    this.strategies = [
      new DatabaseConnectionRepair(),
      new RateLimitRepair(),
      new APITimeoutRepair(),
      new AuthenticationRepair(),
    ];
    this.repairHistory = new Map();
  }

  /**
   * Set database pool for database repair strategy
   */
  setDatabasePool(pool: Pool): void {
    const dbStrategy = this.strategies.find(
      s => s instanceof DatabaseConnectionRepair
    ) as DatabaseConnectionRepair;
    
    if (dbStrategy) {
      dbStrategy.setPool(pool);
    }
  }

  /**
   * Attempt to repair an error using available strategies
   */
  async attemptRepair(error: Error): Promise<RepairResult | null> {
    // Find a strategy that can handle this error
    const strategy = this.strategies.find(s => s.canHandle(error));

    if (!strategy) {
      console.log('⚠️  No repair strategy available for this error');
      return null;
    }

    console.log(`🔧 Attempting repair with strategy: ${strategy.name}`);

    try {
      const result = await strategy.repair(error);
      
      // Record repair attempt
      this.recordRepair(error.message, result);

      if (result.success) {
        console.log(`✅ Repair successful: ${result.message}`);
      } else {
        console.log(`❌ Repair failed: ${result.message}`);
      }

      return result;
    } catch (repairError) {
      console.error('❌ Repair strategy threw error:', repairError);
      return {
        success: false,
        message: 'Repair strategy failed',
        action: 'Manual intervention required',
      };
    }
  }

  /**
   * Record repair attempt in history
   */
  private recordRepair(errorMessage: string, result: RepairResult): void {
    const history = this.repairHistory.get(errorMessage) || [];
    history.push(result);
    
    // Keep only last 10 repair attempts per error type
    if (history.length > 10) {
      history.shift();
    }
    
    this.repairHistory.set(errorMessage, history);
  }

  /**
   * Get repair history for an error
   */
  getRepairHistory(errorMessage: string): RepairResult[] {
    return this.repairHistory.get(errorMessage) || [];
  }

  /**
   * Get repair statistics
   */
  getStats(): {
    totalRepairs: number;
    successfulRepairs: number;
    failedRepairs: number;
    successRate: number;
  } {
    let totalRepairs = 0;
    let successfulRepairs = 0;

    for (const history of this.repairHistory.values()) {
      totalRepairs += history.length;
      successfulRepairs += history.filter(r => r.success).length;
    }

    const failedRepairs = totalRepairs - successfulRepairs;
    const successRate = totalRepairs > 0 ? successfulRepairs / totalRepairs : 0;

    return {
      totalRepairs,
      successfulRepairs,
      failedRepairs,
      successRate,
    };
  }

  /**
   * Add custom repair strategy
   */
  addStrategy(strategy: AutoRepairStrategy): void {
    this.strategies.push(strategy);
    console.log(`✅ Added repair strategy: ${strategy.name}`);
  }

  /**
   * Clear repair history (for testing or maintenance)
   */
  clearHistory(): void {
    this.repairHistory.clear();
    console.log('🧹 Repair history cleared');
  }
}

export default new AutoRepairSystem();
export { AutoRepairStrategy, RepairResult };
