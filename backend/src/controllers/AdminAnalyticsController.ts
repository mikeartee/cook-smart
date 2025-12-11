import { Request, Response } from 'express';
import AnalyticsService from '../services/AnalyticsService';

// Simple in-memory cache for analytics (5 minutes)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AdminAnalyticsController {
  /**
   * Get cached data or fetch fresh data
   */
  private async getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = cache.get(key);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data as T;
    }

    const data = await fetchFn();
    cache.set(key, { data, timestamp: now });
    return data;
  }

  /**
   * Get comprehensive analytics overview
   * GET /api/v1/admin/analytics/overview
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    console.log('[AdminAnalyticsController] Starting getOverview with LIVE DATA...');
    
    try {
      console.log('[AdminAnalyticsController] Calling AnalyticsService.getOverview()...');
      
      // Get live data from analytics service
      const overview = await AnalyticsService.getOverview();
      
      console.log('[AdminAnalyticsController] ✅ Analytics service returned live data:', {
        totalUsers: overview.users.total,
        dau: overview.engagement.dau,
        mau: overview.engagement.mau
      });

      res.json({
        overview,
        timestamp: new Date().toISOString(),
        dataSource: 'Live database queries'
      });
      
      console.log('[AdminAnalyticsController] ✅ Live analytics data sent successfully');
    } catch (error) {
      console.error('[AdminAnalyticsController] ❌ Error in getOverview:', error);
      
      if (error instanceof Error) {
        console.error('[AdminAnalyticsController] Error message:', error.message);
        console.error('[AdminAnalyticsController] Error stack:', error.stack);
      }
      
      res.status(500).json({ 
        error: 'Failed to fetch analytics overview',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get user growth data
   * GET /api/v1/admin/analytics/growth?days=30
   */
  async getGrowthData(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;

      if (days < 1 || days > 365) {
        res.status(400).json({ error: 'days must be between 1 and 365' });
        return;
      }

      const cacheKey = `growth_${days}`;
      const growth = await this.getCached(cacheKey, () => 
        AnalyticsService.getGrowthData(days)
      );

      res.json({
        growth,
        period: `${days} days`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get growth data error:', error);
      res.status(500).json({ error: 'Failed to fetch growth data' });
    }
  }

  /**
   * Get revenue trends
   * GET /api/v1/admin/analytics/revenue-trends?months=6
   */
  async getRevenueTrends(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;

      if (months < 1 || months > 24) {
        res.status(400).json({ error: 'months must be between 1 and 24' });
        return;
      }

      const cacheKey = `revenue_${months}`;
      const trends = await this.getCached(cacheKey, () => 
        AnalyticsService.getRevenueTrends(months)
      );

      res.json({
        trends,
        period: `${months} months`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get revenue trends error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue trends' });
    }
  }

  /**
   * Get feature usage statistics
   * GET /api/v1/admin/analytics/features
   */
  async getFeatureUsage(req: Request, res: Response): Promise<void> {
    try {
      const features = await this.getCached('features', () => 
        AnalyticsService.getFeatureUsage()
      );

      res.json({
        features,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get feature usage error:', error);
      res.status(500).json({ error: 'Failed to fetch feature usage' });
    }
  }

  /**
   * Export analytics data
   * GET /api/v1/admin/analytics/export?format=csv
   */
  async exportData(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query.format as string) || 'csv';

      if (format !== 'csv' && format !== 'json') {
        res.status(400).json({ error: 'format must be csv or json' });
        return;
      }

      const data = await AnalyticsService.exportData(format as 'csv' | 'json');

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.csv"`);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-${Date.now()}.json"`);
      }

      res.send(data);
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({ error: 'Failed to export analytics data' });
    }
  }
}
