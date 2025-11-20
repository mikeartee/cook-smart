const { Pool } = require('pg');

const pool = new Pool({
  host: '100.30.52.52',
  port: 5432,
  database: 'cooksmartdb',
  user: 'cooksmartadmin',
  password: 'CookSmart2024!',
});

async function runTests() {
  console.log('🔍 COMPREHENSIVE PRODUCTION HEALTH CHECK\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Points System
    console.log('\n📊 TEST 1: Points System');
    console.log('-'.repeat(60));
    
    const pointsCount = await pool.query('SELECT COUNT(*) FROM user_points');
    const transCount = await pool.query('SELECT COUNT(*) FROM points_transactions');
    
    console.log(`✓ user_points table exists: ${pointsCount.rows[0].count} records`);
    console.log(`✓ points_transactions table exists: ${transCount.rows[0].count} records`);
    
    const samplePoints = await pool.query('SELECT user_id, total_points, level FROM user_points LIMIT 3');
    console.log(`✓ Sample points data:`, samplePoints.rows);
    
    // Test 2: API Usage Logs
    console.log('\n📈 TEST 2: API Usage Tracking');
    console.log('-'.repeat(60));
    
    const apiLogsCount = await pool.query('SELECT COUNT(*) FROM api_usage_logs');
    console.log(`✓ api_usage_logs table exists: ${apiLogsCount.rows[0].count} records`);
    
    // Test 3: Referrals System
    console.log('\n🎁 TEST 3: Referrals System');
    console.log('-'.repeat(60));
    
    const referralsCount = await pool.query('SELECT COUNT(*) FROM referrals');
    console.log(`✓ referrals table exists: ${referralsCount.rows[0].count} records`);
    
    // Test 4: User Recipes
    console.log('\n📝 TEST 4: User Recipes');
    console.log('-'.repeat(60));
    
    const userRecipesCount = await pool.query('SELECT COUNT(*) FROM user_recipes');
    console.log(`✓ user_recipes table exists: ${userRecipesCount.rows[0].count} records`);
    
    // Test 5: Subscriptions
    console.log('\n💳 TEST 5: Subscriptions');
    console.log('-'.repeat(60));
    
    const subsCount = await pool.query('SELECT COUNT(*) FROM subscriptions');
    const activeSubs = await pool.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'");
    console.log(`✓ subscriptions table exists: ${subsCount.rows[0].count} total`);
    console.log(`✓ Active subscriptions: ${activeSubs.rows[0].count}`);
    
    // Test 6: Users with Special Status
    console.log('\n👥 TEST 6: Special Users');
    console.log('-'.repeat(60));
    
    const specialUsers = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_co_founder = true) as co_founders,
        COUNT(*) FILTER (WHERE is_special_user = true) as special_users,
        COUNT(*) FILTER (WHERE is_creator = true) as creators,
        COUNT(*) FILTER (WHERE has_lifetime_subscription = true) as lifetime
      FROM users
    `);
    console.log(`✓ Co-founders: ${specialUsers.rows[0].co_founders}`);
    console.log(`✓ Special users: ${specialUsers.rows[0].special_users}`);
    console.log(`✓ Creators: ${specialUsers.rows[0].creators}`);
    console.log(`✓ Lifetime subscriptions: ${specialUsers.rows[0].lifetime}`);
    
    // Test 7: Recent Errors
    console.log('\n🐛 TEST 7: System Health');
    console.log('-'.repeat(60));
    
    try {
      const recentErrors = await pool.query(`
        SELECT COUNT(*) 
        FROM error_logs 
        WHERE created_at > NOW() - INTERVAL '1 hour'
      `);
      console.log(`✓ Errors in last hour: ${recentErrors.rows[0].count}`);
    } catch (_e) {
      console.log(`⚠ error_logs table doesn't exist (optional)`);
    }
    
    // Test 8: Feedback
    console.log('\n💬 TEST 8: User Feedback');
    console.log('-'.repeat(60));
    
    try {
      const feedbackCount = await pool.query('SELECT COUNT(*) FROM feedback');
      const newFeedback = await pool.query("SELECT COUNT(*) FROM feedback WHERE status = 'new'");
      console.log(`✓ Total feedback: ${feedbackCount.rows[0].count}`);
      console.log(`✓ New feedback: ${newFeedback.rows[0].count}`);
    } catch (_e) {
      console.log(`⚠ feedback table doesn't exist (optional)`);
    }
    
    // Test 9: Shopping Lists
    console.log('\n🛒 TEST 9: Shopping Lists');
    console.log('-'.repeat(60));
    
    try {
      const shoppingCount = await pool.query('SELECT COUNT(*) FROM shopping_list_items');
      console.log(`✓ shopping_list_items table exists: ${shoppingCount.rows[0].count} items`);
    } catch (_e) {
      console.log(`⚠ shopping_list_items table doesn't exist (optional)`);
    }
    
    // Test 10: Database Indexes
    console.log('\n⚡ TEST 10: Performance Indexes');
    console.log('-'.repeat(60));
    
    const indexes = await pool.query(`
      SELECT 
        tablename, 
        indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('user_points', 'points_transactions', 'api_usage_logs', 'referrals')
      ORDER BY tablename, indexname
    `);
    console.log(`✓ Found ${indexes.rows.length} indexes on key tables`);
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.tablename}.${idx.indexname}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

runTests();
