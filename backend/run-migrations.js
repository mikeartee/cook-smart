/**
 * Run Database Migrations
 * 
 * This script runs the feedback and notification_logs table migrations.
 * Usage: node run-migrations.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

async function runMigration(filename, description) {
  console.log(`\n📝 Running migration: ${description}...`);
  
  try {
    const sqlPath = path.join(__dirname, 'src', 'migrations', filename);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 Starting database migrations...');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Host: ${process.env.DB_HOST}\n`);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run migrations
    const migrations = [
      { file: 'create_feedback_table.sql', desc: 'Create feedback table' },
      { file: 'create_notification_logs_table.sql', desc: 'Create notification_logs table' },
    ];

    let successCount = 0;
    for (const migration of migrations) {
      const success = await runMigration(migration.file, migration.desc);
      if (success) successCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Migrations complete: ${successCount}/${migrations.length} successful\n`);

    // Verify tables exist
    console.log('🔍 Verifying tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('feedback', 'notification_logs')
      ORDER BY table_name
    `);

    console.log(`✅ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Database is ready for Discord notifications!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllMigrations();
