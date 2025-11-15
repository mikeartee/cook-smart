import express from 'express';
import { DiscordWebhookService } from '../services/DiscordWebhookService';

const router = express.Router();

// Test Discord webhook
router.post('/test/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['newUser', 'newRecipe', 'feedback', 'errors'].includes(type)) {
      return res.status(400).json({ error: 'Invalid webhook type' });
    }
    
    const success = await DiscordWebhookService.testWebhook(type as any);
    
    if (success) {
      return res.json({ success: true, message: `${type} webhook test successful` });
    } else {
      return res.status(500).json({ error: `${type} webhook test failed` });
    }
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to test webhook' });
  }
});

// Send custom notification
router.post('/notify', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    switch (type) {
      case 'newUser':
        await DiscordWebhookService.sendNewUserNotification(
          data.username,
          data.email,
          data.referralCode
        );
        break;
        
      case 'newRecipe':
        await DiscordWebhookService.sendNewRecipeNotification(
          data.title,
          data.username,
          data.cuisine,
          data.difficulty
        );
        break;
        
      case 'feedback':
        await DiscordWebhookService.sendFeedbackNotification(
          data.username,
          data.feedback,
          data.rating
        );
        break;
        
      case 'error':
        await DiscordWebhookService.sendErrorNotification(
          data.error,
          data.context
        );
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid notification type' });
    }
    
    return res.json({ success: true, message: 'Notification sent successfully' });
  } catch (_error) {
    return res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get webhook configuration status
router.get('/status', async (req, res) => {
  try {
    const webhookTypes = ['newUser', 'newRecipe', 'feedback', 'errors'];
    const status: Record<string, boolean> = {};
    
    for (const type of webhookTypes) {
      const envVar = `DISCORD_WEBHOOK_${type.toUpperCase().replace(/([A-Z])/g, '_$1')}`;
      status[type] = !!process.env[envVar];
    }
    
    res.json({
      configured: status,
      totalConfigured: Object.values(status).filter(Boolean).length,
      totalWebhooks: webhookTypes.length
    });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to get webhook status' });
  }
});

export default router;
