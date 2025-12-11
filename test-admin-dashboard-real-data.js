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

async function testRealData() {
  console.log('🔍 Testing Real Data in Admin Dashboard');
  console.log('='.repeat(50));

  const loginSuccess = await loginAdmin();
  if (!loginSuccess) return;

  const config = {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    // Test Users Data
    console.log('\n👥 USERS DATA:');
    const usersResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/users`,
      config,
    );
    console.log(`Total users found: ${usersResponse.data.users?.length || 0}`);
    if (usersResponse.data.users?.length > 0) {
      console.log('Sample user:', {
        id: usersResponse.data.users[0].id,
        email: usersResponse.data.users[0].email,
        created_at: usersResponse.data.users[0].created_at,
      });
    } else {
      console.log('❌ No users found in response');
      console.log('Response structure:', Object.keys(usersResponse.data));
    }

    // Test Analytics Data
    console.log('\n📊 ANALYTICS DATA:');
    const analyticsResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/analytics/overview`,
      config,
    );
    console.log('Analytics overview:', {
      totalUsers: analyticsResponse.data.totalUsers,
      activeUsers: analyticsResponse.data.activeUsers,
      totalRecipes: analyticsResponse.data.totalRecipes,
    });

    // Test Recipe Cache Data
    console.log('\n🍳 RECIPE CACHE DATA:');
    try {
      const recipesResponse = await axios.get(
        `${API_BASE_URL}/api/v1/admin/cache/status`,
        config,
      );
      console.log('Recipe cache info:', recipesResponse.data);
    } catch (error) {
      console.log(
        '❌ Recipe cache error:',
        error.response?.data || error.message,
      );
    }

    // Test Subscriptions Data
    console.log('\n💰 SUBSCRIPTIONS DATA:');
    const subscriptionsResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/subscriptions`,
      config,
    );
    console.log(
      `Total subscriptions: ${subscriptionsResponse.data.subscriptions?.length || 0}`,
    );

    // Test Feedback Data
    console.log('\n📝 FEEDBACK DATA:');
    const feedbackResponse = await axios.get(
      `${API_BASE_URL}/api/v1/admin/feedback`,
      config,
    );
    console.log(
      `Total feedback: ${feedbackResponse.data.feedback?.length || 0}`,
    );
  } catch (error) {
    console.error(
      '❌ Error testing data:',
      error.response?.data || error.message,
    );
  }
}

testRealData();
