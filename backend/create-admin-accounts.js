const axios = require('axios');

const API_URL = 'http://3.237.38.24:3000/api/v1';

const accounts = [
  {
    email: 'bradturnbough80@gmail.com',
    password: 'Brad2024!',
    firstName: 'Brad',
    lastName: 'Turnbough',
    role: 'creator'
  },
  {
    email: 'brianaolszewski1@gmail.com',
    password: 'June172018',
    firstName: 'Briana',
    lastName: 'Olszewski',
    role: 'cofounder'
  },
  {
    email: 'dwoodswoods2@gmail.com',
    password: 'MidgettRoad',
    firstName: 'Donna',
    lastName: 'Woods',
    role: 'special'
  }
];

async function createAccounts() {
  console.log('🔧 Creating admin accounts...\n');
  
  for (const account of accounts) {
    try {
      console.log(`Creating ${account.firstName} ${account.lastName} (${account.email})...`);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: account.email,
        password: account.password,
        first_name: account.firstName,
        last_name: account.lastName,
        age_verified: true
      });
      
      if (response.data.success) {
        console.log(`  ✅ Account created successfully`);
        console.log(`  User ID: ${response.data.user.id}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`  ⚠️  ${error.response.data.message || error.response.data.error}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('\n✅ Now testing logins...\n');
  
  for (const account of accounts) {
    try {
      console.log(`Testing ${account.firstName} ${account.lastName}...`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: account.email,
        password: account.password
      });
      
      if (response.data.success) {
        const user = response.data.user;
        console.log(`  ✅ Login successful`);
        console.log(`  Name: ${user.first_name} ${user.last_name}`);
        console.log(`  User ID: ${user.id}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ Login failed: ${error.response.data.message}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
}

createAccounts();
