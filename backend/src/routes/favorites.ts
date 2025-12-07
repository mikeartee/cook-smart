import express, {Response} from 'express';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// Get user's favorite recipes
router.get(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const query = `
      SELECT 
        f.id,
        f.recipe_id,
        f.created_at,
        rc.title,
        rc.image_url,
        rc.source,
        rc.cuisine AS cuisine_type,
        rc.meal_type,
        rc.ready_in_minutes AS prep_time
      FROM favorites f
      LEFT JOIN recipe_cache rc ON f.recipe_id = rc.recipe_id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;

      const result = await pool.query(query, [userId]);

      res.json({
        favorites: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error('[Get Favorites] Error:', error);
      res.status(500).json({error: 'Failed to get favorites'});
    }
  },
);

// Add recipe to favorites
router.post(
  '/',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {recipeId} = req.body;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      if (!recipeId) {
        res.status(400).json({error: 'Recipe ID is required'});
        return;
      }

      // Check if already in favorites
      const checkQuery = `
      SELECT id FROM favorites 
      WHERE user_id = $1 AND recipe_id = $2
    `;
      const checkResult = await pool.query(checkQuery, [userId, recipeId]);

      if (checkResult.rows.length > 0) {
        res.status(400).json({
          error: 'Recipe already in favorites',
          message: 'This recipe is already in your favorites',
        });
        return;
      }

      // Add to favorites
      const insertQuery = `
      INSERT INTO favorites (user_id, recipe_id)
      VALUES ($1, $2)
      RETURNING id, recipe_id, created_at
    `;
      const insertResult = await pool.query(insertQuery, [userId, recipeId]);

      res.status(201).json({
        message: 'Recipe added to favorites',
        favorite: insertResult.rows[0],
      });
    } catch (error) {
      console.error('[Add Favorite] Error:', error);
      res.status(500).json({error: 'Failed to add favorite'});
    }
  },
);

// Remove recipe from favorites
router.delete(
  '/:recipeId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {recipeId} = req.params;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const deleteQuery = `
      DELETE FROM favorites 
      WHERE user_id = $1 AND recipe_id = $2
      RETURNING id
    `;
      const result = await pool.query(deleteQuery, [userId, recipeId]);

      if (result.rows.length === 0) {
        res.status(404).json({error: 'Favorite not found'});
        return;
      }

      res.json({
        message: 'Recipe removed from favorites',
      });
    } catch (error) {
      console.error('[Remove Favorite] Error:', error);
      res.status(500).json({error: 'Failed to remove favorite'});
    }
  },
);

// Check if recipe is in favorites
router.get(
  '/check/:recipeId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const {recipeId} = req.params;

      if (!userId) {
        res.status(401).json({error: 'User not authenticated'});
        return;
      }

      const query = `
      SELECT id FROM favorites 
      WHERE user_id = $1 AND recipe_id = $2
    `;
      const result = await pool.query(query, [userId, recipeId]);

      res.json({
        isFavorite: result.rows.length > 0,
      });
    } catch (error) {
      console.error('[Check Favorite] Error:', error);
      res.status(500).json({error: 'Failed to check favorite status'});
    }
  },
);

export default router;
