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

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname='public' 
      ORDER BY tablename
    `);
    
    console.log('📋 Existing tables:');
    result.rows.forEach(row => console.log('  -', row.tablename));
    
    // Check users table structure
    const usersCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='users'
      ORDER BY ordinal_position
    `);
    
    console.log('\n👤 Users table columns:');
    usersCheck.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

checkTables();
