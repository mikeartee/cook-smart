import { Request, Response } from 'express';
import pool from '../config/database';
import AdminAuditLogger from '../services/AdminAuditLogger';

export class AdminFeedbackController {
  /**
   * List feedback with pagination and filters
   * GET /api/v1/admin/feedback?page=1&limit=50&category=Bug&rating=5&status=new
   */
  async listFeedback(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const category = req.query.category as string;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (category) {
        conditions.push(`f.category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }

      if (rating !== undefined) {
        conditions.push(`f.rating = $${paramCount}`);
        values.push(rating);
        paramCount++;
      }

      if (status) {
        conditions.push(`f.status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM feedback f ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get feedback with user info
      const query = `
        SELECT 
          f.*,
          u.email as user_email,
          u.first_name,
          u.last_name,
          au.username as admin_username
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN admin_users au ON f.admin_id = au.id
        ${whereClause}
        ORDER BY f.created_at DESC
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;

      values.push(limit, offset);
      const result = await pool.query(query, values);

      // Get statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total,
          AVG(rating) FILTER (WHERE rating IS NOT NULL) as avg_rating,
          COUNT(*) FILTER (WHERE category = 'Bug') as bug_count,
          COUNT(*) FILTER (WHERE category = 'Feature Request') as feature_count,
          COUNT(*) FILTER (WHERE category = 'General') as general_count,
          COUNT(*) FILTER (WHERE status = 'new') as new_count,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
          COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
          COUNT(*) FILTER (WHERE status = 'ignored') as ignored_count
        FROM feedback
      `;
      const statsResult = await pool.query(statsQuery);
      const stats = statsResult.rows[0];

      res.json({
        feedback: result.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        statistics: {
          total: parseInt(stats.total),
          averageRating: parseFloat(stats.avg_rating || 0).toFixed(2),
          byCategory: {
            Bug: parseInt(stats.bug_count),
            'Feature Request': parseInt(stats.feature_count),
            General: parseInt(stats.general_count),
          },
          byStatus: {
            new: parseInt(stats.new_count),
            in_progress: parseInt(stats.in_progress_count),
            resolved: parseInt(stats.resolved_count),
            ignored: parseInt(stats.ignored_count),
          },
        },
      });
    } catch (error) {
      console.error('List feedback error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  }

  /**
   * Get feedback details
   * GET /api/v1/admin/feedback/:id
   */
  async getFeedbackDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          f.*,
          u.id as user_id,
          u.email as user_email,
          u.first_name,
          u.last_name,
          u.created_at as user_joined_at,
          au.username as admin_username,
          au.email as admin_email
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        LEFT JOIN admin_users au ON f.admin_id = au.id
        WHERE f.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
      }

      res.json({
        feedback: result.rows[0],
      });
    } catch (error) {
      console.error('Get feedback details error:', error);
      res.status(500).json({ error: 'Failed to fetch feedback details' });
    }
  }

  /**
   * Update feedback status
   * PATCH /api/v1/admin/feedback/:id/status
   * Body: { status }
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['new', 'in_progress', 'resolved', 'ignored'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
        return;
      }

      const query = `
        UPDATE feedback
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const result = await pool.query(query, [status, id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
      }

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'update_feedback_status',
        resourceType: 'feedback',
        resourceId: id,
        details: { status },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Feedback status updated successfully',
        feedback: result.rows[0],
      });
    } catch (error) {
      console.error('Update feedback status error:', error);
      res.status(500).json({ error: 'Failed to update feedback status' });
    }
  }

  /**
   * Add or update admin notes
   * PATCH /api/v1/admin/feedback/:id/notes
   * Body: { notes }
   */
  async updateNotes(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      if (typeof notes !== 'string') {
        res.status(400).json({ error: 'notes must be a string' });
        return;
      }

      const query = `
        UPDATE feedback
        SET 
          admin_notes = $1,
          admin_id = $2,
          notes_updated_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [notes, req.admin!.id, id]);

      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Feedback not found' });
        return;
      }

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'update_feedback_notes',
        resourceType: 'feedback',
        resourceId: id,
        details: { notesLength: notes.length },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        message: 'Admin notes updated successfully',
        feedback: result.rows[0],
      });
    } catch (error) {
      console.error('Update feedback notes error:', error);
      res.status(500).json({ error: 'Failed to update admin notes' });
    }
  }

  /**
   * Export feedback as CSV
   * GET /api/v1/admin/feedback/export/csv?category=Bug&status=new
   */
  async exportFeedback(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string;
      const status = req.query.status as string;

      // Build WHERE clause
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (category) {
        conditions.push(`f.category = $${paramCount}`);
        values.push(category);
        paramCount++;
      }

      if (status) {
        conditions.push(`f.status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          f.id,
          f.user_id,
          u.email as user_email,
          u.first_name,
          u.last_name,
          f.rating,
          f.category,
          f.message,
          f.status,
          f.admin_notes,
          f.created_at,
          f.updated_at
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ${whereClause}
        ORDER BY f.created_at DESC
      `;

      const result = await pool.query(query, values);

      // Generate CSV
      let csv = 'ID,User Email,User Name,Rating,Category,Message,Status,Admin Notes,Created At,Updated At\n';
      
      result.rows.forEach(row => {
        const userName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        const message = (row.message || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const adminNotes = (row.admin_notes || '').replace(/"/g, '""').replace(/\n/g, ' ');
        
        csv += `"${row.id}","${row.user_email}","${userName}",${row.rating || ''},"${row.category}","${message}","${row.status}","${adminNotes}","${row.created_at}","${row.updated_at}"\n`;
      });

      // Log audit trail
      await AdminAuditLogger.log({
        adminId: req.admin!.id,
        action: 'export_feedback',
        resourceType: 'feedback',
        resourceId: 'bulk',
        details: { count: result.rows.length, filters: { category, status } },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="feedback-export-${Date.now()}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('Export feedback error:', error);
      res.status(500).json({ error: 'Failed to export feedback' });
    }
  }
}
