const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function addApprovedEmail() {
  try {
    const email = 'bradturnbough80@gmail.com';

    // Check if already exists
    const checkQuery = 'SELECT * FROM approved_admin_emails WHERE email = $1';
    const checkResult = await pool.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      console.log(`✅ Email ${email} is already approved`);
      return;
    }

    // Add the email
    const insertQuery = `
      INSERT INTO approved_admin_emails (email, is_super_admin, added_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [email, true]); // Making you super admin
    console.log(`✅ Added ${email} as approved admin:`, result.rows[0]);
  } catch (error) {
    console.error('Error adding approved email:', error.message);
  } finally {
    await pool.end();
  }
}

addApprovedEmail();
