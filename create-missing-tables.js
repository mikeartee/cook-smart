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
-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  barcode VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_barcode ON ingredients(barcode);

-- Create user_ingredients table
CREATE TABLE IF NOT EXISTS user_ingredients (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50) DEFAULT 'piece',
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, ingredient_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ingredients_user_id ON user_ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ingredients_expiration ON user_ingredients(expiration_date);
`;

console.log('Creating missing tables...');

pool.query(sql)
  .then(() => {
    console.log('✅ Tables created successfully');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    console.error(err);
    process.exit(1);
  });
