import express from 'express';
import {StripeWebhookController} from '../controllers/StripeWebhookController';

const router = express.Router();

/**
 * Stripe Webhook Route
 * Note: This route must use raw body, not JSON parsed body
 */
router.post(
  '/',
  express.raw({type: 'application/json'}),
  StripeWebhookController.handleWebhook,
);

export default router;
