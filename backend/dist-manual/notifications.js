'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
const express_1 = require('express');
const PushNotificationService_1 = require('../services/PushNotificationService');
const auth_1 = require('../middleware/auth');
const router = (0, express_1.Router)();
router.post('/register', auth_1.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {token, platform} = req.body;
    if (!token || !platform) {
      res.status(400).json({error: 'Token and platform are required'});
      return;
    }
    await PushNotificationService_1.PushNotificationService.registerToken(
      userId,
      token,
      platform,
    );
    res.json({success: true, message: 'Token registered successfully'});
  } catch (error) {
    console.error('Error registering token:', error);
    res.status(500).json({error: 'Failed to register token'});
  }
});
router.get('/preferences', auth_1.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences =
      await PushNotificationService_1.PushNotificationService.getPreferences(
        userId,
      );
    res.json(preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({error: 'Failed to get preferences'});
  }
});
router.put('/preferences', auth_1.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    await PushNotificationService_1.PushNotificationService.updatePreferences(
      userId,
      preferences,
    );
    res.json({success: true, message: 'Preferences updated successfully'});
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({error: 'Failed to update preferences'});
  }
});
exports.default = router;
