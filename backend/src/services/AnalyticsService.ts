import pool from '../config/database';

export interface AnalyticsOverview {
  users: {
    total: number;
    thisMonth: number;
    today: number;
    coFounders: number;
    premium: number;
    free: number;
  };
  engagement: {
    dau: number; // Daily Active Users
    mau: number; // Monthly Active Users
    totalIngredients: number;
    totalRecipes: number;
    totalSearches: number;
  };
  revenue: {
    mrr: number; // Monthly Recurring Revenue
    totalRevenue: number;
    arpu: number; // Average Revenue Per User
    ltv: number; // Lifetime Value (estimated)
  };
  subscriptions: {
    active: number;
    trial: number;
    canceled: number;
    conversionRate: number;
  };
  referrals: {
    totalSent: number;
    totalSuccessful: number;
    conversionRate: number;
  };
}

export interface GrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
  activeUsers: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  subscriptions: number;
  mrr: number;
}

export interface FeatureUsage {
  feature: string;
  count: number;
  uniqueUsers: number;
}

class AnalyticsServiceClass {
  /**
   * Get comprehensive analytics overview
   */
  async getOverview(): Promise<AnalyticsOverview> {
    // User metrics
    const userMetrics = await this.getUserMetrics();
    
    // Engagement metrics
    const engagementMetrics = await this.getEngagementMetrics();
    
    // Revenue metrics
    const revenueMetrics = await this.getRevenueMetrics();
    
    // Subscription metrics
    const subscriptionMetrics = await this.getSubscriptionMetrics();
    
    // Referral metrics
    const referralMetrics = await this.getReferralMetrics();

    return {
      users: userMetrics,
      engagement: engagementMetrics,
      revenue: revenueMetrics,
      subscriptions: subscriptionMetrics,
      referrals: referralMetrics,
    };
  }

