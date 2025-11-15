import { Request, Response, NextFunction } from 'express';
import { DiscordWebhookService } from '../services/DiscordWebhookService';

export interface NotificationRequest extends Request {
  notifyDiscord?: {
    type: 'newUser' | 'newRecipe' | 'feedback' | 'error';
    data: any;
  };
}

export const discordNotificationMiddleware = async (
  req: NotificationRequest,
  res: Response,
  next: NextFunction
) => {
  // Store original res.json to intercept successful responses
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Only send notification on successful responses (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300 && req.notifyDiscord) {
      // Send notification asynchronously without blocking response
      setImmediate(async () => {
        try {
          await sendDiscordNotification(req.notifyDiscord!.type, req.notifyDiscord!.data);
        } catch (error) {
          console.error('Discord notification failed:', error);
        }
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};

async function sendDiscordNotification(type: string, data: any): Promise<void> {
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
      console.warn(`Unknown Discord notification type: ${type}`);
  }
}

// Helper functions to set notification data
export const notifyNewUser = (username: string, email: string, referralCode?: string) => 
  (req: NotificationRequest, res: Response, next: NextFunction) => {
    req.notifyDiscord = {
      type: 'newUser',
      data: { username, email, referralCode }
    };
    next();
  };

export const notifyNewRecipe = (title: string, username: string, cuisine: string, difficulty: string) =>
  (req: NotificationRequest, res: Response, next: NextFunction) => {
    req.notifyDiscord = {
      type: 'newRecipe',
      data: { title, username, cuisine, difficulty }
    };
    next();
  };

export const notifyFeedback = (username: string, feedback: string, rating?: number) =>
  (req: NotificationRequest, res: Response, next: NextFunction) => {
    req.notifyDiscord = {
      type: 'feedback',
      data: { username, feedback, rating }
    };
    next();
  };

export const notifyError = (error: string, context?: string) =>
  (req: NotificationRequest, res: Response, next: NextFunction) => {
    req.notifyDiscord = {
      type: 'error',
      data: { error, context }
    };
    next();
  };
