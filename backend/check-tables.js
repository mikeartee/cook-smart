const pool = require('./src/config/database');

async function checkTables() {
  try {
    console.log('🔍 Checking existing database tables...');

    const query = `
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    const result = await pool.query(query);

    console.log('\n📊 Current Database Tables:');
    console.log('='.repeat(40));

    const existingTables = result.rows.map(row => row.table_name);
    existingTables.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });

    console.log(`\nTotal tables: ${existingTables.length}`);

    // Check for missing tables that admin dashboard needs
    const requiredTables = [
      'users',
      'subscriptions',
      'user_referrals',
      'feedback',
      'error_logs',
      'feature_usage',
      'system_health',
      'cache_metrics',
    ];

    console.log('\n🔍 Checking Required Tables for Admin Dashboard:');
    console.log('='.repeat(50));

    const missingTables = [];

    for (const table of requiredTables) {
      const exists = existingTables.includes(table);
      console.log(
        `${exists ? '✅' : '❌'} ${table} ${exists ? '(exists)' : '(MISSING)'}`,
      );
      if (!exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing Tables Found:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log(
        '\n💡 These tables need to be created for full admin functionality.',
      );
    } else {
      console.log('\n🎉 All required tables exist!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    process.exit(1);
  }
}

checkTables();
