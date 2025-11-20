const axios = require('axios');

const API_URL = 'http://3.237.38.24:3000/api/v1';

async function testAccounts() {
  console.log('🔍 Testing all three accounts...\n');
  
  const accounts = [
    {
      email: 'bradturnbough80@gmail.com',
      password: 'Brad2024!',
      name: 'Brad Turnbough',
      expectedRole: 'Creator & Co-founder'
    },
    {
      email: 'brianaolszewski1@gmail.com',
      password: 'June172018',
      name: 'Briana Olszewski',
      expectedRole: 'Co-founder'
    },
    {
      email: 'dwoodswoods2@gmail.com',
      password: 'MidgettRoad',
      name: 'Donna Woods',
      expectedRole: 'Special User'
    }
  ];
  
  for (const account of accounts) {
    try {
      console.log(`Testing ${account.name} (${account.email})...`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      if (response.data.success) {
        const user = response.data.user;
        console.log(`  ✅ Login successful`);
        console.log(`  Name: ${user.first_name} ${user.last_name}`);
        console.log(`  Co-founder: ${user.is_co_founder}`);
        console.log(`  Special User: ${user.is_special_user}`);
        console.log(`  Creator: ${user.is_creator}`);
        console.log(`  Lifetime: ${user.has_lifetime_subscription}`);
        console.log('');
      }
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ Login failed: ${error.response.data.message}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
      console.log('');
    }
  }
}

testAccounts();
