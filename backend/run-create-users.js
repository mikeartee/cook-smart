const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const sql = fs.readFileSync('./create-users-table.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ Users table created successfully');
    pool.end();
  })
  .catch(e => {
    console.error('❌ Error:', e.message);
    pool.end();
    process.exit(1);
  });
