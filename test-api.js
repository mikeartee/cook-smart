// Quick API test script
// Using native fetch (Node 18+)

const API_BASE = 'http://localhost:3000/api/v1';

async function testAPI() {
  try {
    console.log('🧪 Testing Cook Smart API...\n');

    // Test 1: Register
    console.log('1️⃣ Testing register...');
    const signupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@cooktest.com`,
        password: 'Test123!Test',
        first_name: 'Test',
        last_name: 'User',
        age_verified: true
      })
    });
    const signupData = await signupRes.json();
    
    if (signupData.token) {
      console.log('✅ Register successful!');
      console.log(`   Token: ${signupData.token.substring(0, 20)}...`);
    } else {
      console.log('❌ Register failed:', signupData);
      return;
    }

    const token = signupData.token;

    // Test 2: Add some ingredients
    console.log('\n2️⃣ Adding test ingredients...');
    const ingredients = ['chicken', 'rice', 'tomato'];
    
    for (const ing of ingredients) {
      await fetch(`${API_BASE}/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customName: ing,
          category: 'Other',
          quantity: 1,
          unit: 'piece'
        })
      });
    }
    console.log('✅ Added ingredients: chicken, rice, tomato');

    // Test 3: Search recipes with Spoonacular
    console.log('\n3️⃣ Testing Spoonacular API - Searching recipes...');
    const recipeRes = await fetch(
      `${API_BASE}/recipes/search?ingredients=chicken,rice,tomato`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    if (!recipeRes.ok) {
      console.log(`❌ Recipe search failed with status: ${recipeRes.status}`);
      const errorText = await recipeRes.text();
      console.log(`   Error: ${errorText}`);
      return;
    }
    
    const recipeData = await recipeRes.json();

    if (recipeData.recipes && recipeData.recipes.length > 0) {
      console.log('✅ Recipe search successful!');
      console.log(`   Found ${recipeData.recipes.length} recipes`);
      console.log(`   First recipe: "${recipeData.recipes[0].title}"`);
      console.log(`   Used ingredients: ${recipeData.recipes[0].usedIngredientCount}`);
      console.log(`   Missing ingredients: ${recipeData.recipes[0].missedIngredientCount}`);
      
      // Test 4: Get recipe details
      const recipeId = recipeData.recipes[0].id;
      console.log(`\n4️⃣ Getting details for recipe ${recipeId}...`);
      
      const detailRes = await fetch(
        `${API_BASE}/recipes/${recipeId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const detailData = await detailRes.json();
      
      if (detailData.recipe) {
        console.log('✅ Recipe details retrieved!');
        console.log(`   Title: ${detailData.recipe.title}`);
        console.log(`   Ready in: ${detailData.recipe.readyInMinutes} minutes`);
        console.log(`   Servings: ${detailData.recipe.servings}`);
        console.log(`   Ingredients: ${detailData.recipe.extendedIngredients.length}`);
      }
      
      console.log('\n🎉 ALL TESTS PASSED! Spoonacular API is working!');
    } else {
      console.log('❌ Recipe search failed:', recipeData.error || 'No recipes found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPI();
