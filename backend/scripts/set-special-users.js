const pool = require('../dist/config/database').default;

const SPECIAL_EMAILS = [
  'briana@example.com', // Briana
  'mom@example.com',    // Mom
  // Add actual emails here
];

async function setSpecialUsers() {
  try {
    console.log('Setting special user flags...\n');
    
    for (const email of SPECIAL_EMAILS) {
      const result = await pool.query(`
        UPDATE users 
        SET is_special_user = true, 
            has_lifetime_subscription = true,
            subscription_status = 'lifetime'
        WHERE LOWER(email) = LOWER($1)
        RETURNING id, email, first_name, is_special_user
      `, [email]);
      
      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${result.rows[0].email}`);
      } else {
        console.log(`❌ Not found: ${email}`);
      }
    }
    
    console.log('\nDone!');
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setSpecialUsers();
