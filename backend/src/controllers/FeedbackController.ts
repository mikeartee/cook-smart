import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import FeedbackModel from '../models/Feedback';
import NotificationService from '../services/NotificationService';

class FeedbackController {
  /**
   * Validation rules for feedback submission
   */
  validateFeedback = [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('category').optional().isString().withMessage('Category must be a string'),
    body('screenshot').optional().isString().withMessage('Screenshot must be a string'),
  ];

  /**
   * Submit feedback
   */
  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const user = (req as any).user;
      
      // For public endpoint, user is optional (BETA feature)
      // For authenticated endpoint, user is required
      const isPublicEndpoint = req.path.includes('/public');
      
      if (!user && !isPublicEndpoint) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      const { message, rating, category, screenshot } = req.body;

      // Create feedback in database
      const params: any = {
        user_id: user?.id || null, // Allow null for public submissions
        message,
      };
      
      if (rating) params.rating = parseInt(rating);
      if (category) params.category = category;
      if (screenshot) params.screenshot_url = screenshot;
      
      const feedback = await FeedbackModel.create(params);

      // Send Discord notification asynchronously (don't block response)
      (async () => {
        try {
          const notifData: any = {
            userId: user?.id || 'anonymous',
            userName: user?.name || 'Anonymous User',
            userEmail: user?.email || 'anonymous@cooksmartapp.com',
            message: feedback.message,
            timestamp: feedback.created_at,
          };
          
          if (feedback.rating) notifData.rating = feedback.rating;
          if (feedback.category) notifData.category = feedback.category;
          if (feedback.screenshot_url) notifData.screenshot = feedback.screenshot_url;
          
          await NotificationService.sendFeedbackNotification(notifData);
        } catch (error) {
          console.error('Failed to send feedback notification:', error);
        }
      })();

      // Return success response immediately
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedbackId: feedback.id,
      });
    } catch (error) {
      console.error('Submit feedback error:', error);
      res.status(500).json({
        error: 'Failed to submit feedback',
        message: 'An error occurred while submitting your feedback',
      });
    }
  }

  /**
   * Get user's feedback history
   */
  async getUserFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated',
        });
        return;
      }

      const feedback = await FeedbackModel.findByUserId(user.id);

      res.json({
        success: true,
        feedback,
        count: feedback.length,
      });
    } catch (error) {
      console.error('Get user feedback error:', error);
      res.status(500).json({
        error: 'Failed to fetch feedback',
        message: 'An error occurred while fetching your feedback',
      });
    }
  }

  /**
   * Get all feedback (admin only)
   */
  async getAllFeedback(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.is_admin) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required',
        });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const status = req.query.status as string;

      let feedback;
      if (status) {
        feedback = await FeedbackModel.findByStatus(status, limit);
      } else {
        feedback = await FeedbackModel.findAll(limit, offset);
      }

      const stats = await FeedbackModel.getStats();

      res.json({
        success: true,
        feedback,
        count: feedback.length,
        stats,
      });
    } catch (error) {
      console.error('Get all feedback error:', error);
      res.status(500).json({
        error: 'Failed to fetch feedback',
        message: 'An error occurred while fetching feedback',
      });
    }
  }

  /**
   * Update feedback status (admin only)
   */
  async updateFeedbackStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user || !user.is_admin) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Admin access required',
        });
        return;
      }

      const id = req.params.id as string;
      const { status } = req.body;

      if (!['new', 'read', 'in_progress', 'resolved', 'ignored'].includes(status)) {
        res.status(400).json({
          error: 'Invalid status',
          message: 'Status must be one of: new, read, in_progress, resolved, ignored',
        });
        return;
      }

      const feedback = await FeedbackModel.updateStatus({ id, status });

      res.json({
        success: true,
        message: 'Feedback status updated',
        feedback,
      });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({
        error: 'Failed to update feedback',
        message: 'An error occurred while updating feedback status',
      });
    }
  }
}

export default new FeedbackController();
