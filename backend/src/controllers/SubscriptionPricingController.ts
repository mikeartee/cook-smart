import {Request, Response} from 'express';
import {SubscriptionPricingService} from '../services/SubscriptionPricingService';
import {PhaseManagementService} from '../services/PhaseManagementService';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}

/**
 * SubscriptionPricingController
 * Handles API requests for subscription pricing and plan management
 */
export class SubscriptionPricingController {
  /**
   * GET /api/subscriptions/plans
   * Get available subscription plans based on current phase
   */
  static async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Optional user ID from auth middleware
      const referralCode = req.query.referralCode as string | undefined;

      const plans = await SubscriptionPricingService.getAvailablePlans(userId);

      // If referral code provided, mark yearly plan as having referral discount
      if (referralCode) {
        const yearlyPlan = plans.find(p => p.name === 'yearly');
        if (yearlyPlan) {
          yearlyPlan.initialPrice = 24.99;
          yearlyPlan.features.push('Referral discount applied');
        }
      }

      res.json({
        success: true,
        plans,
      });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/subscriptions/create
   * Create a new subscription for the authenticated user
   */
  static async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User must be authenticated',
        });
        return;
      }

      const {planType, referralCode} = req.body;

      // Validate plan type
      if (!planType || !['yearly', 'monthly', 'weekly'].includes(planType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid plan type',
          message: 'Plan type must be yearly, monthly, or weekly',
        });
        return;
      }

      // Create subscription
      const result = await SubscriptionPricingService.createSubscription(
        userId,
        planType,
        referralCode,
      );

      res.json({
        success: true,
        subscription: result,
      });
    } catch (error) {
      console.error('Error creating subscription:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const statusCode = errorMessage.includes('not available') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: 'Failed to create subscription',
        message: errorMessage,
      });
    }
  }

  /**
   * GET /api/subscriptions/phase
   * Get current phase status (beta or post-beta)
   */
  static async getPhase(req: Request, res: Response): Promise<void> {
    try {
      const config = await PhaseManagementService.getPhaseConfig();

      res.json({
        success: true,
        phase: config.isBeta ? 'beta' : 'post-beta',
        isBeta: config.isBeta,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
      });
    } catch (error) {
      console.error('Error fetching phase status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch phase status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/admin/subscriptions/phase
   * Update phase status (admin only)
   */
  static async updatePhase(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Admin authentication required',
        });
        return;
      }

      const {phase} = req.body;

      // Validate phase
      if (!phase || !['beta', 'post-beta'].includes(phase)) {
        res.status(400).json({
          success: false,
          error: 'Invalid phase',
          message: 'Phase must be beta or post-beta',
        });
        return;
      }

      // Update phase
      await PhaseManagementService.setPhase(phase, adminId);

      // Get updated config
      const config = await PhaseManagementService.getPhaseConfig();

      res.json({
        success: true,
        message: `Phase updated to ${phase}`,
        phase: config.isBeta ? 'beta' : 'post-beta',
        isBeta: config.isBeta,
        updatedAt: config.updatedAt,
        updatedBy: config.updatedBy,
      });
    } catch (error) {
      console.error('Error updating phase status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update phase status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
