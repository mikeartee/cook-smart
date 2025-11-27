const {Pool} = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {rejectUnauthorized: false} : false,
});

async function testSubscriptionFix() {
  const client = await pool.connect();
  
  try {
    console.log('Testing subscription user_id type fix...\n');
    
    // Test 1: Check column types
    console.log('1. Checking column types...');
    const columnCheck = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name IN ('subscriptions', 'subscription_transactions')
        AND column_name = 'user_id'
      ORDER BY table_name
    `);
    
    console.log('Column types:');
    columnCheck.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''}`);
    });
    
    const allVarchar = columnCheck.rows.every(row => row.data_type === 'character varying');
    if (allVarchar) {
      console.log('✅ All user_id columns are VARCHAR\n');
    } else {
      console.log('❌ Some user_id columns are not VARCHAR\n');
      return;
    }
    
    // Test 2: Check foreign key constraints
    console.log('2. Checking foreign key constraints...');
    const fkCheck = await client.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('subscriptions', 'subscription_transactions')
        AND kcu.column_name = 'user_id'
    `);
    
    if (fkCheck.rows.length > 0) {
      console.log('Foreign key constraints:');
      fkCheck.rows.forEach(row => {
        console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      });
      console.log('✅ Foreign key constraints exist\n');
    } else {
      console.log('⚠️  No foreign key constraints found (optional)\n');
    }
    
    // Test 3: Try inserting a test subscription with string user_id
    console.log('3. Testing string user_id insertion...');
    const testUserId = `user_${Date.now()}_test123`;
    const testSubId = `sub_test_${Date.now()}`;
    
    try {
      // First create a test user
      await client.query(`
        INSERT INTO users (id, email, password_hash, age_verified)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (id) DO NOTHING
      `, [testUserId, `test_${Date.now()}@example.com`, 'test_hash']);
      
      // Try inserting a subscription
      await client.query(`
        INSERT INTO subscriptions (
          id, user_id, plan_id, status,
          current_period_start, current_period_end,
          cancel_at_period_end, promotional_price_used,
          initial_price, renewal_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        testSubId,
        testUserId,
        'yearly',
        'active',
        new Date(),
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        false,
        true,
        24.99,
        34.99
      ]);
      
      console.log('✅ Successfully inserted subscription with string user_id');
      
      // Clean up test data
      await client.query('DELETE FROM subscriptions WHERE id = $1', [testSubId]);
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]);
      console.log('✅ Test data cleaned up\n');
      
    } catch (error) {
      console.log('❌ Failed to insert subscription:', error.message);
      // Try to clean up
      await client.query('DELETE FROM subscriptions WHERE id = $1', [testSubId]).catch(() => {});
      await client.query('DELETE FROM users WHERE id = $1', [testUserId]).catch(() => {});
      return;
    }
    
    console.log('='.repeat(50));
    console.log('✅ ALL TESTS PASSED!');
    console.log('The subscription payment error should now be fixed.');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testSubscriptionFix().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

