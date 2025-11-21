/**
 * Production Database Migration Runner
 * Run this on EC2 server to add Privacy & Security fields
 */

const {Pool} = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from EC2
require('dotenv').config({path: path.join(__dirname, '.env')});

console.log('🚀 PRODUCTION MIGRATION - Privacy & Security Features');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('⚠️  WARNING: This will modify the production database!');
console.log('');
console.log('Database:', process.env.DB_NAME);
console.log('Host:', process.env.DB_HOST);
console.log('');

// Confirm before proceeding
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question(
  'Type "YES" to proceed with production migration: ',
  async answer => {
    readline.close();

    if (answer !== 'YES') {
      console.log('❌ Migration cancelled');
      process.exit(0);
    }

    // Create database pool
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl:
        process.env.NODE_ENV === 'production'
          ? {rejectUnauthorized: false}
          : false,
    });

    try {
      console.log('');
      console.log('🔄 Running migration...');

      // Read migration SQL
      const migrationPath = path.join(
        __dirname,
        'migrations',
        'add_privacy_settings_to_users.sql',
      );
      const sql = fs.readFileSync(migrationPath, 'utf8');

      // Execute migration
      await pool.query(sql);

      console.log('✅ Migration completed successfully!');
      console.log('');

      // Verify columns were added
      const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN (
        'data_sharing',
        'analytics_enabled',
        'push_notifications',
        'location_services',
        'two_factor_enabled',
        'two_factor_secret'
      )
      ORDER BY column_name
    `);

      console.log('✅ Verified new columns:');
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });

      console.log('');
      console.log('🎉 Production database updated successfully!');
      console.log('');
      console.log('📋 Next steps:');
      console.log(
        '1. Restart the backend server: pm2 restart cook-smart-backend',
      );
      console.log(
        '2. Test the endpoints: curl http://localhost:3000/api/v1/settings/privacy',
      );
      console.log('3. Deploy new APK to testers');
      console.log('');

      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('');
      console.error('❌ Migration failed:', error.message);
      console.error('');
      console.error('Error details:', error);
      console.error('');
      console.error('🔄 Rollback instructions:');
      console.error('Run this SQL to revert:');
      console.error(`
ALTER TABLE users
DROP COLUMN IF EXISTS data_sharing,
DROP COLUMN IF EXISTS analytics_enabled,
DROP COLUMN IF EXISTS push_notifications,
DROP COLUMN IF EXISTS location_services,
DROP COLUMN IF EXISTS two_factor_enabled,
DROP COLUMN IF EXISTS two_factor_secret;
    `);

      await pool.end();
      process.exit(1);
    }
  },
);
