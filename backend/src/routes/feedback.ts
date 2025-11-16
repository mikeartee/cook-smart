import { Router } from 'express';
import FeedbackController from '../controllers/FeedbackController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All feedback routes require authentication
router.use(authenticateToken);

// Submit feedback
router.post(
  '/',
  FeedbackController.validateFeedback,
  FeedbackController.submitFeedback.bind(FeedbackController)
);

// Get user's feedback history
router.get(
  '/my-feedback',
  FeedbackController.getUserFeedback.bind(FeedbackController)
);

// Admin routes
router.get(
  '/admin/all',
  FeedbackController.getAllFeedback.bind(FeedbackController)
);

router.patch(
  '/admin/:id/status',
  FeedbackController.updateFeedbackStatus.bind(FeedbackController)
);

export default router;
