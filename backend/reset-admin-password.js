const {Pool} = require('pg');
const bcrypt = require('bcryptjs');
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

async function resetAdminPassword() {
  try {
    const username = 'brad';
    const newPassword = 'June172018!';

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const updateQuery = `
      UPDATE admin_users 
      SET password_hash = $1, updated_at = NOW()
      WHERE username = $2
      RETURNING id, username, email
    `;

    const result = await pool.query(updateQuery, [passwordHash, username]);

    if (result.rows.length > 0) {
      console.log(`✅ Password reset successful for user:`, result.rows[0]);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log(`❌ User '${username}' not found`);
    }
  } catch (error) {
    console.error('Error resetting password:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();
