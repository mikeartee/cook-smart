require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Users Table Structure:\n');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''} ${col.is_nullable === 'NO' ? '[NOT NULL]' : ''}`);
    });
    
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Total users in database: ${countResult.rows[0].count}\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
