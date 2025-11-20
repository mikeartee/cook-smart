const bcrypt = require('bcrypt');
const {Pool} = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  port: 5432,
});

async function createAccount() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash('CookSmart2024!', 10);
    const userId = `user_creator_${Date.now()}`;

    const userResult = await client.query(
      `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        is_creator, has_lifetime_subscription, age_verified, email_verified,
        subscription_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) DO UPDATE SET
        is_creator = true,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      RETURNING id, email, first_name, is_creator
    `,
      [
        userId,
        'bradturnbough80@gmail.com',
        hashedPassword,
        'Brad',
        'Turnbough',
        true,
        true,
        true,
        true,
        'lifetime',
      ],
    );

    const user = userResult.rows[0];
    console.log('✅ User created:', user);

    // Add points
    await client.query(
      `
      INSERT INTO user_points (user_id, total_points, level, last_updated)
      VALUES ($1, 1000, 2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        total_points = 1000,
        level = 2
    `,
      [user.id],
    );

    await client.query(
      `
      INSERT INTO points_transactions (user_id, points, action, description, date_created)
      VALUES ($1, 1000, 'creator_bonus', 'Creator Welcome Bonus', NOW())
    `,
      [user.id],
    );

    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

createAccount();
