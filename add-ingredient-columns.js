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
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS default_unit VARCHAR(50) DEFAULT 'piece',
ADD COLUMN IF NOT EXISTS nutrition_per_100g JSONB;
`;

console.log('Adding missing columns to ingredients table...');

pool.query(sql)
  .then(() => {
    console.log('✅ Columns added successfully');
    return pool.end();
  })
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
