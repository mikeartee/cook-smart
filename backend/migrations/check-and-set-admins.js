const { Pool } = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  port: 5432,
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
});

async function setAdmins() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking admin status...\n');
    
    // Check current status
    const checkQuery = `
      SELECT id, email, is_co_founder, is_special_user, is_creator, has_lifetime_subscription
      FROM users 
      WHERE email IN ('bradturnbough80@gmail.com', 'dwoodswoods2@gmail.com')
    `;
    
    const current = await client.query(checkQuery);
    
    console.log('📊 Current Status:');
    current.rows.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`  Co-founder: ${user.is_co_founder}`);
      console.log(`  Special User: ${user.is_special_user}`);
      console.log(`  Creator: ${user.is_creator}`);
      console.log(`  Lifetime: ${user.has_lifetime_subscription}`);
    });
    
    console.log('\n🔧 Setting admin access...\n');
    
    // Set Brad as co-founder and admin
    await client.query(`
      UPDATE users 
      SET 
        is_co_founder = true,
        is_special_user = true,
        is_creator = true,
        has_lifetime_subscription = true
      WHERE email = 'bradturnbough80@gmail.com'
    `);
    console.log('✅ Brad set as co-founder with full admin access');
    
    // Set Briana as co-founder and admin
    await client.query(`
      UPDATE users 
      SET 
        is_co_founder = true,
        is_special_user = true,
        has_lifetime_subscription = true
      WHERE email = 'dwoodswoods2@gmail.com'
    `);
    console.log('✅ Briana set as co-founder with admin access');
    
    // Verify changes
    const verify = await client.query(checkQuery);
    
    console.log('\n✅ Updated Status:');
    verify.rows.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`  Co-founder: ${user.is_co_founder}`);
      console.log(`  Special User: ${user.is_special_user}`);
      console.log(`  Creator: ${user.is_creator}`);
      console.log(`  Lifetime: ${user.has_lifetime_subscription}`);
    });
    
    console.log('\n🎉 Admin access granted successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setAdmins();
