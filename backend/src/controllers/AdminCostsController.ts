import { Request, Response } from 'express';
import pool from '../config/database';

export class AdminCostsController {
  async getCurrentCosts(req: Request, res: Response): Promise<void> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const query = `
        SELECT 
          service_name,
          cost,
          notes
        FROM cost_tracking
        WHERE month = $1
        ORDER BY cost DESC
      `;

      const result = await pool.query(query, [currentMonth]);

      const totalCost = result.rows.reduce((sum, row) => sum + parseFloat(row.cost), 0);
      const budget = 20; // $20/month emergency budget
      const remaining = budget - totalCost;
      const percentageUsed = (totalCost / budget) * 100;

      res.json({
        currentMonth: currentMonth.toISOString().split('T')[0],
        totalCost: Math.round(totalCost * 100) / 100,
        budget,
        remaining: Math.round(remaining * 100) / 100,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        breakdown: result.rows.map(row => ({
          service: row.service_name,
          cost: parseFloat(row.cost),
          percentage: Math.round((parseFloat(row.cost) / totalCost) * 100 * 100) / 100,
          notes: row.notes,
        })),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get current costs error:', error);
      res.status(500).json({ error: 'Failed to fetch current costs' });
    }
  }

  async getCostTrends(req: Request, res: Response): Promise<void> {
    try {
      const months = parseInt(req.query.months as string) || 6;

      const query = `
        WITH month_series AS (
          SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${months} months'),
            DATE_TRUNC('month', CURRENT_DATE),
            '1 month'::interval
          )::date as month
        )
        SELECT
          ms.month,
          COALESCE(SUM(ct.cost), 0) as total_cost,
          COUNT(DISTINCT ct.service_name) as service_count
        FROM month_series ms
        LEFT JOIN cost_tracking ct ON ms.month = ct.month
        GROUP BY ms.month
        ORDER BY ms.month
      `;

      const result = await pool.query(query);

      const userCountQuery = `
        SELECT COUNT(*) as user_count FROM users
      `;
      const userResult = await pool.query(userCountQuery);
      const userCount = parseInt(userResult.rows[0].user_count);

      res.json({
        trends: result.rows.map(row => ({
          month: row.month.toISOString().split('T')[0],
          totalCost: parseFloat(row.total_cost),
          serviceCount: parseInt(row.service_count),
          costPerUser: userCount > 0 ? Math.round((parseFloat(row.total_cost) / userCount) * 100) / 100 : 0,
        })),
        period: `${months} months`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get cost trends error:', error);
      res.status(500).json({ error: 'Failed to fetch cost trends' });
    }
  }

  async getCostPerUser(req: Request, res: Response): Promise<void> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);

      const costQuery = `
        SELECT COALESCE(SUM(cost), 0) as total_cost
        FROM cost_tracking
        WHERE month = $1
      `;
      const costResult = await pool.query(costQuery, [currentMonth]);
      const totalCost = parseFloat(costResult.rows[0].total_cost);

      const userQuery = `
        SELECT 
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE subscription_status = 'active') as paying_users
        FROM users
      `;
      const userResult = await pool.query(userQuery);
      const { total_users, paying_users } = userResult.rows[0];

      const totalUsers = parseInt(total_users);
      const payingUsers = parseInt(paying_users);

      const costPerUser = totalUsers > 0 ? totalCost / totalUsers : 0;
      const costPerPayingUser = payingUsers > 0 ? totalCost / payingUsers : 0;

      res.json({
        totalCost: Math.round(totalCost * 100) / 100,
        totalUsers,
        payingUsers,
        costPerUser: Math.round(costPerUser * 100) / 100,
        costPerPayingUser: Math.round(costPerPayingUser * 100) / 100,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get cost per user error:', error);
      res.status(500).json({ error: 'Failed to fetch cost per user' });
    }
  }

  async getProjections(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT AVG(total_cost) as avg_cost
        FROM (
          SELECT SUM(cost) as total_cost
          FROM cost_tracking
          WHERE month >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
          GROUP BY month
        ) recent_costs
      `;

      const result = await pool.query(query);
      const avgCost = parseFloat(result.rows[0].avg_cost || 0);

      const userGrowthQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_last_month
        FROM users
      `;
      const userGrowthResult = await pool.query(userGrowthQuery);
      const newUsersLastMonth = parseInt(userGrowthResult.rows[0].new_users_last_month);

      const growthRate = newUsersLastMonth > 0 ? 1.1 : 1.0;
      const nextMonthProjection = avgCost * growthRate;
      const confidence = avgCost > 0 ? 75 : 50;

      res.json({
        nextMonth: {
          projected: Math.round(nextMonthProjection * 100) / 100,
          confidence,
          factors: [
            `Based on ${avgCost > 0 ? '3-month' : 'no'} average`,
            `User growth rate: ${Math.round((growthRate - 1) * 100)}%`,
            newUsersLastMonth > 0 ? 'Increasing user base' : 'Stable user base',
          ],
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get projections error:', error);
      res.status(500).json({ error: 'Failed to fetch cost projections' });
    }
  }

  async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);

      const query = `
        SELECT COALESCE(SUM(cost), 0) as total_cost
        FROM cost_tracking
        WHERE month = $1
      `;

      const result = await pool.query(query, [currentMonth]);
      const totalCost = parseFloat(result.rows[0].total_cost);
      const budget = 20;
      const percentageUsed = (totalCost / budget) * 100;

      const alerts = [];

      if (percentageUsed >= 100) {
        alerts.push({
          level: 'critical',
          message: `Budget exceeded! Current costs: $${totalCost.toFixed(2)} (${percentageUsed.toFixed(1)}% of budget)`,
          action: 'Immediate cost reduction required',
        });
      } else if (percentageUsed >= 80) {
        alerts.push({
          level: 'warning',
          message: `Approaching budget limit: $${totalCost.toFixed(2)} (${percentageUsed.toFixed(1)}% of budget)`,
          action: 'Monitor costs closely',
        });
      }

      if (totalCost === 0) {
        alerts.push({
          level: 'info',
          message: 'No costs recorded for current month',
          action: 'Update cost tracking data',
        });
      }

      res.json({
        alerts,
        currentCost: Math.round(totalCost * 100) / 100,
        budget,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch cost alerts' });
    }
  }
}
