require('dotenv').config();
const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  console.log('Running subscription reminders migration...');

  try {
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        'migrations',
        '013_create_subscription_reminders.sql',
      ),
      'utf8',
    );

    await pool.query(sql);

    console.log('✅ Migration complete!');
    console.log('Created:');
    console.log('  - subscription_reminders table');
    console.log('  - subscription_status column in users');
    console.log('  - grace_period_end column in subscriptions');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
