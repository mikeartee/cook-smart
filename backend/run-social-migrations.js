const fs = require('fs');
const path = require('path');
const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false,
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🚀 Running social and advanced recipe migrations...\n');

    // Migration 017: Social Features
    console.log('📝 Running migration 017: Social Features...');
    const migration017 = fs.readFileSync(
      path.join(__dirname, 'migrations', '017_create_social_features.sql'),
      'utf8',
    );
    await client.query(migration017);
    console.log('✅ Migration 017 complete\n');

    // Migration 018: Advanced Recipe Features
    console.log('📝 Running migration 018: Advanced Recipe Features...');
    const migration018 = fs.readFileSync(
      path.join(
        __dirname,
        'migrations',
        '018_create_advanced_recipe_features.sql',
      ),
      'utf8',
    );
    await client.query(migration018);
    console.log('✅ Migration 018 complete\n');

    console.log('🎉 All migrations completed successfully!');
    console.log('\n📊 Tables created:');
    console.log('  - user_follows');
    console.log('  - recipe_comments');
    console.log('  - recipe_likes');
    console.log('  - recipe_shares');
    console.log('  - user_activity_feed');
    console.log('  - trending_recipes');
    console.log('  - recipe_nutrition');
    console.log('  - recipe_timers');
    console.log('  - cooking_sessions');
    console.log('  - recipe_tags');
    console.log('  - seasonal_recipes');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
