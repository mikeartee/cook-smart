/**
 * Run All Database Migrations
 *
 * This script runs all SQL migrations in the migrations folder in order.
 * Usage: node run-all-migrations.js
 */

const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function runMigration(filename, description) {
  console.log(`\n📝 Running migration: ${description}...`);

  try {
    const sqlPath = path.join(__dirname, 'migrations', filename);

    if (!fs.existsSync(sqlPath)) {
      console.log(`⚠️  Migration file not found: ${filename}, skipping...`);
      return true;
    }

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

    // Run migrations in order
    const migrations = [
      {file: '001_initial_schema.sql', desc: 'Initial schema setup'},
      {file: '002_create_users.sql', desc: 'Create users table'},
      {
        file: '003_create_subscriptions.sql',
        desc: 'Create subscriptions tables',
      },
      {file: '004_create_feedback.sql', desc: 'Create feedback table'},
      {
        file: '005_create_notification_logs.sql',
        desc: 'Create notification logs table',
      },
      {file: '006_create_admin_system.sql', desc: 'Create admin system tables'},
      {
        file: '007_create_subscription_pricing.sql',
        desc: 'Create subscription pricing tables',
      },
    ];

    let successCount = 0;
    for (const migration of migrations) {
      const success = await runMigration(migration.file, migration.desc);
      if (success) successCount++;
    }

    console.log('\n' + '='.repeat(50));
    console.log(
      `\n✅ Migrations complete: ${successCount}/${migrations.length} successful\n`,
    );

    // Verify new tables exist
    console.log('🔍 Verifying subscription pricing tables...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscription_plans', 'app_configuration')
      ORDER BY table_name
    `);

    console.log(`✅ Found ${result.rows.length} new tables:`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check if columns were added to subscriptions
    console.log('\n🔍 Verifying subscriptions table columns...');
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('promotional_price_used', 'referral_code_used', 'initial_price', 'renewal_price')
      ORDER BY column_name
    `);

    console.log(
      `✅ Found ${columnsResult.rows.length} new columns in subscriptions:`,
    );
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    console.log('\n🎉 Database is ready for subscription pricing system!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllMigrations();
