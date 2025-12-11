const pool = require('./dist/config/database').default;

async function checkReferralsTable() {
  try {
    console.log('🔍 Checking user_referrals table structure...');

    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_referrals'
      ORDER BY ordinal_position
    `;

    const result = await pool.query(query);

    console.log('\n📊 User_Referrals Table Structure:');
    console.log('='.repeat(60));

    result.rows.forEach(row => {
      console.log(
        `${row.column_name.padEnd(20)} | ${row.data_type.padEnd(20)} | ${row.is_nullable}`,
      );
    });

    // Check sample data
    const sampleQuery = 'SELECT * FROM user_referrals LIMIT 5';
    const sampleResult = await pool.query(sampleQuery);

    console.log('\n📋 Sample Referral Data:');
    console.log('='.repeat(40));
    console.log(`Total rows: ${sampleResult.rows.length}`);

    if (sampleResult.rows.length > 0) {
      sampleResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${JSON.stringify(row, null, 2)}`);
      });
    } else {
      console.log('No referral data found.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkReferralsTable();