  /**
   * Get user metrics
   */
  private async getUserMetrics() {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as this_month,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
        COUNT(*) FILTER (WHERE is_co_founder = true) as co_founders,
        COUNT(*) FILTER (WHERE subscription_status = 'active' AND is_co_founder = false) as premium,
        COUNT(*) FILTER (WHERE subscription_status = 'free' AND is_co_founder = false) as free
      FROM users
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      thisMonth: parseInt(row.this_month),
      today: parseInt(row.today),
      coFounders: parseInt(row.co_founders),
      premium: parseInt(row.premium),
      free: parseInt(row.free),
    };
  }

  /**
   * Get engagement metrics
   */
  private async getEngagementMetrics() {
    const query = `
      SELECT
        COUNT(DISTINCT user_id) FILTER (WHERE last_login_at >= CURRENT_DATE) as dau,
        COUNT(DISTINCT user_id) FILTER (WHERE last_login_at >= NOW() - INTERVAL '30 days') as mau,
        (SELECT COUNT(*) FROM user_ingredients) as total_ingredients,
        (SELECT COUNT(*) FROM user_recipes) as total_recipes,
        (SELECT COUNT(*) FROM recipe_cache) as total_searches
      FROM users
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    return {
      dau: parseInt(row.dau),
      mau: parseInt(row.mau),
      totalIngredients: parseInt(row.total_ingredients),
      totalRecipes: parseInt(row.total_recipes),
      totalSearches: parseInt(row.total_searches),
    };
  }

  /**
   * Get revenue metrics
   */
  private async getRevenueMetrics() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active' AND plan_id LIKE '%monthly%') as monthly_subs,
        COUNT(*) FILTER (WHERE status = 'active' AND plan_id LIKE '%annual%') as annual_subs,
        (SELECT COUNT(*) FROM users WHERE subscription_status = 'active') as total_paying
      FROM subscriptions
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const monthlyPrice = 9.99;
    const annualMonthlyPrice = 7.99; // $95.88/year
    const monthlySubs = parseInt(row.monthly_subs);
    const annualSubs = parseInt(row.annual_subs);
    const totalPaying = parseInt(row.total_paying);

    const mrr = (monthlySubs * monthlyPrice) + (annualSubs * annualMonthlyPrice);
    const totalRevenue = mrr * 12; // Estimated annual revenue
    const arpu = totalPaying > 0 ? mrr / totalPaying : 0;
    const ltv = arpu * 24; // Estimated 24-month lifetime

    return {
      mrr: Math.round(mrr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
    };
  }

  /**
   * Get subscription metrics
   */
  private async getSubscriptionMetrics() {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'trial') as trial,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled,
        (SELECT COUNT(*) FROM users) as total_users
      FROM subscriptions
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const active = parseInt(row.active);
    const trial = parseInt(row.trial);
    const canceled = parseInt(row.canceled);
    const totalUsers = parseInt(row.total_users);

    const conversionRate = totalUsers > 0 ? (active / totalUsers) * 100 : 0;

    return {
      active,
      trial,
      canceled,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get referral metrics
   */
  private async getReferralMetrics() {
    const query = `
      SELECT
        COUNT(*) as total_sent,
        COUNT(*) FILTER (WHERE status = 'completed') as total_successful
      FROM user_referrals
    `;

    const result = await pool.query(query);
    const row = result.rows[0];

    const totalSent = parseInt(row.total_sent || 0);
    const totalSuccessful = parseInt(row.total_successful || 0);
    const conversionRate = totalSent > 0 ? (totalSuccessful / totalSent) * 100 : 0;

    return {
      totalSent,
      totalSuccessful,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  /**
   * Get user growth data over time
   */
  async getGrowthData(days: number = 30): Promise<GrowthData[]> {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_stats AS (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as new_users
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      ),
      daily_active AS (
        SELECT
          DATE(last_login_at) as date,
          COUNT(DISTINCT user_id) as active_users
        FROM users
        WHERE last_login_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(last_login_at)
      )
      SELECT
        ds.date,
        COALESCE(dst.new_users, 0) as new_users,
        COALESCE(da.active_users, 0) as active_users,
        (SELECT COUNT(*) FROM users WHERE created_at <= ds.date) as total_users
      FROM date_series ds
      LEFT JOIN daily_stats dst ON ds.date = dst.date
      LEFT JOIN daily_active da ON ds.date = da.date
      ORDER BY ds.date
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      newUsers: parseInt(row.new_users),
      totalUsers: parseInt(row.total_users),
      activeUsers: parseInt(row.active_users),
    }));
  }

  /**
   * Get revenue trends by month
   */
  async getRevenueTrends(months: number = 6): Promise<RevenueTrend[]> {
    const query = `
      WITH month_series AS (
        SELECT generate_series(
          DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${months} months'),
          DATE_TRUNC('month', CURRENT_DATE),
          '1 month'::interval
        )::date as month
      )
      SELECT
        TO_CHAR(ms.month, 'YYYY-MM') as month,
        COALESCE(COUNT(s.id), 0) as subscriptions,
        COALESCE(
          COUNT(s.id) FILTER (WHERE s.plan_id LIKE '%monthly%') * 9.99 +
          COUNT(s.id) FILTER (WHERE s.plan_id LIKE '%annual%') * 7.99,
          0
        ) as mrr,
        COALESCE(
          COUNT(s.id) FILTER (WHERE s.plan_id LIKE '%monthly%') * 9.99 +
          COUNT(s.id) FILTER (WHERE s.plan_id LIKE '%annual%') * 95.88,
          0
        ) as revenue
      FROM month_series ms
      LEFT JOIN subscriptions s ON DATE_TRUNC('month', s.created_at) = ms.month
      GROUP BY ms.month
      ORDER BY ms.month
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      month: row.month,
      revenue: Math.round(parseFloat(row.revenue) * 100) / 100,
      subscriptions: parseInt(row.subscriptions),
      mrr: Math.round(parseFloat(row.mrr) * 100) / 100,
    }));
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsage(): Promise<FeatureUsage[]> {
    const queries = [
      {
        feature: 'Ingredients Added',
        query: 'SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users FROM user_ingredients',
      },
      {
        feature: 'Recipes Saved',
        query: 'SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users FROM user_recipes',
      },
      {
        feature: 'Recipe Searches',
        query: 'SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users FROM recipe_cache WHERE user_id IS NOT NULL',
      },
      {
        feature: 'Feedback Submitted',
        query: 'SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as unique_users FROM feedback',
      },
    ];

    const results = await Promise.all(
      queries.map(async ({ feature, query }) => {
        const result = await pool.query(query);
        const row = result.rows[0];
        return {
          feature,
          count: parseInt(row.count || 0),
          uniqueUsers: parseInt(row.unique_users || 0),
        };
      })
    );

    return results;
  }

  /**
   * Export analytics data as CSV
   */
  async exportData(format: 'csv' | 'json' = 'csv'): Promise<string> {
    const overview = await this.getOverview();
    const growth = await this.getGrowthData(30);
    const revenue = await this.getRevenueTrends(6);
    const features = await this.getFeatureUsage();

    if (format === 'json') {
      return JSON.stringify({
        overview,
        growth,
        revenue,
        features,
        exportedAt: new Date().toISOString(),
      }, null, 2);
    }

    // CSV format
    let csv = 'Analytics Export\n';
    csv += `Exported At: ${new Date().toISOString()}\n\n`;
    
    csv += 'User Metrics\n';
    csv += 'Metric,Value\n';
    csv += `Total Users,${overview.users.total}\n`;
    csv += `New This Month,${overview.users.thisMonth}\n`;
    csv += `New Today,${overview.users.today}\n`;
    csv += `Co-Founders,${overview.users.coFounders}\n`;
    csv += `Premium,${overview.users.premium}\n`;
    csv += `Free,${overview.users.free}\n\n`;

    csv += 'Revenue Metrics\n';
    csv += 'Metric,Value\n';
    csv += `MRR,$${overview.revenue.mrr}\n`;
    csv += `Total Revenue,$${overview.revenue.totalRevenue}\n`;
    csv += `ARPU,$${overview.revenue.arpu}\n`;
    csv += `LTV,$${overview.revenue.ltv}\n\n`;

    csv += 'Growth Data (Last 30 Days)\n';
    csv += 'Date,New Users,Total Users,Active Users\n';
    growth.forEach(day => {
      csv += `${day.date},${day.newUsers},${day.totalUsers},${day.activeUsers}\n`;
    });

    return csv;
  }
}

export default new AnalyticsServiceClass();
