const axios = require('axios');

async function debugRemainingIssues() {
  const baseURL = 'https://api.cooksmartapp.com';

  // First login to get token
  console.log('🔐 Getting auth token...');
  const loginResponse = await axios.post(`${baseURL}/api/v1/auth/login`, {
    email: 'test@cooksmarttest.com',
    password: 'TestPassword123!',
  });
  const token = loginResponse.data.token;
  console.log('✅ Got token');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Test each failing endpoint
  console.log('\n🔍 Testing failing endpoints...\n');

  // 1. Trending Recipes
  console.log('1. Trending Recipes:');
  try {
    const response = await axios.get(`${baseURL}/api/v1/recipes/trending`, {
      headers: authHeaders,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 2. Seasonal Recipes
  console.log('\n2. Seasonal Recipes:');
  try {
    const response = await axios.get(`${baseURL}/api/v1/recipes/seasonal`, {
      headers: authHeaders,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 3. Referral System
  console.log('\n3. Referral System:');
  try {
    const response = await axios.get(`${baseURL}/api/v1/referrals`, {
      headers: authHeaders,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 4. Points System
  console.log('\n4. Points System:');
  try {
    const response = await axios.get(`${baseURL}/api/v1/points`, {
      headers: authHeaders,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 5. Dietary Preferences
  console.log('\n5. Dietary Preferences:');
  try {
    const response = await axios.get(`${baseURL}/api/v1/dietary`, {
      headers: authHeaders,
      validateStatus: () => true,
    });
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // 6. Feedback (test without auth first)
  console.log('\n6. Feedback Submission (no auth):');
  try {
    const response = await axios.post(
      `${baseURL}/api/v1/feedback`,
      {
        type: 'bug',
        message: 'Test feedback',
        email: 'test@cooksmarttest.com',
      },
      {
        validateStatus: () => true,
      },
    );
    console.log(`   Status: ${response.status}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

debugRemainingIssues();
