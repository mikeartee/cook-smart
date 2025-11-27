import express from 'express';
import SocialService from '../services/SocialService';
import {authenticateToken} from '../middleware/auth';

const router = express.Router();

// Follow/Unfollow
router.post('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const followerId = parseInt(req.user!.id);
    const followingId = parseInt(req.params.userId);

    if (followerId === followingId) {
      return res.status(400).json({error: 'Cannot follow yourself'});
    }

    const result = await SocialService.followUser(followerId, followingId);
    res.json({success: true, data: result});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.delete('/follow/:userId', authenticateToken, async (req, res) => {
  try {
    const followerId = parseInt(req.user!.id);
    const followingId = parseInt(req.params.userId);

    await SocialService.unfollowUser(followerId, followingId);
    res.json({success: true});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.get('/followers/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const followers = await SocialService.getFollowers(userId);
    res.json({success: true, followers});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.get('/following/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const following = await SocialService.getFollowing(userId);
    res.json({success: true, following});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.get('/is-following/:userId', authenticateToken, async (req, res) => {
  try {
    const followerId = parseInt(req.user!.id);
    const followingId = parseInt(req.params.userId);
    const isFollowing = await SocialService.isFollowing(
      followerId,
      followingId,
    );
    res.json({success: true, isFollowing});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

// Comments
router.post('/comments/:recipeId', authenticateToken, async (req, res) => {
  try {
    const {recipeId} = req.params;
    const userId = parseInt(req.user!.id);
    const {comment, parentId} = req.body;

    const result = await SocialService.addComment(
      recipeId,
      userId,
      comment,
      parentId,
    );
    res.json({success: true, comment: result});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.get('/comments/:recipeId', async (req, res) => {
  try {
    const {recipeId} = req.params;
    const comments = await SocialService.getComments(recipeId);
    res.json({success: true, comments});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.delete('/comments/:commentId', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.commentId);
    const userId = parseInt(req.user!.id);

    await SocialService.deleteComment(commentId, userId);
    res.json({success: true});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

// Likes
router.post('/likes/:recipeId', authenticateToken, async (req, res) => {
  try {
    const {recipeId} = req.params;
    const userId = parseInt(req.user!.id);

    await SocialService.likeRecipe(recipeId, userId);
    const count = await SocialService.getLikesCount(recipeId);
    res.json({success: true, likesCount: count});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.delete('/likes/:recipeId', authenticateToken, async (req, res) => {
  try {
    const {recipeId} = req.params;
    const userId = parseInt(req.user!.id);

    await SocialService.unlikeRecipe(recipeId, userId);
    const count = await SocialService.getLikesCount(recipeId);
    res.json({success: true, likesCount: count});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

router.get('/likes/:recipeId', authenticateToken, async (req, res) => {
  try {
    const {recipeId} = req.params;
    const userId = parseInt(req.user!.id);

    const isLiked = await SocialService.isLiked(recipeId, userId);
    const count = await SocialService.getLikesCount(recipeId);
    res.json({success: true, isLiked, likesCount: count});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

// Shares
router.post('/shares/:recipeId', authenticateToken, async (req, res) => {
  try {
    const {recipeId} = req.params;
    const userId = parseInt(req.user!.id);
    const {platform} = req.body;

    await SocialService.shareRecipe(recipeId, userId, platform);
    const count = await SocialService.getSharesCount(recipeId);
    res.json({success: true, sharesCount: count});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

// Community Feed
router.get('/feed', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.user!.id);
    const limit = parseInt(req.query.limit as string) || 50;

    const feed = await SocialService.getCommunityFeed(userId, limit);
    res.json({success: true, feed});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

// Trending
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const trending = await SocialService.getTrendingRecipes(limit);
    res.json({success: true, trending});
  } catch (error: any) {
    res.status(500).json({error: error.message});
  }
});

export default router;
