import pool from '../config/database';
import {
  computeTrendingScore,
  TRENDING_DEFAULTS,
} from './TrendingScoreCalculator';

export type RecipeType = 'api' | 'user';

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
      // Likes are tracked on api recipes (the social engagement layer is wired
      // for the FatSecret corpus). Pass 'api' explicitly so the rating
      // aggregation reads from the right partition of recipe_ratings.
      await this.updateTrendingScore(recipeId, 'api');
    }
    return result.rows[0];
  }

  async unlikeRecipe(recipeId: string, userId: string) {
    await pool.query(
      'DELETE FROM recipe_likes WHERE recipe_id = $1 AND user_id = $2',
      [recipeId, userId],
    );
    await this.updateTrendingScore(recipeId, 'api');
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
    await this.updateTrendingScore(recipeId, 'api');
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
  /**
   * Recompute the denormalised trending aggregates for a recipe.
   *
   * Reads engagement counts (likes/comments/shares) and rating aggregates
   * (sum, count) from their source tables, delegates the score arithmetic to
   * `TrendingScoreCalculator` (per ADR 0002), and writes the new score plus
   * `rating_average` and `rating_count` to both `trending_recipes` and
   * `recipe_cache` (per ADR 0003).
   *
   * `recipeType` is required because `recipe_ratings` is keyed by
   * `(user_id, recipe_id, recipe_type)`. Callers from the social side
   * (likes/comments/shares) default to `'api'` since the existing engagement
   * paths operate on the FatSecret-sourced recipe corpus.
   */
  async updateTrendingScore(recipeId: string, recipeType: RecipeType = 'api') {
    const [likes, comments, shares, ratingAggregates] = await Promise.all([
      this.getLikesCount(recipeId),
      this.getCommentsCount(recipeId),
      this.getSharesCount(recipeId),
      this.getRatingAggregates(recipeId, recipeType),
    ]);

    const {sumOfRatings, totalRatings, ratingAverage} = ratingAggregates;

    const score = computeTrendingScore(
      {likes, comments, shares, sumOfRatings, totalRatings},
      TRENDING_DEFAULTS,
    );

    // trending_recipes is keyed by recipe_id only.
    await pool.query(
      `INSERT INTO trending_recipes (
         recipe_id, score, likes_count, comments_count, shares_count,
         rating_average, rating_count, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       ON CONFLICT (recipe_id) DO UPDATE
       SET score          = $2,
           likes_count    = $3,
           comments_count = $4,
           shares_count   = $5,
           rating_average = $6,
           rating_count   = $7,
           updated_at     = CURRENT_TIMESTAMP`,
      [recipeId, score, likes, comments, shares, ratingAverage, totalRatings],
    );

    // recipe_cache.rating_average / rating_count: update the existing row only.
    // We never insert into recipe_cache from this path — it's populated by the
    // recipe-fetch pipeline.
    await pool.query(
      `UPDATE recipe_cache
       SET rating_average = $2,
           rating_count   = $3
       WHERE recipe_id = $1`,
      [recipeId, ratingAverage, totalRatings],
    );
  }

  async getRatingAggregates(recipeId: string, recipeType: RecipeType) {
    const result = await pool.query(
      `SELECT
         COALESCE(SUM(rating), 0)::int   AS sum_of_ratings,
         COUNT(*)::int                   AS total_ratings,
         COALESCE(AVG(rating)::numeric(3,2), 0) AS rating_average
       FROM recipe_ratings
       WHERE recipe_id = $1 AND recipe_type = $2`,
      [recipeId, recipeType],
    );
    const row = result.rows[0];
    return {
      sumOfRatings: Number(row.sum_of_ratings),
      totalRatings: Number(row.total_ratings),
      ratingAverage: Number(row.rating_average),
    };
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
