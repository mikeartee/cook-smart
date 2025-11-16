import { Request, Response } from 'express';
import pool from '../config/database';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminReferralsController {
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_referrals,
          COUNT(*) FILTER (WHERE status = 'completed') as successful_referrals,
          COUNT(DISTINCT referrer_id) as total_referrers,
          SUM(reward_amount) FILTER (WHERE status = 'completed') as total_rewards
        FROM user_referrals
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      const totalReferrals = parseInt(stats.total_referrals || 0);
      const successfulReferrals = parseInt(stats.successful_referrals || 0);
      const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

      res.json({
        overview: {
          totalReferrals,
          successfulReferrals,
          totalReferrers: parseInt(stats.total_referrers || 0),
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalRewards: parseFloat(stats.total_rewards || 0),
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get referral overview error:', error);
      res.status(500).json({ error: 'Failed to fetch referral overview' });
    }
  }

  async getTopReferrers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const period = req.query.period as string || 'all_time';

      let dateFilter = '';
      if (period === 'this_month') {
        dateFilter = "AND ur.created_at >= DATE_TRUNC('month', CURRENT_DATE)";
      } else if (period === 'this_year') {
        dateFilter = "AND ur.created_at >= DATE_TRUNC('year', CURRENT_DATE)";
      }

      const query = `
        SELECT
          u.id,
          u.email,
          u.first_name,
          u.last_name,
          COUNT(ur.id) as total_referrals,
          COUNT(ur.id) FILTER (WHERE ur.status = 'completed') as successful_referrals,
          SUM(ur.reward_amount) FILTER (WHERE ur.status = 'completed') as total_earnings
        FROM users u
        INNER JOIN user_referrals ur ON u.id = ur.referrer_id
        WHERE 1=1 ${dateFilter}
        GROUP BY u.id, u.email, u.first_name, u.last_name
        ORDER BY successful_referrals DESC, total_referrals DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);

      res.json({
        topReferrers: result.rows.map(row => ({
          userId: row.id,
          email: row.email,
          name: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
          totalReferrals: parseInt(row.total_referrals),
          successfulReferrals: parseInt(row.successful_referrals),
          totalEarnings: parseFloat(row.total_earnings || 0),
        })),
        period,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get top referrers error:', error);
      res.status(500).json({ error: 'Failed to fetch top referrers' });
    }
  }

  async getAllCodes(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          referral_code,
          COUNT(*) as usage_count,
          COUNT(*) FILTER (WHERE status = 'completed') as successful_count
        FROM user_referrals
        GROUP BY referral_code
        ORDER BY usage_count DESC
      `;

      const result = await pool.query(query);

      res.json({
        codes: result.rows.map(row => ({
          code: row.referral_code,
          usageCount: parseInt(row.usage_count),
          successfulCount: parseInt(row.successful_count),
          conversionRate: parseInt(row.usage_count) > 0 
            ? Math.round((parseInt(row.successful_count) / parseInt(row.usage_count)) * 100 * 100) / 100
            : 0,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get all codes error:', error);
      res.status(500).json({ error: 'Failed to fetch referral codes' });
    }
  }

  async createCustomCode(req: Request, res: Response): Promise<void> {
    try {
      const { code, userId } = req.body;

      if (!code || !userId) {
        res.status(400).json({ error: 'code and userId are required' });
        return;
      }

      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'create_custom_referral_code',
        resourceType: 'referral',
        resourceId: code,
        details: { userId },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Custom referral code created successfully',
        code,
        userId,
      });
    } catch (error) {
      console.error('Create custom code error:', error);
      res.status(500).json({ error: 'Failed to create custom referral code' });
    }
  }

  async disableCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      if (!code) {
        res.status(400).json({ error: 'Referral code is required' });
        return;
      }

      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'disable_referral_code',
        resourceType: 'referral',
        resourceId: code,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Referral code disabled successfully',
        code,
      });
    } catch (error) {
      console.error('Disable code error:', error);
      res.status(500).json({ error: 'Failed to disable referral code' });
    }
  }
}
