import express from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// Submit feedback on a substitution
router.post(
  '/feedback',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {recipeId, original, substitute, rating, worked, notes} = req.body;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      // Validate required fields
      if (
        !recipeId ||
        !original ||
        !substitute ||
        typeof worked !== 'boolean'
      ) {
        res.status(400).json({
          error:
            'Missing required fields: recipeId, original, substitute, worked',
        });
        return;
      }

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        res.status(400).json({error: 'Rating must be between 1 and 5'});
        return;
      }

      // Insert feedback
      await pool.query(
        `INSERT INTO substitution_feedback 
       (user_id, recipe_id, original_ingredient, substitute_ingredient, rating, worked, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          recipeId,
          original,
          substitute,
          rating || null,
          worked,
          notes || null,
        ],
      );

      res.json({
        success: true,
        message: 'Thank you for your feedback!',
      });
    } catch (error) {
      console.error('[Substitution Feedback] Error:', error);
      res.status(500).json({error: 'Failed to submit feedback'});
    }
  },
);

// Get statistics for a specific ingredient substitution
router.get('/:original/stats', async (req, res): Promise<void> => {
  try {
    const {original} = req.params;

    const stats = await pool.query(
      `SELECT 
        substitute_ingredient,
        COUNT(*) as usage_count,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN worked = true THEN 1 END)::float / COUNT(*) * 100 as success_rate,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as highly_rated_count
      FROM substitution_feedback
      WHERE LOWER(original_ingredient) = LOWER($1)
      GROUP BY substitute_ingredient
      ORDER BY success_rate DESC, avg_rating DESC, usage_count DESC`,
      [original],
    );

    const substitutes = stats.rows.map(row => ({
      ingredient: row.substitute_ingredient,
      usageCount: parseInt(row.usage_count),
      avgRating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null,
      successRate: row.success_rate
        ? parseFloat(row.success_rate).toFixed(1)
        : 0,
      highlyRatedCount: parseInt(row.highly_rated_count),
      confidence: calculateConfidence(
        parseInt(row.usage_count),
        parseFloat(row.success_rate),
      ),
    }));

    res.json({
      original,
      substitutes,
      totalFeedback: substitutes.reduce((sum, s) => sum + s.usageCount, 0),
    });
  } catch (error) {
    console.error('[Substitution Stats] Error:', error);
    res.status(500).json({error: 'Failed to get substitution stats'});
  }
});

// Get user's feedback history
router.get(
  '/my-feedback',
  authenticateToken,
  async (req: AuthRequest, res): Promise<void> => {
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const result = await pool.query(
        `SELECT 
        id,
        recipe_id,
        original_ingredient,
        substitute_ingredient,
        rating,
        worked,
        notes,
        created_at
      FROM substitution_feedback
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
        [userId, limit],
      );

      res.json({
        feedback: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('[My Feedback] Error:', error);
      res.status(500).json({error: 'Failed to get feedback history'});
    }
  },
);

// Get top-rated substitutions across all ingredients
router.get('/top-rated', async (req, res): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await pool.query(
      `SELECT 
        original_ingredient,
        substitute_ingredient,
        COUNT(*) as usage_count,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN worked = true THEN 1 END)::float / COUNT(*) * 100 as success_rate
      FROM substitution_feedback
      WHERE rating IS NOT NULL
      GROUP BY original_ingredient, substitute_ingredient
      HAVING COUNT(*) >= 3
      ORDER BY avg_rating DESC, success_rate DESC
      LIMIT $1`,
      [limit],
    );

    const topRated = result.rows.map(row => ({
      original: row.original_ingredient,
      substitute: row.substitute_ingredient,
      usageCount: parseInt(row.usage_count),
      avgRating: parseFloat(row.avg_rating).toFixed(1),
      successRate: parseFloat(row.success_rate).toFixed(1),
    }));

    res.json({
      topRated,
      count: topRated.length,
    });
  } catch (error) {
    console.error('[Top Rated] Error:', error);
    res.status(500).json({error: 'Failed to get top-rated substitutions'});
  }
});

// Helper function to calculate confidence level
function calculateConfidence(
  usageCount: number,
  successRate: number,
): 'high' | 'medium' | 'low' {
  if (usageCount >= 20 && successRate >= 80) return 'high';
  if (usageCount >= 10 && successRate >= 70) return 'medium';
  return 'low';
}

export default router;
