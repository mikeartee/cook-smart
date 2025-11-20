const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixDonnaAccount() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Donna\'s account - removing admin access...\n');
    
    // Donna should be special user ONLY, not co-founder or admin
    const result = await client.query(`
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
      RETURNING id, email, first_name, last_name, is_co_founder, is_special_user, is_creator
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ Donna Woods updated:');
      console.log(`   Email: ${user.email}`);
      console.log(`   Co-founder: ${user.is_co_founder} (should be false)`);
      console.log(`   Special User: ${user.is_special_user} (should be true)`);
      console.log(`   Creator: ${user.is_creator} (should be false)`);
      console.log('\n✅ Donna has lifetime access but NO admin privileges');
    } else {
      console.log('❌ Account not found: dwoodswoods2@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixDonnaAccount();
