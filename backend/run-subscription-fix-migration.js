const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting subscription user_id type fix migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', '012_fix_subscriptions_user_id_type.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ subscriptions.user_id changed from INTEGER to VARCHAR(255)');
    console.log('✅ subscription_transactions.user_id changed from INTEGER to VARCHAR(255)');
    console.log('✅ Foreign key constraints added');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

