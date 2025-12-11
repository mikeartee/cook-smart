const axios = require('axios');

async function testAdminEmailLogin() {
  try {
    console.log('Testing admin login with EMAIL (after fix)...');
    const response = await axios.post(
      'https://api.cooksmartapp.com/api/v1/admin/auth/login',
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('✅ Login successful with EMAIL:', response.data);
  } catch (error) {
    console.log(
      '❌ Login failed with EMAIL:',
      error.response?.data || error.message,
    );
  }
}

testAdminEmailLogin();
