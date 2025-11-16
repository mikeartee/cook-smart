const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login...\n');
  
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    console.log('✅ Login successful!');
    console.log(`   User: ${loginResponse.data.user.first_name} ${loginResponse.data.user.last_name}`);
    console.log(`   Email: ${loginResponse.data.user.email}`);
    
    const token = loginResponse.data.token;
    
    // Test recipe search
    const recipeResponse = await axios.get('http://localhost:3000/api/v1/recipes/search', {
      params: { ingredients: 'chicken' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`\n✅ Recipe search works!`);
    console.log(`   Found ${recipeResponse.data.count} recipes from ${recipeResponse.data.provider}`);
    console.log(`   First recipe: ${recipeResponse.data.recipes[0].title}`);
    
    console.log('\n🎉 Everything is working!');
    console.log('\nYou can now login to your app with:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testLogin();
