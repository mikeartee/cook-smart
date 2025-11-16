import pool from '../config/database';
import os from 'os';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  server: {
    cpuUsage: number;
    memoryUsage: number;
    memoryTotal: number;
    memoryFree: number;
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  database: {
    status: 'connected' | 'disconnected';
    activeConnections: number;
    maxConnections: number;
    databaseSize: string;
    slowQueries: number;
  };
  api: {
    status: 'operational' | 'degraded' | 'down';
    averageResponseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
  externalServices: {
    openFoodFacts: 'operational' | 'degraded' | 'down';
    themealdb: 'operational' | 'degraded' | 'down';
    edamam: 'operational' | 'degraded' | 'down';
    discord: 'operational' | 'degraded' | 'down';
  };
  cache: {
    recipeHitRate: number;
    barcodeHitRate: number;
    totalCached: number;
    memoryUsed: number;
  };
}

class SystemHealthServiceClass {
  /**
   * Get comprehensive system health status
   */
  async getHealth(): Promise<SystemHealth> {
    const [server, database, api, externalServices, cache] = await Promise.all([
      this.getServerMetrics(),
      this.getDatabaseMetrics(),
      this.getAPIMetrics(),
      this.checkExternalServices(),
      this.getCacheMetrics(),
    ]);

    // Determine overall health
    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (
      database.status === 'disconnected' ||
      api.status === 'down' ||
      server.cpuUsage > 90 ||
      server.memoryUsage > 90
    ) {
      overall = 'critical';
    } else if (
      api.status === 'degraded' ||
      server.cpuUsage > 70 ||
      server.memoryUsage > 70 ||
      api.errorRate > 5
    ) {
      overall = 'degraded';
    }

    return {
      overall,
      server,
      database,
      api,
      externalServices,
      cache,
    };
  }

  /**
   * Get server metrics
   */
  private async getServerMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);
    const memoryUsage = (usedMem / totalMem) * 100;

    return {
      cpuUsage: Math.round(cpuUsage * 100) / 100,
      memoryUsage: Math.round(memoryUsage * 100) / 100,
      memoryTotal: Math.round(totalMem / 1024 / 1024), // MB
      memoryFree: Math.round(freeMem / 1024 / 1024), // MB
      uptime: Math.round(os.uptime()),
      platform: os.platform(),
      nodeVersion: process.version,
    };
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics() {
    try {
      // Check connection
      await pool.query('SELECT 1');

      // Get active connections
      const connQuery = `
        SELECT count(*) as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
        FROM pg_stat_activity
        WHERE state = 'active'
      `;
      const connResult = await pool.query(connQuery);
      const { active_connections, max_connections } = connResult.rows[0];

      // Get database size
      const sizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      const sizeResult = await pool.query(sizeQuery);
      const databaseSize = sizeResult.rows[0].size;

      // Get slow queries count (queries taking > 1 second)
      const slowQuery = `
        SELECT count(*) as slow_queries
        FROM pg_stat_activity
        WHERE state = 'active' 
        AND now() - query_start > interval '1 second'
      `;
      const slowResult = await pool.query(slowQuery);
      const slowQueries = parseInt(slowResult.rows[0].slow_queries);

      return {
        status: 'connected' as const,
        activeConnections: parseInt(active_connections),
        maxConnections: parseInt(max_connections),
        databaseSize,
        slowQueries,
      };
    } catch (error) {
      return {
        status: 'disconnected' as const,
        activeConnections: 0,
        maxConnections: 0,
        databaseSize: 'unknown',
        slowQueries: 0,
      };
    }
  }

  /**
   * Get API metrics
   */
  private async getAPIMetrics() {
    try {
      // Get error rate from last hour
      const errorQuery = `
        SELECT 
          COUNT(*) as total_errors,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 minute') as recent_errors
        FROM error_logs
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `;
      const errorResult = await pool.query(errorQuery);
      const { total_errors, recent_errors } = errorResult.rows[0];

      const totalErrors = parseInt(total_errors || 0);
      const recentErrors = parseInt(recent_errors || 0);
      
      // Simplified metrics (in production, you'd track these properly)
      const errorRate = totalErrors / 60; // errors per minute
      const averageResponseTime = 150; // ms (placeholder)
      const requestsPerMinute = 100; // placeholder

      let status: 'operational' | 'degraded' | 'down' = 'operational';
      if (errorRate > 10) {
        status = 'down';
      } else if (errorRate > 5) {
        status = 'degraded';
      }

      return {
        status,
        averageResponseTime,
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerMinute,
      };
    } catch (error) {
      return {
        status: 'down' as const,
        averageResponseTime: 0,
        errorRate: 0,
        requestsPerMinute: 0,
      };
    }
  }

  /**
   * Check external services status
   */
  private async checkExternalServices() {
    const services = {
      openFoodFacts: 'operational' as const,
      themealdb: 'operational' as const,
      edamam: 'operational' as const,
      discord: 'operational' as const,
    };

    // In production, you'd actually ping these services
    // For now, we'll assume they're operational
    return services;
  }

  /**
   * Get cache metrics
   */
  private async getCacheMetrics() {
    try {
      const query = `
        SELECT
          COUNT(*) as total_cached,
          COUNT(*) FILTER (WHERE last_accessed_at >= NOW() - INTERVAL '1 hour') as recent_hits
        FROM recipe_cache
      `;
      const result = await pool.query(query);
      const { total_cached, recent_hits } = result.rows[0];

      const totalCached = parseInt(total_cached || 0);
      const recentHits = parseInt(recent_hits || 0);
      
      // Calculate hit rate (simplified)
      const recipeHitRate = totalCached > 0 ? (recentHits / totalCached) * 100 : 0;

      return {
        recipeHitRate: Math.round(recipeHitRate * 100) / 100,
        barcodeHitRate: 0, // placeholder
        totalCached,
        memoryUsed: 0, // placeholder
      };
    } catch (error) {
      return {
        recipeHitRate: 0,
        barcodeHitRate: 0,
        totalCached: 0,
        memoryUsed: 0,
      };
    }
  }

  /**
   * Get uptime statistics
   */
  async getUptimeStats() {
    // In production, you'd track this properly
    // For now, return placeholder data
    return {
      last24h: 99.9,
      last7d: 99.8,
      last30d: 99.5,
    };
  }
}

export default new SystemHealthServiceClass();
