const bcrypt = require('bcrypt');
const {Pool} = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  port: 5432,
});

async function setCorrectPassword() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate password hash for June172018
    const password = 'June172018';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('Setting password to: June172018');
    console.log('Hash generated:', hashedPassword.substring(0, 30) + '...');

    // Update password and ensure email_verified is true
    const result = await client.query(
      `
      UPDATE users 
      SET password_hash = $1,
          email_verified = true
      WHERE email = 'bradturnbough80@gmail.com'
      RETURNING email, substring(password_hash, 1, 30) as hash_preview, email_verified
    `,
      [hashedPassword],
    );

    if (result.rows.length > 0) {
      console.log('✅ Password updated for:', result.rows[0].email);
      console.log('Hash preview:', result.rows[0].hash_preview);
      console.log('Email verified:', result.rows[0].email_verified);
    } else {
      console.log('❌ No user found with that email');
    }

    await client.query('COMMIT');
    console.log('✅ Transaction committed - Password is now: June172018');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setCorrectPassword();
