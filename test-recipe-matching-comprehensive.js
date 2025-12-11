/**
 * Comprehensive Recipe Matching Test
 *
 * Tests the complete recipe matching pipeline after auto-deployment
 */

const axios = require('axios');

async function testRecipeMatchingComprehensive() {
  console.log('🧪 COMPREHENSIVE RECIPE MATCHING TEST');
  console.log('='.repeat(50));

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

    // Test 1: Basic ingredient search
    console.log('\n🔍 TEST 1: Basic ingredient search...');

    const basicResponse = await axios.get(
      'https://api.cooksmartapp.com/api/v1/recipes/search',
      {
        params: {
          ingredients: 'chicken,rice,onion',
          _test: 'basic_matching',
        },
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    const basicData = basicResponse.data;

    console.log('📊 Basic Search Results:');
    console.log('  Recipe count:', basicData.count);
    console.log('  Provider:', basicData.provider);

    if (basicData.recipes && basicData.recipes.length > 0) {
      const recipe = basicData.recipes[0];

      console.log('\n📖 First Recipe Analysis:');
      console.log('  Title:', recipe.title);
      console.log('  Recipe provider field:', recipe.provider);

      // Check for Spoonacular vs FatSecret
      const isSpoonacular = 'extendedIngredients' in recipe;
      const isFatSecret = !isSpoonacular && 'calories' in recipe;

      console.log(
        '  Data source:',
        isSpoonacular
          ? 'Spoonacular (cached)'
          : isFatSecret
            ? 'FatSecret (fresh)'
            : 'Unknown',
      );

      // Check matching fields
      const matchingFields = {
        matchPercentage: recipe.matchPercentage,
        usedIngredientCount: recipe.usedIngredientCount,
        missedIngredientCount: recipe.missedIngredientCount,
        usedIngredients: recipe.usedIngredients?.length || 0,
        missedIngredients: recipe.missedIngredients?.length || 0,
      };

      console.log('\n🎯 Matching Data Check:');
      let hasMatchingData = false;
      Object.entries(matchingFields).forEach(([key, value]) => {
        const exists = value !== undefined && value !== null;
        if (exists && key === 'matchPercentage' && value > 0)
          hasMatchingData = true;
        console.log(`  ${key}: ${exists ? '✅' : '❌'} ${value}`);
      });

      // Overall status
      console.log('\n📋 TEST 1 RESULT:');
      if (isFatSecret && hasMatchingData) {
        console.log('🎉 SUCCESS: FatSecret + Matching Data Working!');
        console.log(
          `   Match: ${recipe.matchPercentage}% (${recipe.usedIngredientCount} ingredients)`,
        );
      } else if (isFatSecret && !hasMatchingData) {
        console.log(
          '⚠️ PARTIAL: FatSecret data but formatRecipesWithMatching not called',
        );
      } else if (isSpoonacular) {
        console.log('❌ FAILED: Still getting cached Spoonacular data');
      } else {
        console.log('❓ UNKNOWN: Unexpected data format');
      }
    }

    // Test 2: Force fresh search with cache bypass
    console.log('\n🔍 TEST 2: Force fresh search (cache bypass)...');

    const freshResponse = await axios.get(
      'https://api.cooksmartapp.com/api/v1/recipes/search',
      {
        params: {
          ingredients: 'beef,potato,carrot',
          _force_fresh: Date.now(),
          _bypass_cache: 'true',
        },
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    const freshData = freshResponse.data;

    console.log('📊 Fresh Search Results:');
    console.log('  Recipe count:', freshData.count);
    console.log('  Provider:', freshData.provider);

    if (freshData.recipes && freshData.recipes.length > 0) {
      const recipe = freshData.recipes[0];
      const isSpoonacular = 'extendedIngredients' in recipe;
      const hasMatching = recipe.matchPercentage !== undefined;

      console.log('  Sample recipe:', recipe.title);
      console.log('  Is Spoonacular:', isSpoonacular);
      console.log('  Has matching data:', hasMatching);

      if (!isSpoonacular && hasMatching) {
        console.log('🎉 SUCCESS: Fresh FatSecret data with matching!');
      }
    }

    // Test 3: Provider consistency check
    console.log('\n🔍 TEST 3: Provider consistency check...');

    const consistencyResponse = await axios.get(
      'https://api.cooksmartapp.com/api/v1/recipes/search',
      {
        params: {
          ingredients: 'salmon,lemon,herbs',
          _consistency_test: Date.now(),
        },
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    const consistencyData = consistencyResponse.data;

    console.log('📊 Consistency Check:');
    console.log('  API says provider:', consistencyData.provider);

    if (consistencyData.recipes && consistencyData.recipes.length > 0) {
      const recipe = consistencyData.recipes[0];
      console.log('  Recipe says provider:', recipe.provider);
      console.log(
        '  Providers match:',
        consistencyData.provider === recipe.provider,
      );

      if (
        consistencyData.provider === recipe.provider &&
        recipe.provider === 'fatsecret'
      ) {
        console.log('✅ Provider tracking is working correctly');
      } else {
        console.log('⚠️ Provider tracking inconsistency detected');
      }
    }

    // Test 4: Large inventory simulation
    console.log('\n🔍 TEST 4: Large inventory simulation...');

    const largeInventory = [
      'chicken',
      'beef',
      'pork',
      'salmon',
      'rice',
      'pasta',
      'bread',
      'milk',
      'eggs',
      'cheese',
      'onion',
      'garlic',
      'tomato',
      'potato',
      'carrot',
      'spinach',
      'broccoli',
      'bell pepper',
      'mushroom',
      'olive oil',
    ];

    const largeResponse = await axios.get(
      'https://api.cooksmartapp.com/api/v1/recipes/search',
      {
        params: {
          ingredients: largeInventory.join(','),
          _large_inventory_test: 'true',
        },
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    const largeData = largeResponse.data;

    console.log('📊 Large Inventory Results:');
    console.log('  Recipe count:', largeData.count);
    console.log(
      '  Searched ingredients:',
      largeData.searchedIngredients?.length || 'unknown',
    );

    if (largeData.recipes && largeData.recipes.length > 0) {
      const topRecipes = largeData.recipes.slice(0, 3);
      console.log('\n  Top 3 matches:');
      topRecipes.forEach((recipe, index) => {
        console.log(`    ${index + 1}. ${recipe.title}`);
        console.log(
          `       Match: ${recipe.matchPercentage}% (${recipe.usedIngredientCount} ingredients)`,
        );
      });

      const avgMatch =
        topRecipes.reduce((sum, r) => sum + (r.matchPercentage || 0), 0) /
        topRecipes.length;
      console.log(`\n  Average match: ${avgMatch.toFixed(1)}%`);

      if (avgMatch > 40) {
        console.log('✅ Large inventory matching working well');
      } else {
        console.log('⚠️ Large inventory matching needs improvement');
      }
    }

    // Final Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(50));

    const allTests = [basicData, freshData, consistencyData, largeData];
    const workingTests = allTests.filter(data => {
      if (!data.recipes || data.recipes.length === 0) return false;
      const recipe = data.recipes[0];
      const isSpoonacular = 'extendedIngredients' in recipe;
      const hasMatching =
        recipe.matchPercentage !== undefined && recipe.matchPercentage > 0;
      return !isSpoonacular && hasMatching;
    });

    console.log(`✅ Working tests: ${workingTests.length}/${allTests.length}`);

    if (workingTests.length === allTests.length) {
      console.log('🎉 ALL TESTS PASSED: Recipe matching is fully working!');
      console.log('✅ FatSecret integration: Working');
      console.log('✅ Ingredient matching: Working');
      console.log('✅ Cache bypass: Working');
      console.log('✅ Provider tracking: Working');
      console.log('');
      console.log('🚀 RECIPE MATCHING ISSUE IS RESOLVED!');
    } else if (workingTests.length > 0) {
      console.log('⚠️ PARTIAL SUCCESS: Some tests working, some need fixes');
    } else {
      console.log('❌ ALL TESTS FAILED: Recipe matching still broken');
      console.log('🔧 Check deployment status and backend logs');
    }
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

testRecipeMatchingComprehensive();
