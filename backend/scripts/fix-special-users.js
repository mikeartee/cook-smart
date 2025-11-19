const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://cooksmartadmin:CookSmart2024!@cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com:5432/cooksmartdb'
});

const SPECIAL_USERS = [
  { email: 'brianaolszewski1@gmail.com', name: 'Briana', is_co_founder: true },
  { email: 'dwoodswoods2@gmail.com', name: 'Mom', is_special_user: true }
];

async function fixSpecialUsers() {
  try {
    console.log('🔧 Fixing special user flags...\n');
    
    for (const user of SPECIAL_USERS) {
      // Check if user exists
      const checkResult = await pool.query(
        'SELECT id, email, first_name, is_special_user, is_co_founder FROM users WHERE LOWER(email) = LOWER($1)',
        [user.email]
      );
      
      if (checkResult.rows.length === 0) {
        console.log(`❌ User not found: ${user.email}`);
        console.log(`   Please have them register first.\n`);
        continue;
      }
      
      // Update flags
      const updateResult = await pool.query(`
        UPDATE users 
        SET 
          is_special_user = $1,
          is_co_founder = $2,
          has_lifetime_subscription = true,
          subscription_status = 'lifetime',
          updated_at = NOW()
        WHERE LOWER(email) = LOWER($3)
        RETURNING id, email, first_name, is_special_user, is_co_founder, has_lifetime_subscription
      `, [
        user.is_special_user || false,
        user.is_co_founder || false,
        user.email
      ]);
      
      if (updateResult.rows.length > 0) {
        const updated = updateResult.rows[0];
        console.log(`✅ Updated: ${updated.email}`);
        console.log(`   Name: ${updated.first_name || 'N/A'}`);
        console.log(`   Is Co-Founder: ${updated.is_co_founder}`);
        console.log(`   Is Special User: ${updated.is_special_user}`);
        console.log(`   Has Lifetime: ${updated.has_lifetime_subscription}\n`);
      }
    }
    
    console.log('✅ Done! Special users have been updated.');
    console.log('\n📝 Note: Users need to log out and log back in to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSpecialUsers();
