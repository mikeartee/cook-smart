const { Pool } = require('pg');

const pool = new Pool({
  host: 'cook-smart-db.c3ql4eqjunits.us-east-1.rds.amazonaws.com',
  port: 5432,
  database: 'cook_smart_db',
  user: 'postgres',
  password: 'CookSmart2024!',
  ssl: { rejectUnauthorized: false }
});

async function fixFlags() {
  try {
    console.log('🔧 Fixing user flags in production database...\n');
    
    // Fix Brad - NO special flags
    await pool.query(`
      UPDATE users 
      SET is_creator = false,
          is_co_founder = false,
          is_special_user = false,
          has_lifetime_subscription = true
      WHERE email = 'bradturnbough80@gmail.com'
    `);
    console.log('✅ Brad fixed - NO special screens');
    
    // Fix Briana - is_creator = true
    await pool.query(`
      UPDATE users 
      SET is_creator = true,
          is_co_founder = false,
          is_special_user = false,
          has_lifetime_subscription = true
      WHERE email = 'brianaolszewski1@gmail.com'
    `);
    console.log('✅ Briana fixed - is_creator = true (sees love note + song)');
    
    // Fix Donna - is_special_user = true
    await pool.query(`
      UPDATE users 
      SET is_creator = false,
          is_co_founder = false,
          is_special_user = true,
          has_lifetime_subscription = true
      WHERE email = 'dwoodswoods2@gmail.com'
    `);
    console.log('✅ Donna fixed - is_special_user = true (sees mom note + song)');
    
    // Verify
    console.log('\n📊 Current flags:');
    const result = await pool.query(`
      SELECT email, is_creator, is_co_founder, is_special_user, has_lifetime_subscription 
      FROM users 
      WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
      ORDER BY email
    `);
    
    console.table(result.rows);
    
    await pool.end();
    console.log('\n✅ DONE! Log out and log back in to see changes.');
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

fixFlags();