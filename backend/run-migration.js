const pool = require('./dist/config/database').default;
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');

    const migrationPath = path.join(
      __dirname,
      'migrations',
      'create_missing_admin_tables.sql',
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing migration SQL...');
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const checkQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('feature_usage', 'system_health', 'cache_metrics')
      ORDER BY table_name
    `;

    const result = await pool.query(checkQuery);

    console.log('\n📊 Verified Tables Created:');
    result.rows.forEach(row => {
      console.log(`✅ ${row.table_name}`);
    });

    console.log('\n🎉 All admin dashboard tables are now ready!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
