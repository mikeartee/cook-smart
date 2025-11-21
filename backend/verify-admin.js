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

async function verifyAdmin() {
  try {
    await pool.query(
      `UPDATE admin_users SET email_verified = true WHERE username = 'admin'`,
    );
    console.log('✅ Admin email verified');
    process.exit(0);
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

verifyAdmin();
