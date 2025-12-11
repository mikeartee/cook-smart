const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');

    const response = await axios.post(
      'https://api.cooksmartapp.com/api/v1/admin/auth/login',
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
    );

    console.log('✅ Admin login successful!');
    console.log('🎯 Token received:', response.data.token ? 'YES' : 'NO');
    console.log('👤 User:', response.data.user?.email || 'Unknown');
  } catch (error) {
    console.error(
      '❌ Admin login failed:',
      error.response?.data || error.message,
    );
  }
}

testAdminLogin();
