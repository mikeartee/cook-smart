const axios = require('axios');

async function testFatSecret() {
  try {
    console.log('Testing FatSecret API from production server...');

    // Get token
    const auth = Buffer.from(
      'e2cf80c43b0c4687ba237b45438c4ad4:3ce76986cd444c4084d093f70f3e36bf',
    ).toString('base64');

    const tokenResponse = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=premier',
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    console.log('✅ Token success, scope:', tokenResponse.data.scope);

    // Test search
    const searchResponse = await axios.post(
      'https://platform.fatsecret.com/rest/server.api',
      null,
      {
        params: {
          method: 'recipes.search.v3',
          search_expression: 'chicken',
          max_results: 2,
          format: 'json',
        },
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      },
    );

    console.log('✅ Search success!');

    if (searchResponse.data.recipes?.recipe) {
      const recipes = Array.isArray(searchResponse.data.recipes.recipe)
        ? searchResponse.data.recipes.recipe
        : [searchResponse.data.recipes.recipe];

      console.log(`Found ${recipes.length} recipes:`);
      recipes.forEach((r, i) => {
        console.log(`${i + 1}. ${r.recipe_name}`);
        console.log(`   Image: ${r.recipe_image || 'NO IMAGE'}`);
      });
    } else {
      console.log(
        'No recipes in response:',
        JSON.stringify(searchResponse.data, null, 2),
      );
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testFatSecret();
