/**
 * Run Database Migration for API Usage Logs
 */

require('dotenv').config();

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  console.log('🔄 Running API usage logs migration...');
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'src/migrations/create_api_usage_logs_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Created api_usage_logs table');
    console.log('   - Created indexes for performance');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'api_usage_logs'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verified: api_usage_logs table exists');
    } else {
      console.log('⚠️  Warning: Could not verify table creation');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
