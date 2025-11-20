const bcrypt = require('bcrypt');
const {Pool} = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  port: 5432,
});

async function createBradAccount() {
  try {
    // Hash the password
    const password = 'CookSmart2024!'; // Temporary password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = `user_creator_${Date.now()}`;

    // Insert Brad's account
    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        is_creator, has_lifetime_subscription, age_verified, email_verified,
        subscription_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      ON CONFLICT (email) DO UPDATE SET
        is_creator = true,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime',
        password_hash = $3
      RETURNING id, email, first_name, is_creator, has_lifetime_subscription;
    `;

    const values = [
      userId,
      'bradturnbough80@gmail.com',
      hashedPassword,
      'Brad',
      'Turnbough',
      true, // is_creator
      true, // has_lifetime_subscription
      true, // age_verified
      true, // email_verified
      'lifetime', // subscription_status
    ];

    const result = await pool.query(query, values);

    console.log("✅ Brad's creator account created/updated:");
    console.log(result.rows[0]);

    // Add creator bonus points (1000 points for creator)
    const pointsQuery = `
      INSERT INTO points_transactions (user_id, points, action, description, date_created)
      VALUES ($1, 1000, 'creator_bonus', 'Creator Welcome Bonus', NOW())
      ON CONFLICT DO NOTHING
    `;
    await pool.query(pointsQuery, [result.rows[0].id]);

    // Update user points
    const updatePointsQuery = `
      INSERT INTO user_points (user_id, total_points, level, last_updated)
      VALUES ($1, 1000, 2, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET 
        total_points = user_points.total_points + 1000,
        level = CASE 
          WHEN (user_points.total_points + 1000) >= 10000 THEN 5
          WHEN (user_points.total_points + 1000) >= 5000 THEN 4
          WHEN (user_points.total_points + 1000) >= 2000 THEN 3
          WHEN (user_points.total_points + 1000) >= 500 THEN 2
          WHEN (user_points.total_points + 1000) >= 100 THEN 1
          ELSE 0
        END,
        last_updated = NOW()
    `;
    await pool.query(updatePointsQuery, [result.rows[0].id]);

    console.log('✅ Creator bonus points awarded: 1000 points');
  } catch (error) {
    console.error("❌ Error creating Brad's account:", error);
  } finally {
    await pool.end();
  }
}

createBradAccount();
