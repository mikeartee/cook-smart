/**
 * Run Subscription System Migration
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

async function runMigration() {
  console.log('🚀 Running subscription system migration...');
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🔗 Host: ${process.env.DB_HOST}\n`);

  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful\n');

    // Run migration
    const sqlPath = path.join(
      __dirname,
      'migrations',
      '001_create_subscriptions_complete.sql',
    );
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Creating subscription tables...');
    await pool.query(sql);
    console.log('✅ Migration completed successfully\n');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscriptions', 'subscription_plans', 'app_configuration', 'subscription_events', 'subscription_transactions')
      ORDER BY table_name
    `);

    console.log('✅ Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('\n🎉 Subscription system is ready!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
