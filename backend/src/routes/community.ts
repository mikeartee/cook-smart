import express from 'express';
import { CommunityActivityService } from '../services/CommunityActivityService';
import { NotificationService } from '../services/NotificationService';

const router = express.Router();

// Track recipe share
router.post('/activity/recipe-share', async (req, res) => {
  try {
    const { userId, username, recipeTitle, platform } = req.body;
    
    if (!userId || !username || !recipeTitle || !platform) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await CommunityActivityService.trackRecipeShare(userId, username, recipeTitle, platform);
    res.json({ success: true, message: 'Recipe share tracked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track recipe share' });
  }
});

// Track achievement unlock
router.post('/activity/achievement', async (req, res) => {
  try {
    const { userId, username, achievement, description } = req.body;
    
    if (!userId || !username || !achievement || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await CommunityActivityService.trackAchievementUnlocked(userId, username, achievement, description);
    await NotificationService.notifyAchievement(userId, achievement, description);
    
    res.json({ success: true, message: 'Achievement tracked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track achievement' });
  }
});

// Track milestone
router.post('/activity/milestone', async (req, res) => {
  try {
    const { userId, username, milestone, value } = req.body;
    
    if (!userId || !username || !milestone || value === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await CommunityActivityService.trackMilestoneReached(userId, username, milestone, value);
    res.json({ success: true, message: 'Milestone tracked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track milestone' });
  }
});

// Track community contribution
router.post('/activity/contribution', async (req, res) => {
  try {
    const { userId, username, contribution, impact } = req.body;
    
    if (!userId || !username || !contribution || !impact) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    await CommunityActivityService.trackCommunityContribution(userId, username, contribution, impact);
    res.json({ success: true, message: 'Contribution tracked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track contribution' });
  }
});

// Get user notifications
router.get('/notifications/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    
    const notifications = await NotificationService.getUserNotifications(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    const unreadCount = await NotificationService.getUnreadCount(userId);
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.patch('/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const success = await NotificationService.markAsRead(userId, notificationId);
    
    if (success) {
      res.json({ success: true, message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/notifications/user/:userId/read-all', async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await NotificationService.markAllAsRead(userId);
    res.json({ success: true, markedCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/notifications/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const success = await NotificationService.deleteNotification(userId, notificationId);
    
    if (success) {
      res.json({ success: true, message: 'Notification deleted' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Get activity types
router.get('/activity/types', async (req, res) => {
  try {
    const types = CommunityActivityService.getActivityTypes();
    res.json({ types });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity types' });
  }
});

export default router;