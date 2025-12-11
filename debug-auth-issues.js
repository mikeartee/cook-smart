const axios = require('axios');

async function debugAuthIssues() {
  const baseURL = 'https://api.cooksmartapp.com';

  console.log('🔍 Debugging Authentication Issues\n');

  // Test 1: Check registration endpoint details
  console.log('1. Testing Registration Endpoint...');
  try {
    const response = await axios.post(
      `${baseURL}/api/v1/auth/register`,
      {
        email: 'debug@test.com',
        password: 'TestPassword123!',
        name: 'Debug User',
      },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('   Status:', error.response?.status);
    console.log('   Data:', JSON.stringify(error.response?.data, null, 2));
    console.log('   Headers:', error.response?.headers);
  }

  // Test 2: Check if endpoints exist
  console.log('\n2. Testing Endpoint Availability...');
  const endpoints = [
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/recipes/trending',
    '/api/v1/recipes/seasonal',
    '/health',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, {
        timeout: 5000,
        validateStatus: () => true, // Don't throw on any status
      });
      console.log(`   ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`   ${endpoint}: ERROR - ${error.message}`);
    }
  }

  // Test 3: Check server status
  console.log('\n3. Checking Server Status...');
  try {
    const response = await axios.get(`${baseURL}/health`, {timeout: 5000});
    console.log('✅ Server health:', response.data);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
}

debugAuthIssues();
