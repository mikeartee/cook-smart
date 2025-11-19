require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateUsers() {
  console.log('🔄 Starting user migration from JSON to PostgreSQL...\n');
  
  try {
    // Read users from JSON file
    const usersFile = path.join(__dirname, '../data/users.json');
    const data = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    const users = data.users;
    
    console.log(`📊 Found ${users.length} users in JSON file\n`);
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Users table does not exist. Run migrations first!');
      process.exit(1);
    }
    
    let migrated = 0;
    let skipped = 0;
    
    for (const user of users) {
      try {
        // Check if user already exists
        const existing = await pool.query(
          'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
          [user.email]
        );
        
        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping ${user.email} (already exists)`);
          skipped++;
          continue;
        }
        
        // Generate a unique ID (similar to the JSON format)
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Insert user into PostgreSQL
        await pool.query(`
          INSERT INTO users (
            id, email, password_hash, first_name, last_name,
            is_co_founder, is_special_user, has_lifetime_subscription,
            subscription_status, points, age_verified, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        `, [
          userId,
          user.email,
          user.password_hash,
          user.first_name || null,
          user.last_name || null,
          user.is_co_founder || false,
          user.is_special_user || false,
          user.has_lifetime_subscription || false,
          user.subscription_status || 'free',
          user.points || 0,
          true // age_verified
        ]);
        
        console.log(`✅ Migrated: ${user.email}`);
        migrated++;
        
      } catch (err) {
        console.error(`❌ Error migrating ${user.email}:`, err.message);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${users.length}\n`);
    
    // Create backup of JSON file
    const backupFile = path.join(__dirname, '../data/users.json.backup');
    fs.copyFileSync(usersFile, backupFile);
    console.log(`💾 Backup created: ${backupFile}\n`);
    
    console.log('✅ Migration complete!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateUsers();
