const pool = require('../dist/config/database').default;

async function checkSpecialUsers() {
  try {
    console.log('Checking special users...\n');
    
    const result = await pool.query(`
      SELECT id, email, first_name, last_name, is_special_user, is_co_founder, has_lifetime_subscription
      FROM users 
      WHERE is_special_user = true OR is_co_founder = true
      ORDER BY email
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No special users found in database!');
    } else {
      console.log(`✅ Found ${result.rows.length} special user(s):\n`);
      result.rows.forEach(user => {
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.first_name || ''} ${user.last_name || ''}`);
        console.log(`Is Special User: ${user.is_special_user}`);
        console.log(`Is Co-Founder: ${user.is_co_founder}`);
        console.log(`Has Lifetime: ${user.has_lifetime_subscription}`);
        console.log('---');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecialUsers();
