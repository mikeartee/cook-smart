const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? {rejectUnauthorized: false} : false,
});

async function checkUsersIdType() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'id'
    `);

    console.log('Users table ID column:');
    console.log(result.rows);

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUsersIdType();
