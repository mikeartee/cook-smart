const {Pool} = require('pg');

// Production database connection
const pool = new Pool({
  host: 'cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  ssl: {rejectUnauthorized: false},
});

async function fixBradAccount() {
  try {
    console.log("🔍 Checking Brad's current account flags...");

    // Check current state
    const checkResult = await pool.query(
      'SELECT email, is_creator, is_special_user, has_lifetime_subscription FROM users WHERE email = $1',
      ['bradturnbough80@gmail.com'],
    );

    if (checkResult.rows.length === 0) {
      console.log("❌ Brad's account not found!");
      await pool.end();
      return;
    }

    console.log('Current flags:', checkResult.rows[0]);

    // Fix Brad's account - set is_creator to false
    console.log("\n🔧 Fixing Brad's account flags...");
    await pool.query('UPDATE users SET is_creator = false WHERE email = $1', [
      'bradturnbough80@gmail.com',
    ]);

    // Verify the fix
    const verifyResult = await pool.query(
      'SELECT email, is_creator, is_special_user, has_lifetime_subscription FROM users WHERE email = $1',
      ['bradturnbough80@gmail.com'],
    );

    console.log('✅ Updated flags:', verifyResult.rows[0]);
    console.log(
      "\n✅ Brad's account fixed! He will no longer see the welcome screen.",
    );

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixBradAccount();
