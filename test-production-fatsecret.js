const {execSync} = require('child_process');

// Test FatSecret API from production server
const testScript = `
const axios = require('axios');

async function testFatSecretProduction() {
  try {
    console.log('🔍 Testing FatSecret API from AWS Production Server...');
    console.log('Server IP: 34.203.8.150');
    console.log('');
    
    // Get access token
    const auth = Buffer.from('e2cf80c43b0c4687ba237b45438c4ad4:3ce76986cd444c4084d093f70f3e36bf').toString('base64');
    
    const tokenResponse = await axios.post(
      'https://oauth.fatsecret.com/connect/token',
      'grant_type=client_credentials&scope=premier',
      {
        headers: {
          Authorization: \`Basic \${auth}\`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    console.log('✅ Token obtained successfully');
    console.log('   Scope:', tokenResponse.data.scope);
    
    const token = tokenResponse.data.access_token;
    
    // Test recipe search
    const searchResponse = await axios.post(
      'https://platform.fatsecret.com/rest/server.api',
      null,
      {
        params: {
          method: 'recipes.search.v3',
          search_expression: 'chicken breast',
          max_results: 3,
          format: 'json',
        },
        headers: {
          Authorization: \`Bearer \${token}\`,
        },
        timeout: 10000,
      }
    );

    console.log('✅ Recipe search successful!');
    
    if (searchResponse.data.recipes && searchResponse.data.recipes.recipe) {
      const recipes = Array.isArray(searchResponse.data.recipes.recipe) 
        ? searchResponse.data.recipes.recipe 
        : [searchResponse.data.recipes.recipe];
        
      console.log(\`   Found \${recipes.length} recipes\`);
      
      recipes.forEach((recipe, index) => {
        console.log(\`   Recipe \${index + 1}: \${recipe.recipe_name}\`);
        console.log(\`     ID: \${recipe.recipe_id}\`);
        console.log(\`     Image: \${recipe.recipe_image || 'NO IMAGE'}\`);
        console.log('');
      });
      
      // Test recipe details for first recipe
      if (recipes.length > 0) {
        const firstRecipe = recipes[0];
        console.log(\`🔍 Testing recipe details for: \${firstRecipe.recipe_name}\`);
        
        const detailResponse = await axios.post(
          'https://platform.fatsecret.com/rest/server.api',
          null,
          {
            params: {
              method: 'recipe.get.v2',
              recipe_id: firstRecipe.recipe_id,
              format: 'json',
            },
            headers: {
              Authorization: \`Bearer \${token}\`,
            },
            timeout: 10000,
          }
        );

        const recipeDetail = detailResponse.data.recipe;
        console.log('✅ Recipe details retrieved successfully!');
        console.log(\`   Detail Image: \${recipeDetail.recipe_image || 'NO IMAGE'}\`);
        console.log(\`   Ingredients: \${recipeDetail.ingredients ? 'YES' : 'NO'}\`);
        console.log(\`   Directions: \${recipeDetail.directions ? 'YES' : 'NO'}\`);
      }
      
    } else {
      console.log('❌ No recipes found in response');
      console.log('Response:', JSON.stringify(searchResponse.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('   Status:', error.response?.status);
    console.log('   Error:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.error?.code === 21) {
      console.log('🚫 IP STILL BLOCKED - Need to contact FatSecret support');
    }
  }
}

testFatSecretProduction();
`;

try {
  console.log('Testing FatSecret API from AWS production server...\n');

  const result = execSync(
    `ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && node -e '${testScript}'"`,
    {
      encoding: 'utf8',
      timeout: 30000,
    },
  );

  console.log(result);
} catch (error) {
  console.error('SSH Error:', error.message);
  if (error.stdout) console.log('Output:', error.stdout);
  if (error.stderr) console.log('Error:', error.stderr);
}
