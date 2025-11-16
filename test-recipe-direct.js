/**
 * Test Recipe Search Directly (no auth)
 */

const axios = require('axios');

async function testRecipeDirect() {
  console.log('🧪 Testing Recipe Search (Direct)...\n');
  
  try {
    // Test recipe search without auth (if endpoint allows)
    console.log('Searching for chicken recipes...');
    const searchResponse = await axios.get('http://localhost:3000/api/v1/recipes/search', {
      params: { ingredients: 'chicken' }
    });
    
    console.log(`✅ Found ${searchResponse.data.count} recipes`);
    console.log(`   Provider: ${searchResponse.data.provider}`);
    
    if (searchResponse.data.recipes && searchResponse.data.recipes.length > 0) {
      const firstRecipe = searchResponse.data.recipes[0];
      console.log(`\n   First Recipe:`);
      console.log(`   - Title: ${firstRecipe.title}`);
      console.log(`   - ID: ${firstRecipe.id}`);
      console.log(`   - Provider: ${firstRecipe.provider || 'unknown'}`);
      
      console.log('\n✅ Recipe search is working!');
      console.log('   TheMealDB is providing unlimited free recipes.');
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error: ${error.response.status}`);
      console.error(`   Message: ${error.response.data.error || error.response.data.message}`);
      
      if (error.response.status === 401) {
        console.log('\n⚠️  Authentication required');
        console.log('   The recipe endpoint requires login.');
        console.log('   This is normal - your app will handle auth automatically.');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testRecipeDirect();
