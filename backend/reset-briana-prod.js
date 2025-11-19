require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const email = 'brianaolszewski1@gmail.com';
const newPassword = 'June172018!';

async function resetPassword() {
  try {
    console.log('🔍 Checking for user:', email);
    
    // First check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (checkResult.rows.length === 0) {
      console.log('❌ User not found with email:', email);
      console.log('📋 Listing all users:');
      const allUsers = await pool.query('SELECT id, email, first_name, last_name FROM users LIMIT 10');
      console.table(allUsers.rows);
    } else {
      console.log('✅ User found:', checkResult.rows[0]);
      
      // Hash the new password with bcrypt
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the password in the database
      const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING id, email, first_name',
        [hashedPassword, email]
      );
      
      console.log('✅ Password reset successful!');
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
