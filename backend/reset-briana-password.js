const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const email = 'brianaolszewski1@gmail.com';
const newPassword = 'June172018!';

async function resetPassword() {
  try {
    // Hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the database
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, email, first_name',
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found with email:', email);
    } else {
      console.log('✅ Password reset successful for:', result.rows[0]);
      console.log('📧 Email:', result.rows[0].email);
      console.log('🔑 New password:', newPassword);
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    pool.end();
    process.exit(1);
  }
}

resetPassword();
