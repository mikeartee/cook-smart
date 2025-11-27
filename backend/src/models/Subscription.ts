import pool from '../config/database';

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trial';
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  cancellation_reason?: string;
  promotional_price_used: boolean;
  referral_code_used?: string;
  initial_price: number;
  renewal_price: number;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionTransaction {
  id: number;
  subscription_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  payment_method?: string;
  failure_reason?: string;
  refund_amount?: number;
  refund_reason?: string;
  created_at: Date;
}

export class SubscriptionModel {
  /**
   * Get all subscriptions with filters
   */
  static async getAll(filters?: {
    status?: string;
    planId?: string;
    page?: number;
    limit?: number;
  }): Promise<{subscriptions: any[]; total: number}> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      conditions.push(`s.status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    if (filters?.planId) {
      conditions.push(`s.plan_id = $${paramCount}`);
      values.push(filters.planId);
      paramCount++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM subscriptions s ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get subscriptions
    const query = `
      SELECT 
        s.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await pool.query(query, values);

    return {
      subscriptions: result.rows,
      total,
    };
  }

  /**
   * Get subscription overview metrics
   */
  static async getOverview(): Promise<{
    totalActive: number;
    totalCanceled: number;
    totalTrial: number;
    mrr: number;
    byPlan: any[];
  }> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as total_active,
        COUNT(*) FILTER (WHERE status = 'canceled') as total_canceled,
        COUNT(*) FILTER (WHERE status = 'trial') as total_trial,
        COUNT(*) FILTER (WHERE plan_id LIKE '%monthly%') as monthly_count,
        COUNT(*) FILTER (WHERE plan_id LIKE '%annual%') as annual_count
      FROM subscriptions
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    // Calculate MRR (simplified - assumes $9.99/month)
    const monthlyPrice = 9.99;
    const annualMonthlyPrice = 7.99; // $95.88/year = $7.99/month
    const mrr =
      parseInt(stats.monthly_count) * monthlyPrice +
      parseInt(stats.annual_count) * annualMonthlyPrice;

    return {
      totalActive: parseInt(stats.total_active),
      totalCanceled: parseInt(stats.total_canceled),
      totalTrial: parseInt(stats.total_trial),
      mrr: Math.round(mrr * 100) / 100,
      byPlan: [
        {plan: 'monthly', count: parseInt(stats.monthly_count)},
        {plan: 'annual', count: parseInt(stats.annual_count)},
      ],
    };
  }

  /**
   * Grant subscription to user
   */
  static async grant(data: {
    userId: string;
    planId: string;
    durationMonths: number;
  }): Promise<Subscription> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + data.durationMonths);

    const query = `
      INSERT INTO subscriptions (
        id, user_id, plan_id, status, 
        current_period_start, current_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const id = `sub_${Date.now()}_${data.userId}`;
    const values = [id, data.userId, data.planId, 'active', startDate, endDate];

    const result = await pool.query(query, values);

    // Update user subscription status
    await pool.query(
      `UPDATE users SET subscription_status = 'active', subscription_expires_at = $1 WHERE id = $2`,
      [endDate, data.userId],
    );

    return result.rows[0];
  }

  /**
   * Cancel subscription
   */
  static async cancel(
    subscriptionId: string,
    reason?: string,
  ): Promise<Subscription> {
    const query = `
      UPDATE subscriptions
      SET 
        status = 'canceled',
        cancel_at_period_end = true,
        canceled_at = NOW(),
        cancellation_reason = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [subscriptionId, reason]);

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    return result.rows[0];
  }

  /**
   * Extend subscription
   */
  static async extend(
    subscriptionId: string,
    months: number,
  ): Promise<Subscription> {
    const query = `
      UPDATE subscriptions
      SET 
        current_period_end = current_period_end + INTERVAL '${months} months',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [subscriptionId]);

    if (result.rows.length === 0) {
      throw new Error('Subscription not found');
    }

    // Update user subscription expiry
    await pool.query(
      `UPDATE users SET subscription_expires_at = $1 WHERE id = $2`,
      [result.rows[0].current_period_end, result.rows[0].user_id],
    );

    return result.rows[0];
  }

  /**
   * Get billing history
   */
  static async getBillingHistory(filters?: {
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{transactions: SubscriptionTransaction[]; total: number}> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.userId) {
      conditions.push(`user_id = $${paramCount}`);
      values.push(filters.userId);
      paramCount++;
    }

    if (filters?.status) {
      conditions.push(`status = $${paramCount}`);
      values.push(filters.status);
      paramCount++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM subscription_transactions ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get transactions
    const query = `
      SELECT 
        st.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM subscription_transactions st
      LEFT JOIN users u ON st.user_id = u.id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const result = await pool.query(query, values);

    return {
      transactions: result.rows,
      total,
    };
  }

  /**
   * Process refund
   */
  static async refund(
    transactionId: number,
    amount: number,
    reason: string,
  ): Promise<SubscriptionTransaction> {
    const query = `
      UPDATE subscription_transactions
      SET 
        status = 'refunded',
        refund_amount = $2,
        refund_reason = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [transactionId, amount, reason]);

    if (result.rows.length === 0) {
      throw new Error('Transaction not found');
    }

    return result.rows[0];
  }

  /**
   * Update renewal price for a subscription
   */
  static async updateRenewalPrice(
    subscriptionId: string,
    newPrice: number,
  ): Promise<void> {
    const query = `
      UPDATE subscriptions
      SET 
        renewal_price = $2,
        updated_at = NOW()
      WHERE id = $1
    `;

    const result = await pool.query(query, [subscriptionId, newPrice]);

    if (result.rowCount === 0) {
      throw new Error('Subscription not found');
    }
  }

  /**
   * Apply promotion to a subscription
   */
  static async applyPromotion(
    subscriptionId: string,
    referralCode?: string,
  ): Promise<void> {
    const query = `
      UPDATE subscriptions
      SET 
        promotional_price_used = true,
        referral_code_used = $2,
        updated_at = NOW()
      WHERE id = $1
    `;

    const result = await pool.query(query, [
      subscriptionId,
      referralCode || null,
    ]);

    if (result.rowCount === 0) {
      throw new Error('Subscription not found');
    }
  }

  /**
   * Get subscription by ID with all details
   */
  static async getById(subscriptionId: string): Promise<Subscription | null> {
    const query = `
      SELECT 
        s.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM subscriptions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `;

    const result = await pool.query(query, [subscriptionId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get user's active subscription
   */
  static async getUserActiveSubscription(
    userId: string,
  ): Promise<Subscription | null> {
    const query = `
      SELECT * FROM subscriptions
      WHERE user_id = $1 
      AND status IN ('active', 'trial')
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }
}
