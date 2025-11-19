const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = fs.readFileSync('./migrations/003_create_feedback_table.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Feedback table migration complete');
    pool.end();
  })
  .catch(e => {
    console.error('❌ Migration failed:', e);
    pool.end();
    process.exit(1);
  });
