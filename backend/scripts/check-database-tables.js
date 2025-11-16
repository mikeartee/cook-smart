/**
 * Check what tables exist in the database
 */

require('dotenv').config();
const {Pool} = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function checkTables() {
  try {
    console.log('🔍 Checking existing database tables...\n');

    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`✅ Found ${result.rows.length} tables:\n`);
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // Check if subscriptions table exists
    const hasSubscriptions = result.rows.some(
      row => row.table_name === 'subscriptions',
    );

    if (hasSubscriptions) {
      console.log('\n✅ Subscriptions table exists!');

      // Check columns
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'subscriptions'
        ORDER BY ordinal_position
      `);

      console.log('\n📋 Subscriptions table columns:');
      columns.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('\n❌ Subscriptions table does NOT exist');
      console.log(
        '   You need to create it first before running the pricing migration',
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
