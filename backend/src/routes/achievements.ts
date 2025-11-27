import {Router} from 'express';
import {AchievementService} from '../services/AchievementService';
import {authenticateToken} from '../middleware/auth';

const router = Router();

// Get user's earned achievements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const achievements = await AchievementService.getUserAchievements(userId);

    res.json({success: true, achievements});
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({error: 'Failed to get achievements'});
  }
});

// Get achievement progress
router.get('/progress', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const progress = await AchievementService.getAchievementProgress(userId);

    res.json(progress);
  } catch (error) {
    console.error('Error getting achievement progress:', error);
    res.status(500).json({error: 'Failed to get progress'});
  }
});

export default router;
