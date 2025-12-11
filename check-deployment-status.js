/**
 * Check Deployment Status
 *
 * Verifies if auto-deployment worked and backend is updated
 */

const axios = require('axios');

async function checkDeploymentStatus() {
  console.log('🔍 CHECKING DEPLOYMENT STATUS');
  console.log('='.repeat(40));

  try {
    // Check backend health
    console.log('🏥 Checking backend health...');

    try {
      const healthResponse = await axios.get(
        'https://api.cooksmartapp.com/health',
        {
          timeout: 10000,
        },
      );

      console.log('✅ Backend is responding');
      console.log('  Status:', healthResponse.data.status || 'OK');
      console.log(
        '  Response time:',
        healthResponse.headers['x-response-time'] || 'N/A',
      );
    } catch (healthError) {
      console.log('❌ Backend health check failed:', healthError.message);
      return;
    }

    // Check GitHub Actions status
    console.log('\n🤖 GitHub Actions status:');
    console.log('  Repository: https://github.com/tootallgames2020/cook-smart');
    console.log(
      '  Actions: https://github.com/tootallgames2020/cook-smart/actions',
    );
    console.log('  Workflow: Auto-Deploy Backend');

    // Test if our fix is deployed by making a simple API call
    console.log('\n🧪 Testing if recipe matching fix is deployed...');

    try {
      // Login
      const loginResponse = await axios.post(
        'https://api.cooksmartapp.com/api/v1/auth/login',
        {
          email: 'bradturnbough80@gmail.com',
          password: 'June172018!',
        },
      );

      const token = loginResponse.data.token;
      console.log('✅ Authentication successful');

      // Make a test search to see if our debug logs are working
      const testResponse = await axios.get(
        'https://api.cooksmartapp.com/api/v1/recipes/search',
        {
          params: {
            ingredients: 'chicken,rice',
            _deployment_test: Date.now(),
          },
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      const data = testResponse.data;

      console.log('\n📊 Deployment Test Results:');
      console.log('  Recipe count:', data.count);
      console.log('  Provider:', data.provider);

      if (data.recipes && data.recipes.length > 0) {
        const recipe = data.recipes[0];

        // Check if we're getting FatSecret data (not Spoonacular)
        const isSpoonacular = 'extendedIngredients' in recipe;
        const isFatSecret = !isSpoonacular;

        // Check if matching data exists
        const hasMatchingData = recipe.matchPercentage !== undefined;

        console.log(
          '  Data source:',
          isSpoonacular ? 'Spoonacular (old cache)' : 'FatSecret (fresh)',
        );
        console.log('  Has matching data:', hasMatchingData);

        if (isFatSecret && hasMatchingData) {
          console.log('\n🎉 DEPLOYMENT SUCCESS!');
          console.log('✅ Recipe matching fix is deployed and working');
          console.log(`✅ Match percentage: ${recipe.matchPercentage}%`);
          console.log(`✅ Used ingredients: ${recipe.usedIngredientCount}`);

          console.log('\n🚀 Ready to run comprehensive tests:');
          console.log('  node test-recipe-matching-comprehensive.js');
        } else if (isFatSecret && !hasMatchingData) {
          console.log('\n⚠️ PARTIAL DEPLOYMENT');
          console.log('✅ FatSecret data is coming through');
          console.log('❌ formatRecipesWithMatching still not being called');
          console.log('🔧 May need additional debugging');
        } else if (isSpoonacular) {
          console.log('\n❌ DEPLOYMENT NOT YET ACTIVE');
          console.log('❌ Still getting cached Spoonacular data');
          console.log('⏳ Auto-deployment may still be in progress');
          console.log('🔄 Check GitHub Actions for deployment status');
        }

        // Show recipe details for debugging
        console.log('\n📋 Recipe Details (for debugging):');
        console.log('  Title:', recipe.title);
        console.log('  Provider field:', recipe.provider);
        console.log(
          '  Has extendedIngredients:',
          'extendedIngredients' in recipe,
        );
        console.log('  Has matchPercentage:', 'matchPercentage' in recipe);
        console.log('  All fields:', Object.keys(recipe).join(', '));
      }
    } catch (apiError) {
      console.log('❌ API test failed:', apiError.message);
    }

    // Instructions
    console.log('\n📋 NEXT STEPS:');

    if (!process.env.SSH_PRIVATE_KEY) {
      console.log('1. ⚠️ Add SSH_PRIVATE_KEY to GitHub Secrets');
      console.log(
        '   - Go to: https://github.com/tootallgames2020/cook-smart/settings/secrets/actions',
      );
      console.log('   - Add secret: SSH_PRIVATE_KEY');
      console.log('   - Value: Contents of ~/.ssh/cook-smart-key.pem');
    }

    console.log('2. 🔍 Check GitHub Actions:');
    console.log('   - https://github.com/tootallgames2020/cook-smart/actions');
    console.log('   - Look for "Auto-Deploy Backend" workflow');

    console.log('3. 🧪 Run comprehensive test when ready:');
    console.log('   - node test-recipe-matching-comprehensive.js');

    console.log('4. 🔄 If deployment failed, check workflow logs');
  } catch (error) {
    console.error('❌ Deployment status check failed:', error.message);
  }
}

checkDeploymentStatus();
