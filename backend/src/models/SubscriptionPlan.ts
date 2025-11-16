import pool from '../config/database';

export interface SubscriptionPlanData {
  id: number;
  plan_name: string;
  stripe_product_id: string;
  promotional_price_id: string | null;
  standard_price_id: string;
  billing_interval: 'year' | 'month' | 'week';
  available_in_beta: boolean;
  trial_days: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * SubscriptionPlan Model
 * Manages subscription plan data and queries
 */
export class SubscriptionPlan {
  id: number;
  planName: string;
  stripeProductId: string;
  promotionalPriceId: string | null;
  standardPriceId: string;
  billingInterval: 'year' | 'month' | 'week';
  availableInBeta: boolean;
  trialDays: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: SubscriptionPlanData) {
    this.id = data.id;
    this.planName = data.plan_name;
    this.stripeProductId = data.stripe_product_id;
    this.promotionalPriceId = data.promotional_price_id;
    this.standardPriceId = data.standard_price_id;
    this.billingInterval = data.billing_interval;
    this.availableInBeta = data.available_in_beta;
    this.trialDays = data.trial_days;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  /**
   * Get all available plans filtered by beta phase
   */
  static async getAvailablePlans(isBeta: boolean): Promise<SubscriptionPlan[]> {
    const query = `
      SELECT * FROM subscription_plans
      WHERE available_in_beta = $1 OR $1 = false
      ORDER BY 
        CASE billing_interval
          WHEN 'year' THEN 1
          WHEN 'month' THEN 2
          WHEN 'week' THEN 3
        END
    `;

    try {
      const result = await pool.query(query, [isBeta]);
      return result.rows.map(row => new SubscriptionPlan(row));
    } catch (error) {
      console.error('Error fetching available plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Find plan by name
   */
  static async findByName(name: string): Promise<SubscriptionPlan | null> {
    const query = `
      SELECT * FROM subscription_plans
      WHERE plan_name = $1
    `;

    try {
      const result = await pool.query(query, [name]);

      if (result.rows.length === 0) {
        return null;
      }

      return new SubscriptionPlan(result.rows[0]);
    } catch (error) {
      console.error('Error finding plan by name:', error);
      throw new Error('Failed to find subscription plan');
    }
  }

  /**
   * Find plan by ID
   */
  static async findById(id: number): Promise<SubscriptionPlan | null> {
    const query = `
      SELECT * FROM subscription_plans
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new SubscriptionPlan(result.rows[0]);
    } catch (error) {
      console.error('Error finding plan by ID:', error);
      throw new Error('Failed to find subscription plan');
    }
  }

  /**
   * Get all plans
   */
  static async getAll(): Promise<SubscriptionPlan[]> {
    const query = `
      SELECT * FROM subscription_plans
      ORDER BY 
        CASE billing_interval
          WHEN 'year' THEN 1
          WHEN 'month' THEN 2
          WHEN 'week' THEN 3
        END
    `;

    try {
      const result = await pool.query(query);
      return result.rows.map(row => new SubscriptionPlan(row));
    } catch (error) {
      console.error('Error fetching all plans:', error);
      throw new Error('Failed to fetch subscription plans');
    }
  }

  /**
   * Create or update a plan
   */
  static async upsert(planData: {
    planName: string;
    stripeProductId: string;
    promotionalPriceId: string | null;
    standardPriceId: string;
    billingInterval: 'year' | 'month' | 'week';
    availableInBeta: boolean;
    trialDays: number;
  }): Promise<SubscriptionPlan> {
    const query = `
      INSERT INTO subscription_plans (
        plan_name, stripe_product_id, promotional_price_id,
        standard_price_id, billing_interval, available_in_beta, trial_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plan_name) DO UPDATE SET
        stripe_product_id = EXCLUDED.stripe_product_id,
        promotional_price_id = EXCLUDED.promotional_price_id,
        standard_price_id = EXCLUDED.standard_price_id,
        billing_interval = EXCLUDED.billing_interval,
        available_in_beta = EXCLUDED.available_in_beta,
        trial_days = EXCLUDED.trial_days,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        planData.planName,
        planData.stripeProductId,
        planData.promotionalPriceId,
        planData.standardPriceId,
        planData.billingInterval,
        planData.availableInBeta,
        planData.trialDays,
      ]);

      return new SubscriptionPlan(result.rows[0]);
    } catch (error) {
      console.error('Error upserting plan:', error);
      throw new Error('Failed to create or update subscription plan');
    }
  }

  /**
   * Delete a plan
   */
  static async delete(id: number): Promise<boolean> {
    const query = `
      DELETE FROM subscription_plans
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw new Error('Failed to delete subscription plan');
    }
  }
}
