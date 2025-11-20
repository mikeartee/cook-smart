const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: '100.30.52.52',
  port: 5432,
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running points tables migration...');
    
    const sqlPath = path.join(__dirname, 'create-points-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Points tables created successfully!');
    
    // Check results
    const pointsCount = await client.query('SELECT COUNT(*) FROM user_points');
    const transactionsCount = await client.query('SELECT COUNT(*) FROM points_transactions');
    
    console.log(`📊 User points records: ${pointsCount.rows[0].count}`);
    console.log(`📊 Points transactions: ${transactionsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
