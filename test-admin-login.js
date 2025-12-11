const axios = require('axios');

async function testAdminLogin() {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/v1/admin/auth/login',
      {
        username: 'brad',
        password: 'June172018!',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Login successful:', response.data);
  } catch (error) {
    console.log('Login failed:', error.response?.data || error.message);
  }
}

testAdminLogin();
