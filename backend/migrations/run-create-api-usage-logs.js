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
    console.log('🔄 Running API usage logs table migration...');
    
    const sqlPath = path.join(__dirname, 'create-api-usage-logs-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ API usage logs table created successfully!');
    
    // Check results
    const logsCount = await client.query('SELECT COUNT(*) FROM api_usage_logs');
    
    console.log(`📊 API usage logs records: ${logsCount.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
