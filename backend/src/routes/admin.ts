import { Router, Request, Response } from 'express';
import pool from '../config/database';
import fs from 'fs';
import path from 'path';

const router = Router();

// Run database migration
router.post('/run-migration', async (req: Request, res: Response) => {
  try {
    console.log('🔄 Running API usage logs migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../migrations/create_api_usage_logs_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'api_usage_logs'
    `);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      table_exists: result.rows.length > 0
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
