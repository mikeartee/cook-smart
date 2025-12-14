require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  host:
    process.env.DB_HOST ||
    'cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cooksmartdb',
  user: process.env.DB_USER || 'cooksmartadmin',
  password: process.env.DB_PASSWORD || 'CookSmart2024!',
});

async function createMissingTables() {
  console.log('🔧 Creating missing database tables...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. User Recipes Tables
    console.log('Creating user_recipes table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_recipes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        prep_time INTEGER DEFAULT 0,
        cook_time INTEGER DEFAULT 0,
        servings INTEGER DEFAULT 4,
        category VARCHAR(100),
        difficulty VARCHAR(20) DEFAULT 'medium',
        is_public BOOLEAN DEFAULT false,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating user_recipe_ingredients table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        quantity VARCHAR(50),
        unit VARCHAR(50),
        sort_order INTEGER DEFAULT 0
      )
    `);

    console.log('Creating user_recipe_instructions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_recipe_instructions (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        step_number INTEGER NOT NULL,
        instruction TEXT NOT NULL
      )
    `);

    console.log('Creating user_recipe_photos table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_recipe_photos (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        sort_order INTEGER DEFAULT 0
      )
    `);

    // 2. Recipe Cache Table
    console.log('Creating recipe_cache table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipe_cache (
        id SERIAL PRIMARY KEY,
        recipe_id VARCHAR(50) NOT NULL UNIQUE,
        source VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        ready_in_minutes INTEGER DEFAULT 30,
        servings INTEGER DEFAULT 4,
        ingredients JSONB,
        instructions TEXT,
        nutrition JSONB,
        dietary_info JSONB,
        meal_type VARCHAR(100),
        cuisine VARCHAR(100),
        season VARCHAR(50),
        view_count INTEGER DEFAULT 0,
        save_count INTEGER DEFAULT 0,
        trending_score DECIMAL(10,2) DEFAULT 0,
        date_cached TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. User Dietary Preferences Tables
    console.log('Creating user_dietary_restrictions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_dietary_restrictions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        restriction_id INTEGER NOT NULL,
        notes TEXT,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating user_allergies table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_allergies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        allergy_id INTEGER NOT NULL,
        severity VARCHAR(20) DEFAULT 'moderate',
        notes TEXT,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Other missing tables
    console.log('Creating user_points table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_points (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        points INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating user_point_history table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_point_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        date_earned TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Creating user_feedback table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        rating INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Create indexes
    console.log('Creating indexes...');
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_user_recipes_user_id ON user_recipes(user_id)',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_recipe_cache_recipe_id ON recipe_cache(recipe_id)',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_user_dietary_restrictions_user_id ON user_dietary_restrictions(user_id)',
    );
    await client.query(
      'CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON user_allergies(user_id)',
    );

    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

createMissingTables()
  .then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  });
