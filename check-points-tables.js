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

pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%point%' ORDER BY tablename")
  .then(r => {
    console.log('Points tables:', r.rows.map(x => x.tablename).join(', '));
    if (r.rows.length === 0) {
      console.log('❌ No points tables found!');
    }
    pool.end();
  })
  .catch(e => {
    console.error('Error:', e.message);
    pool.end();
  });
