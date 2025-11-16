/**
 * Test TheMealDB API directly
 */

const axios = require('axios');

async function testTheMealDB() {
  console.log('🧪 Testing TheMealDB API...\n');
  
  try {
    // Test 1: Search by ingredient
    console.log('Test 1: Searching for chicken recipes...');
    const searchResponse = await axios.get('https://www.themealdb.com/api/json/v1/1/filter.php?i=chicken');
    
    if (searchResponse.data && searchResponse.data.meals) {
      console.log(`✅ Found ${searchResponse.data.meals.length} chicken recipes`);
      console.log(`   First recipe: ${searchResponse.data.meals[0].strMeal}`);
      
      // Test 2: Get recipe details
      const recipeId = searchResponse.data.meals[0].idMeal;
      console.log(`\nTest 2: Getting details for recipe ${recipeId}...`);
      
      const detailsResponse = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
      
      if (detailsResponse.data && detailsResponse.data.meals) {
        const recipe = detailsResponse.data.meals[0];
        console.log(`✅ Recipe details retrieved`);
        console.log(`   Title: ${recipe.strMeal}`);
        console.log(`   Category: ${recipe.strCategory}`);
        console.log(`   Area: ${recipe.strArea}`);
        console.log(`   Instructions: ${recipe.strInstructions.substring(0, 100)}...`);
        
        // Count ingredients
        let ingredientCount = 0;
        for (let i = 1; i <= 20; i++) {
          if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim()) {
            ingredientCount++;
          }
        }
        console.log(`   Ingredients: ${ingredientCount}`);
        
        console.log('\n✅ TheMealDB API is working perfectly!');
        console.log('   Your app will use this for unlimited free recipe searches.');
      }
    } else {
      console.log('❌ No recipes found');
    }
    
  } catch (error) {
    console.error('❌ Error testing TheMealDB:', error.message);
  }
}

testTheMealDB();
