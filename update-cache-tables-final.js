const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- Drop and recreate cached_recipes with all required columns
DROP TABLE IF EXISTS cached_recipes CASCADE;
CREATE TABLE cached_recipes (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT false
);

CREATE INDEX idx_cached_recipes_recipe_id ON cached_recipes(recipe_id);
CREATE INDEX idx_cached_recipes_is_popular ON cached_recipes(is_popular);

-- Drop and recreate recipe_search_cache with all required columns
DROP TABLE IF EXISTS recipe_search_cache CASCADE;
CREATE TABLE recipe_search_cache (
  id SERIAL PRIMARY KEY,
  ingredient_hash VARCHAR(255) UNIQUE NOT NULL,
  recipe_ids TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  access_count INTEGER DEFAULT 0
);

CREATE INDEX idx_recipe_search_cache_hash ON recipe_search_cache(ingredient_hash);
CREATE INDEX idx_recipe_search_cache_expires ON recipe_search_cache(expires_at);
`;

console.log('Updating cache tables with all required columns...');

pool.query(sql)
  .then(() => {
    console.log('✅ Cache tables updated successfully with all columns');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
