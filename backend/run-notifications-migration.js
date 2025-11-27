const pool = require('./src/config/database').default;
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('Running notifications and achievements migration...');

  try {
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        'migrations',
        '014_create_achievements_notifications.sql',
      ),
      'utf8',
    );

    await pool.query(sql);
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
