import { Request, Response } from 'express';
import { SubscriptionModel } from '../models/Subscription';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminSubscriptionsController {
  /**
   * Get subscription overview metrics
   * GET /api/v1/admin/subscriptions/overview
   */
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      const overview = await SubscriptionModel.getOverview();

      res.json({
        overview,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get subscription overview error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription overview' });
    }
  }

  /**
   * List all subscriptions with filters
   * GET /api/v1/admin/subscriptions?status=active&planId=monthly&page=1&limit=50
   */
  async listSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string;
      const planId = req.query.planId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await SubscriptionModel.getAll({
        status,
        planId,
        page,
        limit,
      });

      res.json({
        subscriptions: result.subscriptions,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error('List subscriptions error:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  /**
   * Grant subscription to user
   * POST /api/v1/admin/subscriptions/grant
   * Body: { userId, planId, durationMonths }
   */
  async grantSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { userId, planId, durationMonths } = req.body;

      if (!userId || !planId || !durationMonths) {
        res.status(400).json({ 
          error: 'userId, planId, and durationMonths are required' 
        });
        return;
      }

      if (typeof durationMonths !== 'number' || durationMonths <= 0) {
        res.status(400).json({ 
          error: 'durationMonths must be a positive number' 
        });
        return;
      }

      const subscription = await SubscriptionModel.grant({
        userId,
        planId,
        durationMonths,
      });

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'grant_subscription',
        resourceType: 'subscription',
        resourceId: subscription.id,
        details: { userId, planId, durationMonths },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Subscription granted successfully',
        subscription,
      });
    } catch (error) {
      console.error('Grant subscription error:', error);
      res.status(500).json({ error: 'Failed to grant subscription' });
    }
  }

  /**
   * Cancel subscription
   * PATCH /api/v1/admin/subscriptions/:id/cancel
   * Body: { reason }
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Subscription ID is required' });
        return;
      }

      if (!reason) {
        res.status(400).json({ error: 'Cancellation reason is required' });
        return;
      }

      const subscription = await SubscriptionModel.cancel(id, reason);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'cancel_subscription',
        resourceType: 'subscription',
        resourceId: id,
        details: { reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Subscription canceled successfully',
        subscription,
      });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      
      if (error.message === 'Subscription not found') {
        res.status(404).json({ error: 'Subscription not found' });
      } else {
        res.status(500).json({ error: 'Failed to cancel subscription' });
      }
    }
  }

  /**
   * Extend subscription
   * PATCH /api/v1/admin/subscriptions/:id/extend
   * Body: { months }
   */
  async extendSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { months } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Subscription ID is required' });
        return;
      }

      if (!months || typeof months !== 'number' || months <= 0) {
        res.status(400).json({ 
          error: 'months must be a positive number' 
        });
        return;
      }

      const subscription = await SubscriptionModel.extend(id, months);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'extend_subscription',
        resourceType: 'subscription',
        resourceId: id,
        details: { months },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `Subscription extended by ${months} month(s)`,
        subscription,
      });
    } catch (error: any) {
      console.error('Extend subscription error:', error);
      
      if (error.message === 'Subscription not found') {
        res.status(404).json({ error: 'Subscription not found' });
      } else {
        res.status(500).json({ error: 'Failed to extend subscription' });
      }
    }
  }

  /**
   * Get billing history
   * GET /api/v1/admin/subscriptions/billing-history?userId=123&status=succeeded&page=1
   */
  async getBillingHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string | undefined;
      const status = req.query.status as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const filters: {
        userId?: string;
        status?: string;
        page?: number;
        limit?: number;
      } = { page, limit };

      if (userId !== undefined) filters.userId = userId;
      if (status !== undefined) filters.status = status;

      const result = await SubscriptionModel.getBillingHistory(filters);

      res.json({
        transactions: result.transactions,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      console.error('Get billing history error:', error);
      res.status(500).json({ error: 'Failed to fetch billing history' });
    }
  }

  /**
   * Process refund
   * POST /api/v1/admin/subscriptions/:transactionId/refund
   * Body: { amount, reason }
   */
  async processRefund(req: Request, res: Response): Promise<void> {
    try {
      if (!req.params.transactionId) {
        res.status(400).json({ error: 'Transaction ID is required' });
        return;
      }

      const transactionId = parseInt(req.params.transactionId);
      const { amount, reason } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ 
          error: 'amount must be a positive number' 
        });
        return;
      }

      if (!reason) {
        res.status(400).json({ error: 'Refund reason is required' });
        return;
      }

      const transaction = await SubscriptionModel.refund(transactionId, amount, reason);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'process_refund',
        resourceType: 'transaction',
        resourceId: transactionId.toString(),
        details: { amount, reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Refund processed successfully',
        transaction,
      });
    } catch (error: any) {
      console.error('Process refund error:', error);
      
      if (error.message === 'Transaction not found') {
        res.status(404).json({ error: 'Transaction not found' });
      } else {
        res.status(500).json({ error: 'Failed to process refund' });
      }
    }
  }
}
