import express, {Request, Response} from 'express';
import {requireAdmin} from '../middleware/adminAuth';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// All routes require admin authentication
router.use(requireAdmin);

/**
 * Run database migration to create all required tables
 * POST /api/v1/admin/migration/run
 */
router.post('/run', async (req: Request, res: Response) => {
  try {
    console.log('[Migration] Starting database migration...');

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      '../../migrations/create_missing_tables_only.sql',
    );

    if (!fs.existsSync(migrationPath)) {
      res.status(404).json({error: 'Migration file not found'});
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('[Migration] ✅ Database migration completed successfully');

    res.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Migration] ❌ Migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Check migration status - verify tables exist
 * GET /api/v1/admin/migration/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const requiredTables = [
      'user_ingredients',
      'user_recipes',
      'user_referrals',
      'referrals',
      'feedback',
      'subscriptions',
      'feature_usage',
      'system_health',
      'cache_metrics',
      'recipe_cache',
      'admin_audit_log',
      'security_events',
      'password_reset_tokens',
    ];

    const tableStatus = [];

    for (const tableName of requiredTables) {
      const query = `
        SELECT table_name, 
               (SELECT COUNT(*) FROM ${tableName}) as row_count
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `;

      try {
        const result = await pool.query(query, [tableName]);
        if (result.rows.length > 0) {
          tableStatus.push({
            table: tableName,
            exists: true,
            rowCount: parseInt(result.rows[0].row_count) || 0,
          });
        } else {
          tableStatus.push({
            table: tableName,
            exists: false,
            rowCount: 0,
          });
        }
      } catch (error) {
        tableStatus.push({
          table: tableName,
          exists: false,
          rowCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const existingTables = tableStatus.filter(t => t.exists).length;
    const totalTables = requiredTables.length;

    res.json({
      migrationComplete: existingTables === totalTables,
      tablesExisting: existingTables,
      tablesRequired: totalTables,
      tables: tableStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Migration] Error checking status:', error);
    res.status(500).json({
      error: 'Failed to check migration status',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
