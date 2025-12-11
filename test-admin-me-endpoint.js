const axios = require('axios');

async function testAdminMeEndpoint() {
  try {
    // First login to get token
    console.log('1. Logging in to get admin token...');
    const loginResponse = await axios.post(
      'https://api.cooksmartapp.com/api/v1/admin/auth/login',
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
    );

    const token = loginResponse.data.token;
    console.log('✅ Login successful, got token');

    // Test admin/auth/me endpoint
    console.log('\n2. Testing /api/v1/admin/auth/me...');
    try {
      const adminMeResponse = await axios.get(
        'https://api.cooksmartapp.com/api/v1/admin/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log('✅ Admin me endpoint works:', adminMeResponse.data);
    } catch (error) {
      console.log(
        '❌ Admin me endpoint failed:',
        error.response?.data || error.message,
      );
    }

    // Test regular auth/me endpoint (what dashboard is calling)
    console.log('\n3. Testing /api/v1/auth/me (what dashboard calls)...');
    try {
      const regularMeResponse = await axios.get(
        'https://api.cooksmartapp.com/api/v1/auth/me',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log('✅ Regular me endpoint response:', regularMeResponse.data);
    } catch (error) {
      console.log(
        '❌ Regular me endpoint failed:',
        error.response?.data || error.message,
      );
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testAdminMeEndpoint();
