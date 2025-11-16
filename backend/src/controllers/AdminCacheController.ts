import { Request, Response } from 'express';
import pool from '../config/database';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminCacheController {
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_cached,
          COUNT(*) FILTER (WHERE last_accessed_at >= NOW() - INTERVAL '1 hour') as accessed_last_hour,
          COUNT(*) FILTER (WHERE last_accessed_at >= NOW() - INTERVAL '24 hours') as accessed_last_day,
          COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count,
          pg_size_pretty(pg_total_relation_size('recipe_cache')) as storage_used
        FROM recipe_cache
      `;
      
      const result = await pool.query(query);
      const stats = result.rows[0];

      const totalCached = parseInt(stats.total_cached);
      const accessedLastHour = parseInt(stats.accessed_last_hour);
      const hitRate = totalCached > 0 ? (accessedLastHour / totalCached) * 100 : 0;

      const apiCallsSaved = accessedLastHour * 2;

      res.json({
        statistics: {
          totalCached,
          hitRate: Math.round(hitRate * 100) / 100,
          apiCallsSaved,
          storageUsed: stats.storage_used,
          expiredCount: parseInt(stats.expired_count),
          accessedLastHour,
          accessedLastDay: parseInt(stats.accessed_last_day),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get cache stats error:', error);
      res.status(500).json({ error: 'Failed to fetch cache statistics' });
    }
  }

  async getPopularRecipes(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;

      const query = `
        SELECT 
          recipe_id,
          recipe_title,
          access_count,
          last_accessed_at,
          created_at
        FROM recipe_cache
        ORDER BY access_count DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      res.json({
        popularRecipes: result.rows,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get popular recipes error:', error);
      res.status(500).json({ error: 'Failed to fetch popular recipes' });
    }
  }

  async clearExpired(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        DELETE FROM recipe_cache
        WHERE expires_at < NOW()
        RETURNING id
      `;

      const result = await pool.query(query);
      const deletedCount = result.rows.length;

      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'clear_expired_cache',
        resourceType: 'cache',
        resourceId: 'recipe_cache',
        details: { deletedCount },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Expired cache entries cleared successfully',
        deletedCount,
      });
    } catch (error) {
      console.error('Clear expired cache error:', error);
      res.status(500).json({ error: 'Failed to clear expired cache' });
    }
  }

  async clearAll(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({ error: 'Admin password required for this operation' });
        return;
      }

      const countQuery = 'SELECT COUNT(*) FROM recipe_cache';
      const countResult = await pool.query(countQuery);
      const totalCount = parseInt(countResult.rows[0].count);

      const deleteQuery = 'DELETE FROM recipe_cache';
      await pool.query(deleteQuery);

      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'clear_all_cache',
        resourceType: 'cache',
        resourceId: 'recipe_cache',
        details: { deletedCount: totalCount },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'All cache entries cleared successfully',
        deletedCount: totalCount,
      });
    } catch (error) {
      console.error('Clear all cache error:', error);
      res.status(500).json({ error: 'Failed to clear all cache' });
    }
  }
}
