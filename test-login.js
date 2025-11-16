/**
 * Test Login with Mock Database
 */

const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login System...\n');
  
  try {
    // Test 1: Register a new user
    console.log('Test 1: Registering new user...');
    const registerResponse = await axios.post('http://localhost:3000/api/v1/auth/register', {
      email: 'testuser@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      age_verified: true
    });
    
    console.log('✅ Registration successful!');
    console.log(`   Token: ${registerResponse.data.token.substring(0, 20)}...`);
    console.log(`   User: ${registerResponse.data.user.first_name} ${registerResponse.data.user.last_name}`);
    
    const token = registerResponse.data.token;
    
    // Test 2: Login with the user
    console.log('\nTest 2: Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
    
    // Test 3: Test recipe search with auth
    console.log('\nTest 3: Testing recipe search with authentication...');
    const recipeResponse = await axios.get('http://localhost:3000/api/v1/recipes/search', {
      params: { ingredients: 'chicken' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Recipe search works with auth!`);
    console.log(`   Found ${recipeResponse.data.count} recipes`);
    console.log(`   Provider: ${recipeResponse.data.provider}`);
    
    console.log('\n✅ All systems working!');
    console.log('   - Registration: ✅');
    console.log('   - Login: ✅');
    console.log('   - Recipe Search: ✅');
    console.log('   - TheMealDB API: ✅');
    console.log('\n🎉 Your app is ready to test!');
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testLogin();
