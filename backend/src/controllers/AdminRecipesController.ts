import {Request, Response} from 'express';
import pool from '../config/database';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminRecipesController {
  /**
   * List recipes with pagination, search, and filters
   * GET /api/v1/admin/recipes?page=1&limit=20&search=pasta&status=published
   */
  async listRecipes(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string; // published, draft
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Search by title only (description might not exist)
      if (search) {
        conditions.push(`LOWER(ur.recipe_title) LIKE LOWER($${paramCount})`);
        values.push(`%${search}%`);
        paramCount++;
      }

      // Filter by status (for now, all user recipes are considered 'published')
      if (status === 'draft') {
        conditions.push(`COALESCE(ur.is_private, false) = true`);
      } else if (status === 'published') {
        conditions.push(`COALESCE(ur.is_private, false) = false`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) 
        FROM user_recipes ur
        LEFT JOIN users u ON ur.user_id = u.id
        ${whereClause}
      `;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get recipes with user info - using only basic columns that exist
      const query = `
        SELECT 
          ur.id,
          ur.recipe_title as title,
          COALESCE(ur.recipe_description, 'No description') as description,
          COALESCE(ur.recipe_image_url, '') as "imageUrl",
          COALESCE(ur.is_private, false) as is_private,
          ur.created_at as "createdAt",
          COALESCE(ur.updated_at, ur.created_at) as "updatedAt",
          CASE 
            WHEN COALESCE(ur.is_private, false) = true THEN 'draft'
            ELSE 'published'
          END as status,
          false as "isFeatured",
          ur.user_id as "authorId",
          COALESCE(u.email, 'Unknown User') as "authorName"
        FROM user_recipes ur
        LEFT JOIN users u ON ur.user_id = u.id
        ${whereClause}
        ORDER BY ur.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const result = await pool.query(query, values);

      // Transform data to match frontend expectations
      const transformedRecipes = result.rows.map(recipe => ({
        ...recipe,
        author: {
          id: recipe.authorId,
          name: recipe.authorName,
        },
      }));

      res.json({
        recipes: transformedRecipes,
        total,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('List recipes error:', error);
      res.status(500).json({error: 'Failed to fetch recipes'});
    }
  }

  /**
   * Get recipe details
   * GET /api/v1/admin/recipes/:id
   */
  async getRecipeDetails(req: Request, res: Response): Promise<void> {
    try {
      const {id} = req.params;

      const query = `
        SELECT 
          ur.*,
          u.email as user_email,
          COALESCE(
            NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''),
            u.email
          ) as user_name
        FROM user_recipes ur
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE ur.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({error: 'Recipe not found'});
        return;
      }

      res.json({recipe: result.rows[0]});
    } catch (error) {
      console.error('Get recipe details error:', error);
      res.status(500).json({error: 'Failed to fetch recipe details'});
    }
  }

  /**
   * Update recipe status
   * PATCH /api/v1/admin/recipes/:id/status
   */
  async updateRecipeStatus(req: Request, res: Response): Promise<void> {
    try {
      const {id} = req.params;
      const {status} = req.body; // 'published' or 'draft'

      if (!['published', 'draft'].includes(status)) {
        res.status(400).json({error: 'Status must be "published" or "draft"'});
        return;
      }

      const isPrivate = status === 'draft';

      const query = `
        UPDATE user_recipes
        SET 
          is_private = $1,
          updated_at = NOW()
        WHERE id = $2
        RETURNING id, recipe_title, is_private
      `;

      const result = await pool.query(query, [isPrivate, id]);

      if (result.rows.length === 0) {
        res.status(404).json({error: 'Recipe not found'});
        return;
      }

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'update_recipe_status',
        resourceType: 'recipe',
        resourceId: id,
        details: {status},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `Recipe ${status === 'published' ? 'published' : 'set to draft'}`,
        recipe: result.rows[0],
      });
    } catch (error) {
      console.error('Update recipe status error:', error);
      res.status(500).json({error: 'Failed to update recipe status'});
    }
  }

  /**
   * Bulk update recipes
   * PATCH /api/v1/admin/recipes/bulk/update
   */
  async bulkUpdateRecipes(req: Request, res: Response): Promise<void> {
    try {
      const {recipeIds, status} = req.body;

      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        res.status(400).json({error: 'recipeIds must be a non-empty array'});
        return;
      }

      if (!['published', 'draft'].includes(status)) {
        res.status(400).json({error: 'Status must be "published" or "draft"'});
        return;
      }

      const isPrivate = status === 'draft';
      const placeholders = recipeIds.map((_, i) => `$${i + 2}`).join(',');

      const query = `
        UPDATE user_recipes
        SET 
          is_private = $1,
          updated_at = NOW()
        WHERE id IN (${placeholders})
        RETURNING id, recipe_title
      `;

      const result = await pool.query(query, [isPrivate, ...recipeIds]);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'bulk_update_recipes',
        resourceType: 'recipe',
        resourceId: 'bulk',
        details: {recipeIds, status, count: result.rows.length},
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `${result.rows.length} recipes updated to ${status}`,
        updatedRecipes: result.rows,
      });
    } catch (error) {
      console.error('Bulk update recipes error:', error);
      res.status(500).json({error: 'Failed to update recipes'});
    }
  }

  /**
   * Bulk delete recipes
   * DELETE /api/v1/admin/recipes/bulk/delete
   */
  async bulkDeleteRecipes(req: Request, res: Response): Promise<void> {
    try {
      const {recipeIds} = req.body;

      if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
        res.status(400).json({error: 'recipeIds must be a non-empty array'});
        return;
      }

      const placeholders = recipeIds.map((_, i) => `$${i + 1}`).join(',');

      // Get recipe info before deletion
      const selectQuery = `
        SELECT id, recipe_title, user_id
        FROM user_recipes
        WHERE id IN (${placeholders})
      `;
      const selectResult = await pool.query(selectQuery, recipeIds);

      // Delete recipes
      const deleteQuery = `
        DELETE FROM user_recipes
        WHERE id IN (${placeholders})
        RETURNING id
      `;
      const deleteResult = await pool.query(deleteQuery, recipeIds);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'bulk_delete_recipes',
        resourceType: 'recipe',
        resourceId: 'bulk',
        details: {
          recipeIds,
          count: deleteResult.rows.length,
          recipes: selectResult.rows,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: `${deleteResult.rows.length} recipes deleted`,
        deletedCount: deleteResult.rows.length,
      });
    } catch (error) {
      console.error('Bulk delete recipes error:', error);
      res.status(500).json({error: 'Failed to delete recipes'});
    }
  }

  /**
   * Delete single recipe
   * DELETE /api/v1/admin/recipes/:id
   */
  async deleteRecipe(req: Request, res: Response): Promise<void> {
    try {
      const {id} = req.params;

      // Get recipe info before deletion
      const selectQuery = `
        SELECT id, recipe_title, user_id
        FROM user_recipes
        WHERE id = $1
      `;
      const selectResult = await pool.query(selectQuery, [id]);

      if (selectResult.rows.length === 0) {
        res.status(404).json({error: 'Recipe not found'});
        return;
      }

      const recipe = selectResult.rows[0];

      // Delete recipe
      const deleteQuery = 'DELETE FROM user_recipes WHERE id = $1';
      await pool.query(deleteQuery, [id]);

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'delete_recipe',
        resourceType: 'recipe',
        resourceId: id,
        details: {
          title: recipe.recipe_title,
          userId: recipe.user_id,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Recipe deleted successfully',
        deletedRecipe: {
          id: recipe.id,
          title: recipe.recipe_title,
        },
      });
    } catch (error) {
      console.error('Delete recipe error:', error);
      res.status(500).json({error: 'Failed to delete recipe'});
    }
  }
}
