const axios = require('axios');

async function debugAnalytics() {
  try {
    // Login first
    const loginResponse = await axios.post(
      'https://api.cooksmartapp.com/api/v1/admin/auth/login',
      {
        email: 'bradturnbough80@gmail.com',
        password: 'June172018!',
      },
    );

    const token = loginResponse.data.token;

    // Get analytics overview
    const analyticsResponse = await axios.get(
      'https://api.cooksmartapp.com/api/v1/admin/analytics/overview',
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    console.log('📊 FULL ANALYTICS RESPONSE:');
    console.log(JSON.stringify(analyticsResponse.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugAnalytics();
