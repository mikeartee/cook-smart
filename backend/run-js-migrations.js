const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigrations() {
  try {
    console.log('🚀 Running JavaScript migrations...\n');
    
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();
    
    for (const file of files) {
      console.log(`📝 Running: ${file}`);
      try {
        const migration = require(path.join(migrationsDir, file));
        if (migration.up) {
          await migration.up(pool);
          console.log(`✅ ${file} completed\n`);
        }
      } catch (error) {
        console.log(`⚠️  ${file} failed: ${error.message}\n`);
      }
    }
    
    console.log('✅ All migrations processed');
    pool.end();
  } catch (error) {
    console.error('❌ Migration error:', error);
    pool.end();
    process.exit(1);
  }
}

runMigrations();
