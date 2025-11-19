const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://cooksmartadmin:CookSmart2024!@100.30.52.52:5432/cooksmartdb'
});

async function checkAndResetBriana() {
  try {
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, first_name, last_name FROM users WHERE email = $1',
      ['brianaolszewski1@gmail.com']
    );

    if (checkResult.rows.length === 0) {
      console.log('❌ User not found. Creating new account...');
      
      // Create new account
      const hashedPassword = await bcrypt.hash('June172018!', 10);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const insertResult = await pool.query(
        `INSERT INTO users (id, email, password_hash, first_name, age_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, first_name`,
        [userId, 'brianaolszewski1@gmail.com', hashedPassword, 'Briana', true]
      );
      
      console.log('✅ Account created:', insertResult.rows[0]);
    } else {
      console.log('✅ User found:', checkResult.rows[0]);
      console.log('🔄 Resetting password...');
      
      // Reset password
      const hashedPassword = await bcrypt.hash('June172018!', 10);
      
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, 'brianaolszewski1@gmail.com']
      );
      
      console.log('✅ Password reset successfully!');
    }
    
    console.log('\n📧 Email: brianaolszewski1@gmail.com');
    console.log('🔑 Password: June172018!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkAndResetBriana();
