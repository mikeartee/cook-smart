const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function checkAdminStatus() {
  try {
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, is_admin, is_co_founder, is_creator
      FROM users
      WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com')
    `);

    console.log('Admin Status Check:\n');
    result.rows.forEach(user => {
      console.log(`${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`  is_admin: ${user.is_admin}`);
      console.log(`  is_co_founder: ${user.is_co_founder}`);
      console.log(`  is_creator: ${user.is_creator}`);
      console.log(
        `  Has Admin Access: ${user.is_admin || user.is_co_founder || user.is_creator ? 'YES ✅' : 'NO ❌'}`,
      );
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAdminStatus();
