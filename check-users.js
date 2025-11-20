const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query('SELECT email, first_name, last_name, is_co_founder, is_special_user, is_creator FROM users ORDER BY created_at')
  .then(r => {
    console.log(JSON.stringify(r.rows, null, 2));
    pool.end();
  })
  .catch(e => {
    console.error(e);
    pool.end();
  });
