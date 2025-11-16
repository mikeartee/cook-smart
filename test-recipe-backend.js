/**
 * Test Recipe Search through Backend
 */

const axios = require('axios');

async function testRecipeBackend() {
  console.log('🧪 Testing Recipe Search Backend...\n');
  
  try {
    // First, we need to login to get a token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');
    
    // Test recipe search
    console.log('Step 2: Searching for chicken recipes...');
    const searchResponse = await axios.get('http://localhost:3000/api/v1/recipes/search', {
      params: { ingredients: 'chicken' },
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Found ${searchResponse.data.count} recipes`);
    console.log(`   Provider: ${searchResponse.data.provider}`);
    
    if (searchResponse.data.recipes && searchResponse.data.recipes.length > 0) {
      const firstRecipe = searchResponse.data.recipes[0];
      console.log(`\n   First Recipe:`);
      console.log(`   - Title: ${firstRecipe.title}`);
      console.log(`   - ID: ${firstRecipe.id}`);
      console.log(`   - Image: ${firstRecipe.image ? '✅ Has image' : '❌ No image'}`);
      
      // Test recipe details
      console.log(`\nStep 3: Getting recipe details for ${firstRecipe.id}...`);
      const detailsResponse = await axios.get(`http://localhost:3000/api/v1/recipes/${firstRecipe.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const recipe = detailsResponse.data.recipe;
      console.log(`✅ Recipe details retrieved`);
      console.log(`   - Title: ${recipe.title}`);
      console.log(`   - Servings: ${recipe.servings}`);
      console.log(`   - Ready in: ${recipe.readyInMinutes} minutes`);
      console.log(`   - Ingredients: ${recipe.ingredients?.length || 0}`);
      console.log(`   - Instructions: ${recipe.instructions ? '✅ Has instructions' : '❌ No instructions'}`);
      console.log(`   - Provider: ${recipe.provider || 'unknown'}`);
      
      console.log('\n✅ Recipe search is working perfectly!');
      console.log('   Your app is ready to search for recipes with TheMealDB.');
    } else {
      console.log('⚠️  No recipes returned');
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error: ${error.response.status} - ${error.response.data.error || error.response.data.message}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 Tip: You need to create a test user first or use your actual credentials');
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testRecipeBackend();
