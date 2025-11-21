const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {rejectUnauthorized: false},
});

async function addAdminFlags() {
  try {
    console.log('🔧 Adding admin flags to existing user accounts...\n');

    // Add is_admin column if it doesn't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);
    console.log('✅ Added is_admin column to users table');

    // Set Brad as admin
    await pool.query(`
      UPDATE users 
      SET is_admin = true 
      WHERE email = 'bradturnbough80@gmail.com'
    `);
    console.log('✅ Brad marked as admin');

    // Set Briana as admin
    await pool.query(`
      UPDATE users 
      SET is_admin = true 
      WHERE email = 'brianaolszewski1@gmail.com'
    `);
    console.log('✅ Briana marked as admin');

    // Verify
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, is_admin, is_co_founder, is_creator
      FROM users 
      WHERE is_admin = true
    `);

    console.log('\n📋 Admin users:');
    result.rows.forEach(user => {
      console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(
        `    Admin: ${user.is_admin}, Co-Founder: ${user.is_co_founder}, Creator: ${user.is_creator}`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addAdminFlags();
