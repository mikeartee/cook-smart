const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixAdminAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current admin accounts...\n');
    
    // Check current state
    const currentResult = await client.query(`
      SELECT id, email, first_name, last_name, is_co_founder, is_special_user, is_creator, has_lifetime_subscription
      FROM users 
      WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
      ORDER BY email
    `);
    
    console.log('Current accounts:');
    currentResult.rows.forEach(row => {
      console.log(`  ${row.email}: ${row.first_name} ${row.last_name}`);
      console.log(`    Co-founder: ${row.is_co_founder}, Special: ${row.is_special_user}, Creator: ${row.is_creator}, Lifetime: ${row.has_lifetime_subscription}`);
    });
    
    console.log('\n🔧 Fixing accounts...\n');
    
    // Fix Brad - Creator & Co-founder
    await client.query(`
      UPDATE users 
      SET 
        first_name = 'Brad',
        last_name = 'Turnbough',
        is_co_founder = true,
        is_special_user = true,
        is_creator = true,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      WHERE email = 'bradturnbough80@gmail.com'
    `);
    console.log('✅ Brad Turnbough - Creator & Co-founder');
    
    // Fix Briana Olszewski - Co-founder
    await client.query(`
      UPDATE users 
      SET 
        first_name = 'Briana',
        last_name = 'Olszewski',
        is_co_founder = true,
        is_special_user = true,
        is_creator = false,
        has_lifetime_subscription = true,
        subscription_status = 'lifetime'
      WHERE email = 'brianaolszewski1@gmail.com'
    `);
    console.log('✅ Briana Olszewski - Co-founder');
    
    // Fix Donna Woods - Special user (Briana's mom)
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
    console.log('✅ Donna Woods - Special user');
    
    // Verify changes
    console.log('\n✅ Verification:\n');
    const verifyResult = await client.query(`
      SELECT id, email, first_name, last_name, is_co_founder, is_special_user, is_creator, has_lifetime_subscription
      FROM users 
      WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
      ORDER BY email
    `);
    
    verifyResult.rows.forEach(row => {
      console.log(`${row.first_name} ${row.last_name} (${row.email})`);
      console.log(`  Co-founder: ${row.is_co_founder}, Special: ${row.is_special_user}, Creator: ${row.is_creator}, Lifetime: ${row.has_lifetime_subscription}`);
      console.log('');
    });
    
    console.log('✅ All accounts fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixAdminAccounts();
