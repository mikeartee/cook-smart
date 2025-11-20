const bcrypt = require('bcrypt');
const {Pool} = require('pg');

// Database connection
const pool = new Pool({
  host: '100.30.52.52',
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  port: 5432,
});

async function createMomAccount() {
  try {
    // Hash the password
    const password = 'MidgettRoad';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert mom's account
    const query = `
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, 
        is_special_user, age_verified, email_verified
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      ON CONFLICT (email) DO UPDATE SET
        is_special_user = true,
        password_hash = $3
      RETURNING id, email, first_name, is_special_user;
    `;

    const values = [
      userId,
      'dwoodswoods2@gmail.com',
      hashedPassword,
      'Mom',
      'Woods',
      true, // is_special_user
      true, // age_verified
      true, // email_verified
    ];

    const result = await pool.query(query, values);

    console.log("✅ Mom's account created/updated:");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("❌ Error creating mom's account:", error);
  } finally {
    await pool.end();
  }
}

createMomAccount();
