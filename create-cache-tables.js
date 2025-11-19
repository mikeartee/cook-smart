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
-- Recipe search cache table
CREATE TABLE IF NOT EXISTS recipe_search_cache (
  id SERIAL PRIMARY KEY,
  ingredient_hash VARCHAR(255) UNIQUE NOT NULL,
  recipe_ids TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_search_cache_hash ON recipe_search_cache(ingredient_hash);
CREATE INDEX IF NOT EXISTS idx_recipe_search_cache_expires ON recipe_search_cache(expires_at);

-- Recipe details cache table
CREATE TABLE IF NOT EXISTS recipe_cache (
  id SERIAL PRIMARY KEY,
  recipe_id VARCHAR(255) UNIQUE NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_cache_recipe_id ON recipe_cache(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_cache_expires ON recipe_cache(expires_at);

-- API usage log table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(100) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  cached BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- Notification logs table (for feedback notifications)
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  recipient VARCHAR(255),
  subject TEXT,
  message TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
`;

console.log('Creating cache and logging tables...');

pool.query(sql)
  .then(() => {
    console.log('✅ All cache and logging tables created successfully');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
