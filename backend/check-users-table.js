const pool = require('./dist/config/database').default;

async function checkUsersTable() {
  try {
    console.log('🔍 Checking users table structure...');

    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
      ORDER BY ordinal_position
    `;

    const result = await pool.query(query);

    console.log('\n📊 Users Table Structure:');
    console.log('='.repeat(60));

    result.rows.forEach(row => {
      console.log(
        `${row.column_name.padEnd(20)} | ${row.data_type.padEnd(20)} | ${row.is_nullable}`,
      );
    });

    // Check a sample user ID
    const sampleQuery = 'SELECT id, email FROM users LIMIT 3';
    const sampleResult = await pool.query(sampleQuery);

    console.log('\n📋 Sample User IDs:');
    console.log('='.repeat(40));
    sampleResult.rows.forEach(row => {
      console.log(
        `ID: ${row.id} (type: ${typeof row.id}) | Email: ${row.email}`,
      );
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsersTable();
