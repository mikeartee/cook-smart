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
-- Fix recipe_cache table name (it's looking for cached_recipes)
DROP TABLE IF EXISTS cached_recipes CASCADE;
CREATE TABLE IF NOT EXISTS cached_recipes (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cached_recipes_recipe_id ON cached_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_cached_recipes_expires ON cached_recipes(expires_at);

-- Add missing response_time column to api_usage_logs
ALTER TABLE api_usage_logs 
ADD COLUMN IF NOT EXISTS response_time INTEGER;

-- Update existing response_time_ms to response_time
UPDATE api_usage_logs SET response_time = response_time_ms WHERE response_time IS NULL;
`;

console.log('Fixing cache table issues...');

pool.query(sql)
  .then(() => {
    console.log('✅ Cache tables fixed successfully');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
