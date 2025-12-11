import {Router} from 'express';
import FeedbackController from '../controllers/FeedbackController';
import {authenticateToken} from '../middleware/auth';

const router = Router();

// Public feedback endpoint for BETA (no auth required)
router.post(
  '/public',
  FeedbackController.validateFeedback,
  FeedbackController.submitFeedback.bind(FeedbackController),
);

// Submit feedback (no auth required for BETA)
router.post(
  '/',
  FeedbackController.validateFeedback,
  FeedbackController.submitFeedback.bind(FeedbackController),
);

// All other feedback routes require authentication
router.use(authenticateToken);

// Get user's feedback history
router.get(
  '/my-feedback',
  FeedbackController.getUserFeedback.bind(FeedbackController),
);

// Admin routes
router.get(
  '/admin/all',
  FeedbackController.getAllFeedback.bind(FeedbackController),
);

router.patch(
  '/admin/:id/status',
  FeedbackController.updateFeedbackStatus.bind(FeedbackController),
);

export default router;
