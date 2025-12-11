const axios = require('axios');

const API_BASE_URL = 'https://api.cooksmartapp.com';
const ADMIN_EMAIL = 'bradturnbough80@gmail.com';
const ADMIN_PASSWORD = 'June172018!';

let authToken = '';

async function loginAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/admin/auth/login`,
      {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    );

    authToken = response.data.token;
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error(
      '❌ Admin login failed:',
      error.response?.data || error.message,
    );
    return false;
  }
}

async function testEndpoint(name, url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${url}`,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    console.log(`✅ ${name}: SUCCESS (${response.status})`);
    return {success: true, data: response.data};
  } catch (error) {
    console.log(
      `❌ ${name}: FAILED (${error.response?.status || 'Network Error'})`,
    );
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    return {success: false, error: error.response?.data || error.message};
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Admin Dashboard Test');
  console.log('='.repeat(50));

  // Login first
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without admin login');
    return;
  }

  console.log('\n📊 Testing Analytics Endpoints...');
  const analyticsTests = [
    ['Analytics Overview', '/api/v1/admin/analytics/overview'],
    ['User Growth', '/api/v1/admin/analytics/growth'],
    ['Feature Usage', '/api/v1/admin/analytics/features'],
    ['Revenue Trends', '/api/v1/admin/analytics/revenue-trends'],
  ];

  console.log('\n👥 Testing User Management...');
  const userTests = [['Users List', '/api/v1/admin/users']];

  console.log('\n💰 Testing Subscription Management...');
  const subscriptionTests = [
    ['Subscriptions List', '/api/v1/admin/subscriptions'],
    ['Subscription Overview', '/api/v1/admin/subscriptions/overview'],
  ];

  console.log('\n📝 Testing Feedback Management...');
  const feedbackTests = [['Feedback List', '/api/v1/admin/feedback']];

  console.log('\n🏥 Testing Health Monitoring...');
  const healthTests = [
    ['Health Overview', '/api/v1/admin/health/overview'],
    ['Server Metrics', '/api/v1/admin/health/server'],
    ['Database Metrics', '/api/v1/admin/health/database'],
  ];

  console.log('\n💾 Testing Cache Management...');
  const cacheTests = [['Cache Status', '/api/v1/admin/cache/status']];

  console.log('\n💸 Testing Cost Management...');
  const costTests = [['Cost Overview', '/api/v1/admin/costs/overview']];

  console.log('\n🔗 Testing Referral Management...');
  const referralTests = [
    ['Referrals Overview', '/api/v1/admin/referrals/overview'],
    ['Top Referrers', '/api/v1/admin/referrals/top-referrers'],
    ['Referral Codes', '/api/v1/admin/referrals/codes'],
  ];

  console.log('\n📈 Testing Dashboard Overview...');
  const dashboardTests = [
    ['Dashboard Overview', '/api/v1/admin/dashboard/overview'],
  ];

  // Run all tests
  const allTests = [
    ...analyticsTests,
    ...userTests,
    ...subscriptionTests,
    ...feedbackTests,
    ...healthTests,
    ...cacheTests,
    ...costTests,
    ...referralTests,
    ...dashboardTests,
  ];

  let successCount = 0;
  let totalTests = allTests.length;

  for (const [name, url] of allTests) {
    const result = await testEndpoint(name, url);
    if (result.success) {
      successCount++;
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(
    `📈 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`,
  );

  if (successCount === totalTests) {
    console.log('\n🎉 CONGRATULATIONS! 100% ADMIN FUNCTIONALITY ACHIEVED!');
    console.log('🏆 All admin dashboard endpoints are working perfectly!');
  } else if (successCount >= totalTests * 0.9) {
    console.log('\n🎯 EXCELLENT! Over 90% functionality achieved!');
    console.log('🔧 Just a few minor endpoints need attention.');
  } else {
    console.log('\n⚠️  Some endpoints need attention for full functionality.');
  }

  console.log('\n🌐 Admin Dashboard URL: https://cooksmartapp.com/admin/login');
  console.log(`👤 Username: ${ADMIN_EMAIL}`);
  console.log('🔑 Password: June172018!');
}

// Run the test
runComprehensiveTest().catch(console.error);
