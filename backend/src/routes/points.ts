import express from 'express';
import { UserPointsModel } from '../models/UserPoints';

const router = express.Router();

// Get user points
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userPoints = await UserPointsModel.getUserPoints(userId);
    
    if (!userPoints) {
      return res.json({ totalPoints: 0, level: 0 });
    }
    
    res.json(userPoints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user points' });
  }
});

// Add points to user
router.post('/user/:userId/add', async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, description } = req.body;
    
    const points = UserPointsModel.getPointsForAction(action);
    if (points === 0) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    await UserPointsModel.addPoints(userId, points, action, description);
    res.json({ success: true, pointsAdded: points });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add points' });
  }
});

// Get user's points history
router.get('/user/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '20', offset = '0' } = req.query;
    
    const transactions = await UserPointsModel.getUserTransactions(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get points history' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    
    const leaderboard = await UserPointsModel.getLeaderboard(parseInt(limit as string));
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get level information
router.get('/levels/:level', async (req, res) => {
  try {
    const { level } = req.params;
    const levelInfo = UserPointsModel.getLevelInfo(parseInt(level));
    res.json(levelInfo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get level info' });
  }
});

// Get available actions and their point values
router.get('/actions', async (req, res) => {
  try {
    const actions = [
      { action: 'recipe_view', points: 1, description: 'View a recipe' },
      { action: 'recipe_favorite', points: 5, description: 'Favorite a recipe' },
      { action: 'recipe_rating', points: 10, description: 'Rate a recipe' },
      { action: 'recipe_review', points: 15, description: 'Write a recipe review' },
      { action: 'recipe_share', points: 8, description: 'Share a recipe' },
      { action: 'shopping_list_complete', points: 3, description: 'Complete shopping list item' },
      { action: 'daily_login', points: 2, description: 'Daily login bonus' },
      { action: 'profile_complete', points: 25, description: 'Complete profile setup' },
      { action: 'referral_signup', points: 50, description: 'Successful referral signup' }
    ];
    
    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get actions' });
  }
});

export default router;