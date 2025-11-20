const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/v1';

async function testLogin() {
  console.log('🔐 Testing Login System\n');
  console.log('='.repeat(60));
  
  // Test 1: Brad's account
  console.log('\n📧 Test 1: Brad (bradturnbough80@gmail.com)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: 'bradturnbough80@gmail.com',
        password: 'Brad2024!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Co-founder: ${data.user.is_co_founder}`);
      console.log(`   Special User: ${data.user.is_special_user}`);
      console.log(`   Creator: ${data.user.is_creator}`);
    } else {
      console.log('❌ Login failed!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.message || data.error}`);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  // Test 2: Briana's account
  console.log('\n📧 Test 2: Briana (dwoodswoods2@gmail.com)');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: 'dwoodswoods2@gmail.com',
        password: 'Briana2024!'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log(`   Token: ${data.token.substring(0, 20)}...`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Co-founder: ${data.user.is_co_founder}`);
      console.log(`   Special User: ${data.user.is_special_user}`);
    } else {
      console.log('❌ Login failed!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.message || data.error}`);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  // Test 3: Invalid credentials
  console.log('\n📧 Test 3: Invalid Credentials');
  console.log('-'.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'wrongpassword'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('⚠️  Should have failed but succeeded!');
    } else {
      console.log('✅ Correctly rejected invalid credentials');
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${data.message || data.error}`);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Login tests complete!');
  console.log('='.repeat(60) + '\n');
}

testLogin();
