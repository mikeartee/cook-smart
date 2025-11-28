const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env')});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {rejectUnauthorized: false},
});

async function runMigration() {
  try {
    console.log('Running migration 016: Add enhanced features...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/016_add_enhanced_features.sql'),
      'utf8',
    );

    await pool.query(migrationSQL);

    console.log('✅ Migration 016 completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
