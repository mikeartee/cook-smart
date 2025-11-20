const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixRoles() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting correct roles...\n');
    
    // Brad - Developer with admin access (NOT creator, NOT co-founder)
    await client.query(`
      UPDATE users 
      SET 
        first_name = 'Brad',
        last_name = 'Turnbough',
        is_co_founder = false,
        is_special_user = false,
        is_creator = false,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      WHERE email = 'bradturnbough80@gmail.com'
    `);
    console.log('✅ Brad - Developer (admin access, no special flags)');
    
    // Briana - Creator & Co-founder
    await client.query(`
      UPDATE users 
      SET 
        first_name = 'Briana',
        last_name = 'Olszewski',
        is_co_founder = true,
        is_special_user = true,
        is_creator = true,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      WHERE email = 'brianaolszewski1@gmail.com'
    `);
    console.log('✅ Briana - Creator & Co-founder');
    
    // Donna - Special user only
    await client.query(`
      UPDATE users 
      SET 
        first_name = 'Donna',
        last_name = 'Woods',
        is_co_founder = false,
        is_special_user = true,
        is_creator = false,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      WHERE email = 'dwoodswoods2@gmail.com'
    `);
    console.log('✅ Donna - Special user only');
    
    // Verify
    console.log('\n✅ Verification:\n');
    const result = await client.query(`
      SELECT email, first_name, last_name, is_co_founder, is_special_user, is_creator
      FROM users 
      WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
      ORDER BY email
    `);
    
    result.rows.forEach(row => {
      console.log(`${row.first_name} ${row.last_name} (${row.email})`);
      console.log(`  Co-founder: ${row.is_co_founder}, Special: ${row.is_special_user}, Creator: ${row.is_creator}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRoles();
