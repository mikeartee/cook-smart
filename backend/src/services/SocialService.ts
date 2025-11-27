import pool from '../config/database';

export class SocialService {
  // Follow/Unfollow
  async followUser(followerId: string, followingId: string) {
    const result = await pool.query(
      'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) RETURNING *',
      [followerId, followingId],
    );
    await this.logActivity(followerId, 'followed_user', null, followingId);
    return result.rows[0];
  }

  async unfollowUser(followerId: string, followingId: string) {
    await pool.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId],
    );
  }

  async getFollowers(userId: string) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.created_at 
       FROM users u 
       JOIN user_follows uf ON u.id = uf.follower_id 
       WHERE uf.following_id = $1`,
      [userId],
    );
    return result.rows;
  }

  async getFollowing(userId: string) {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.created_at 
       FROM users u 
       JOIN user_follows uf ON u.id = uf.following_id 
       WHERE uf.follower_id = $1`,
      [userId],
    );
    return result.rows;
  }

  async isFollowing(followerId: string, followingId: string) {
    const result = await pool.query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId],
    );
    return result.rows.length > 0;
  }

  // Comments
  async addComment(
    recipeId: string,
    userId: string,
    comment: string,
    parentId?: number,
  ) {
    const result = await pool.query(
      'INSERT INTO recipe_comments (recipe_id, user_id, comment, parent_comment_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [recipeId, userId, comment, parentId || null],
    );
    await this.logActivity(userId, 'commented', recipeId);
    return result.rows[0];
  }

  async getComments(recipeId: string) {
    const result = await pool.query(
      `SELECT rc.*, u.username, u.email 
       FROM recipe_comments rc 
       JOIN users u ON rc.user_id = u.id 
       WHERE rc.recipe_id = $1 
       ORDER BY rc.created_at DESC`,
      [recipeId],
    );
    return result.rows;
  }

  async deleteComment(commentId: number, userId: string) {
    await pool.query(
      'DELETE FROM recipe_comments WHERE id = $1 AND user_id = $2',
      [commentId, userId],
    );
  }

  // Likes
  async likeRecipe(recipeId: string, userId: string) {
    const result = await pool.query(
      'INSERT INTO recipe_likes (recipe_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [recipeId, userId],
    );
    if (result.rows.length > 0) {
      await this.logActivity(userId, 'liked_recipe', recipeId);
      await this.updateTrendingScore(recipeId);
    }
    return result.rows[0];
  }

  async unlikeRecipe(recipeId: string, userId: string) {
    await pool.query(
      'DELETE FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2',
      [recipeId, userId],
    );
    await this.updateTrendingScore(recipeId);
  }

  async isLiked(recipeId: string, userId: string) {
    const result = await pool.query(
      'SELECT 1 FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2',
      [recipeId, userId],
    );
    return result.rows.length > 0;
  }

  async getLikesCount(recipeId: string) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM recipe_likes WHERE recipe_id = $1',
      [recipeId],
    );
    return parseInt(result.rows[0].count);
  }

  // Shares
  async shareRecipe(recipeId: string, userId: string, platform: string) {
    const result = await pool.query(
      'INSERT INTO recipe_shares (recipe_id, user_id, platform) VALUES ($1, $2, $3) RETURNING *',
      [recipeId, userId, platform],
    );
    await this.updateTrendingScore(recipeId);
    return result.rows[0];
  }

  async getSharesCount(recipeId: string) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM recipe_shares WHERE recipe_id = $1',
      [recipeId],
    );
    return parseInt(result.rows[0].count);
  }

  // Activity Feed
  async logActivity(
    userId: string,
    activityType: string,
    recipeId?: string | null,
    targetUserId?: string | null,
    metadata?: any,
  ) {
    await pool.query(
      'INSERT INTO user_activity_feed (user_id, activity_type, recipe_id, target_user_id, metadata) VALUES ($1, $2, $3, $4, $5)',
      [
        userId,
        activityType,
        recipeId,
        targetUserId,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  }

  async getCommunityFeed(userId: string, limit = 50) {
    const result = await pool.query(
      `SELECT uaf.*, u.username, u.email 
       FROM user_activity_feed uaf 
       JOIN users u ON uaf.user_id = u.id 
       WHERE uaf.user_id IN (
         SELECT following_id FROM user_follows WHERE follower_id = $1
       ) OR uaf.user_id = $1
       ORDER BY uaf.created_at DESC 
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  // Trending
  async updateTrendingScore(recipeId: string) {
    const [likes, comments, shares] = await Promise.all([
      this.getLikesCount(recipeId),
      this.getCommentsCount(recipeId),
      this.getSharesCount(recipeId),
    ]);

    const score = likes * 1 + comments * 2 + shares * 3;

    await pool.query(
      `INSERT INTO trending_recipes (recipe_id, score, likes_count, comments_count, shares_count, updated_at) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
       ON CONFLICT (recipe_id) DO UPDATE 
       SET score = $2, likes_count = $3, comments_count = $4, shares_count = $5, updated_at = CURRENT_TIMESTAMP`,
      [recipeId, score, likes, comments, shares],
    );
  }

  async getTrendingRecipes(limit = 20) {
    const result = await pool.query(
      'SELECT * FROM trending_recipes ORDER BY score DESC, updated_at DESC LIMIT $1',
      [limit],
    );
    return result.rows;
  }

  async getCommentsCount(recipeId: string) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM recipe_comments WHERE recipe_id = $1',
      [recipeId],
    );
    return parseInt(result.rows[0].count);
  }
}

export default new SocialService();
