const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const accounts = [
  {
    email: 'bradturnbough80@gmail.com',
    password: 'Brad2024!',
    firstName: 'Brad',
    lastName: 'Turnbough',
    isCoFounder: true,
    isSpecialUser: true,
    isCreator: true
  },
  {
    email: 'brianaolszewski1@gmail.com',
    password: 'June172018',
    firstName: 'Briana',
    lastName: 'Olszewski',
    isCoFounder: true,
    isSpecialUser: true,
    isCreator: false
  },
  {
    email: 'dwoodswoods2@gmail.com',
    password: 'MidgettRoad',
    firstName: 'Donna',
    lastName: 'Woods',
    isCoFounder: false,
    isSpecialUser: true,
    isCreator: false
  }
];

async function resetPasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Resetting passwords and updating admin flags...\n');
    
    for (const account of accounts) {
      const passwordHash = await bcrypt.hash(account.password, 10);
      
      const result = await client.query(`
        UPDATE users 
        SET 
          password_hash = $1,
          first_name = $2,
          last_name = $3,
          is_co_founder = $4,
          is_special_user = $5,
          is_creator = $6,
          has_lifetime_subscription = true,
          subscription_status = 'lifetime'
        WHERE email = $7
        RETURNING id, email, first_name, last_name
      `, [
        passwordHash,
        account.firstName,
        account.lastName,
        account.isCoFounder,
        account.isSpecialUser,
        account.isCreator,
        account.email
      ]);
      
      if (result.rows.length > 0) {
        console.log(`✅ ${account.firstName} ${account.lastName} (${account.email})`);
        console.log(`   Co-founder: ${account.isCoFounder}, Special: ${account.isSpecialUser}, Creator: ${account.isCreator}`);
      } else {
        console.log(`❌ Account not found: ${account.email}`);
      }
    }
    
    console.log('\n✅ All passwords reset and admin flags updated!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetPasswords();
