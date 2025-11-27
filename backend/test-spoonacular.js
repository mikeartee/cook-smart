const axios = require('axios');
require('dotenv').config();

// Test Spoonacular API for US recipes
async function testSpoonacular() {
  console.log('Testing Spoonacular API for US "normal food" recipes...\n');
  console.log(
    `API Key: ${process.env.SPOONACULAR_API_KEY?.substring(0, 10)}...\n`,
  );

  const searches = [
    'chicken casserole',
    'pot roast',
    'meatloaf',
    'beef stroganoff',
    'tacos',
    'fried chicken',
    'pancakes',
    'pulled pork',
    'mac and cheese',
    'chili',
  ];

  for (const query of searches) {
    try {
      const response = await axios.get(
        'https://api.spoonacular.com/recipes/complexSearch',
        {
          params: {
            apiKey: process.env.SPOONACULAR_API_KEY,
            query: query,
            number: 3,
            addRecipeInformation: true,
          },
        },
      );

      const count = response.data.totalResults || 0;
      const recipes = response.data.results || [];

      console.log(`✅ "${query}": ${count} recipes found`);
      if (recipes.length > 0) {
        recipes.slice(0, 2).forEach(r => {
          console.log(`   - ${r.title}`);
        });
      }
      console.log('');
    } catch (error) {
      console.log(`❌ "${query}": ${error.message}\n`);
    }
  }
}

testSpoonacular();
