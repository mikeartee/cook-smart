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
    console.log('Running migration 017: Allow multiple recipes per meal...');

    const migrationSQL = fs.readFileSync(
      path.join(
        __dirname,
        '../migrations/017_allow_multiple_recipes_per_meal.sql',
      ),
      'utf8',
    );

    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log(
      '   - Removed unique constraint on (user_id, planned_date, meal_type)',
    );
    console.log('   - Users can now add multiple recipes per meal');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
