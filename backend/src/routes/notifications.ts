import {Router} from 'express';
import {PushNotificationService} from '../services/PushNotificationService';
import {authenticateToken, AuthRequest} from '../middleware/auth';

const router = Router();

// Register push notification token
router.post('/register', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const {token, platform} = req.body;

    if (!token || !platform) {
      res.status(400).json({error: 'Token and platform are required'});
      return;
    }

    await PushNotificationService.registerToken(userId, token, platform);

    res.json({success: true, message: 'Token registered successfully'});
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({error: 'Failed to register token'});
  }
});

// Get notification preferences
router.get('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const preferences = await PushNotificationService.getPreferences(userId);

    res.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({error: 'Failed to get preferences'});
  }
});

// Update notification preferences
router.put('/preferences', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    await PushNotificationService.updatePreferences(userId, preferences);

    res.json({success: true, message: 'Preferences updated successfully'});
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({error: 'Failed to update preferences'});
  }
});

export default router;
