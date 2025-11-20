const bcrypt = require('bcrypt');
const {Pool} = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  port: 5432,
});

async function resetPassword() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate new password hash
    const password = 'CookSmart2024!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('New hash generated:', hashedPassword.substring(0, 30) + '...');

    // Update password
    const result = await client.query(
      `
      UPDATE users 
      SET password_hash = $1
      WHERE email = 'bradturnbough80@gmail.com'
      RETURNING email, substring(password_hash, 1, 30) as hash_preview
    `,
      [hashedPassword],
    );

    if (result.rows.length > 0) {
      console.log('✅ Password updated for:', result.rows[0].email);
      console.log('Hash preview:', result.rows[0].hash_preview);
    } else {
      console.log('❌ No user found with that email');
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetPassword();
