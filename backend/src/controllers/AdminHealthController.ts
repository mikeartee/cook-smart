import { Request, Response } from 'express';
import SystemHealthService from '../services/SystemHealthService';

export class AdminHealthController {
  /**
   * Get overall system health
   * GET /api/v1/admin/health/overview
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();
      const uptime = await SystemHealthService.getUptimeStats();

      res.json({
        health,
        uptime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get health overview error:', error);
      res.status(500).json({ error: 'Failed to fetch health overview' });
    }
  }

  /**
   * Get server metrics
   * GET /api/v1/admin/health/server
   */
  async getServerMetrics(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();

      res.json({
        server: health.server,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get server metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch server metrics' });
    }
  }

  /**
   * Get database metrics
   * GET /api/v1/admin/health/database
   */
  async getDatabaseMetrics(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();

      res.json({
        database: health.database,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get database metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch database metrics' });
    }
  }

  /**
   * Get API metrics
   * GET /api/v1/admin/health/api
   */
  async getAPIMetrics(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();

      res.json({
        api: health.api,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get API metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch API metrics' });
    }
  }

  /**
   * Get external services status
   * GET /api/v1/admin/health/external-services
   */
  async getExternalServices(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();

      res.json({
        externalServices: health.externalServices,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get external services error:', error);
      res.status(500).json({ error: 'Failed to fetch external services status' });
    }
  }

  /**
   * Get cache metrics
   * GET /api/v1/admin/health/cache
   */
  async getCacheMetrics(req: Request, res: Response): Promise<void> {
    try {
      const health = await SystemHealthService.getHealth();

      res.json({
        cache: health.cache,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get cache metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch cache metrics' });
    }
  }
}
