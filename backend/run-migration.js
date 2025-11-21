const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function runMigration() {
  try {
    console.log('🔄 Running privacy settings migration...');

    const migrationPath = path.join(
      __dirname,
      'migrations',
      'add_privacy_settings_to_users.sql',
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration completed successfully!');

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('data_sharing', 'analytics_enabled', 'push_notifications', 'location_services', 'two_factor_enabled')
    `);

    console.log(
      '✅ Verified columns:',
      result.rows.map(r => r.column_name).join(', '),
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
