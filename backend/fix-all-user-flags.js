const {Pool} = require('pg');

const pool = new Pool({
  host: 'cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
  ssl: {rejectUnauthorized: false},
});

async function fixAllFlags() {
  try {
    console.log('🔧 Fixing all user flags...\n');

    // Fix Brad - Developer (NO special flags, just lifetime)
    await pool.query(
      'UPDATE users SET is_co_founder = false, is_creator = false, is_special_user = false, has_lifetime_subscription = true WHERE email = $1',
      ['bradturnbough80@gmail.com'],
    );
    console.log('✅ Fixed Brad - Developer (no special flags)');

    // Fix Briana - Creator ONLY
    await pool.query(
      'UPDATE users SET is_co_founder = false, is_creator = true, is_special_user = false, has_lifetime_subscription = true WHERE email = $1',
      ['brianaolszewski1@gmail.com'],
    );
    console.log('✅ Fixed Briana - Creator (is_creator = true)');

    // Fix Donna - Special User ONLY
    await pool.query(
      'UPDATE users SET is_co_founder = false, is_creator = false, is_special_user = true, has_lifetime_subscription = true WHERE email = $1',
      ['dwoodswoods2@gmail.com'],
    );
    console.log('✅ Fixed Donna - Special User (is_special_user = true)');

    // Verify
    console.log('\n📊 Verifying changes...\n');
    const result = await pool.query(
      'SELECT email, is_co_founder, is_creator, is_special_user, has_lifetime_subscription FROM users WHERE email IN ($1, $2, $3) ORDER BY email',
      [
        'bradturnbough80@gmail.com',
        'brianaolszewski1@gmail.com',
        'dwoodswoods2@gmail.com',
      ],
    );

    result.rows.forEach(row => {
      console.log(`${row.email}:`);
      console.log(`  is_co_founder: ${row.is_co_founder}`);
      console.log(`  is_creator: ${row.is_creator}`);
      console.log(`  is_special_user: ${row.is_special_user}`);
      console.log(`  has_lifetime: ${row.has_lifetime_subscription}`);
      console.log('');
    });

    console.log('✅ All accounts fixed!');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

fixAllFlags();
