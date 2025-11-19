require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function addMissingColumns() {
  console.log('🔧 Adding missing columns to users table...\n');
  
  try {
    // Add last_login_at column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
    `);
    console.log('✅ Added last_login_at column');
    
    // Add email_verified column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
    `);
    console.log('✅ Added email_verified column');
    
    // Add dietary_restrictions column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}';
    `);
    console.log('✅ Added dietary_restrictions column');
    
    // Add allergies column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}';
    `);
    console.log('✅ Added allergies column');
    
    // Add show_nutrition column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS show_nutrition BOOLEAN DEFAULT true;
    `);
    console.log('✅ Added show_nutrition column');
    
    // Add preferred_units column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS preferred_units VARCHAR(20) DEFAULT 'imperial';
    `);
    console.log('✅ Added preferred_units column');
    
    // Add subscription_expires_at column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
    `);
    console.log('✅ Added subscription_expires_at column');
    
    console.log('\n✅ All missing columns added successfully!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
