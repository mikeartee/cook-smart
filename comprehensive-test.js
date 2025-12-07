const axios = require('axios');

const API_BASE = 'https://api.cooksmartapp.com';
const WEBSITE_BASE = 'https://cooksmartapp.com';

// Test credentials - using unique email to avoid conflicts
const TEST_USER = {
  email: `test${Date.now()}@example.com`,
  password: 'Test123!@#',
  first_name: 'Test',
  last_name: 'User',
  age_verified: true,
};

let authToken = null;
let userId = null;
let testRecipeId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  cyan: '\x1b[96m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

function recordTest(name, passed, message, details = null) {
  results.tests.push({name, passed, message, details});
  if (passed) {
    results.passed++;
    log(`✅ ${message}`, 'green');
    if (details) log(`   ${details}`, 'cyan');
  } else {
    results.failed++;
    log(`❌ ${message}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  log(title, 'blue');
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================
// WEBSITE TESTS
// ============================================

async function testWebsite() {
  logSection('WEBSITE TESTS');

  // Test 1: Homepage
  try {
    const response = await axios.get(WEBSITE_BASE, {timeout: 10000});
    const hasContent = response.data.includes('Cook Smart');
    recordTest(
      'Website',
      response.status === 200 && hasContent,
      'Homepage loads successfully',
      `Status: ${response.status}`,
    );
  } catch (error) {
    recordTest('Website', false, 'Homepage failed to load', error.message);
  }

  // Test 2: Contact Form Endpoint
  try {
    const response = await axios.post(
      `${API_BASE}/contact`,
      {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Automated Test',
        message:
          'This is an automated test message from the comprehensive test suite.',
      },
      {timeout: 10000},
    );

    recordTest(
      'Contact Form',
      response.status === 200,
      'Contact form submission works',
      `Response: ${response.data.message}`,
    );
  } catch (error) {
    recordTest(
      'Contact Form',
      false,
      'Contact form failed',
      error.response?.data?.message || error.message,
    );
  }
}

// ============================================
// API HEALTH & AUTH TESTS
// ============================================

async function testAPIHealth() {
  logSection('API HEALTH CHECK');

  try {
    const response = await axios.get(`${API_BASE}/health`, {timeout: 10000});
    const isHealthy =
      response.data.status === 'OK' && response.data.database?.connected;

    recordTest(
      'API Health',
      isHealthy,
      'API is healthy and database connected',
      `Version: ${response.data.version}, Env: ${response.data.environment}`,
    );
  } catch (error) {
    recordTest('API Health', false, 'API health check failed', error.message);
  }
}

async function testAuthentication() {
  logSection('AUTHENTICATION TESTS');

  // Test 1: User Registration
  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/auth/register`,
      TEST_USER,
      {timeout: 10000},
    );

    authToken = response.data.token;
    userId = response.data.user.id;

    recordTest(
      'Registration',
      response.status === 201,
      'User registration successful',
      `User ID: ${userId}, Email: ${TEST_USER.email}`,
    );
  } catch (error) {
    recordTest(
      'Registration',
      false,
      'Registration failed',
      error.response?.data?.message || error.message,
    );
    return false;
  }

  // Test 2: User Login
  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/auth/login`,
      {
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
      {timeout: 10000},
    );

    authToken = response.data.token;

    recordTest(
      'Login',
      response.status === 200,
      'User login successful',
      `Token obtained: ${authToken.substring(0, 30)}...`,
    );
  } catch (error) {
    recordTest(
      'Login',
      false,
      'Login failed',
      error.response?.data?.message || error.message,
    );
    return false;
  }

  return true;
}

// ============================================
// USER PROFILE TESTS
// ============================================

async function testUserProfile() {
  logSection('USER PROFILE TESTS');

  try {
    const response = await axios.get(`${API_BASE}/api/v1/users/profile`, {
      headers: {Authorization: `Bearer ${authToken}`},
      timeout: 10000,
    });

    const hasProfile =
      response.data.user && response.data.user.email === TEST_USER.email;

    recordTest(
      'User Profile',
      hasProfile,
      'Profile retrieved successfully',
      `Name: ${response.data.user.first_name} ${response.data.user.last_name}`,
    );
  } catch (error) {
    recordTest(
      'User Profile',
      false,
      'Profile retrieval failed',
      error.response?.data?.message || error.message,
    );
  }
}

// ============================================
// RECIPE TESTS
// ============================================

async function testRecipes() {
  logSection('RECIPE FEATURE TESTS');

  // Test 1: Recipe Search
  try {
    const response = await axios.get(
      `${API_BASE}/api/v1/recipes/search?ingredients=chicken,rice`,
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 15000,
      },
    );

    const hasRecipes =
      response.data.recipes && response.data.recipes.length > 0;
    if (hasRecipes) {
      testRecipeId = response.data.recipes[0].id;
    }

    recordTest(
      'Recipe Search',
      hasRecipes,
      'Recipe search works',
      `Found ${response.data.recipes?.length || 0} recipes`,
    );
  } catch (error) {
    recordTest(
      'Recipe Search',
      false,
      'Recipe search failed',
      error.response?.data?.message || error.message,
    );
  }

  // Test 2: Recipe Details
  if (testRecipeId) {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/recipes/${testRecipeId}`,
        {
          headers: {Authorization: `Bearer ${authToken}`},
          timeout: 10000,
        },
      );

      const hasDetails =
        response.data.recipe &&
        response.data.recipe.ingredients &&
        response.data.recipe.instructions;

      recordTest(
        'Recipe Details',
        hasDetails,
        'Recipe details loaded',
        `Ingredients: ${response.data.recipe?.ingredients?.length || 0}, Has instructions: ${!!response.data.recipe?.instructions}`,
      );
    } catch (error) {
      recordTest(
        'Recipe Details',
        false,
        'Recipe details failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 3: Trending Recipes
  try {
    const response = await axios.get(`${API_BASE}/api/v1/recipes/trending`, {
      headers: {Authorization: `Bearer ${authToken}`},
      timeout: 10000,
    });

    const hasTrending =
      response.data.recipes && response.data.recipes.length > 0;

    recordTest(
      'Trending Recipes',
      hasTrending,
      'Trending recipes loaded',
      `Found ${response.data.recipes?.length || 0} trending recipes`,
    );
  } catch (error) {
    recordTest(
      'Trending Recipes',
      false,
      'Trending recipes failed',
      error.response?.data?.message || error.message,
    );
  }
}

// ============================================
// ALLERGY & DIETARY TESTS
// ============================================

async function testAllergyFeatures() {
  logSection('ALLERGY & DIETARY FEATURES');

  let allergyId = null;

  // Test 1: Add Allergy
  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/dietary/allergies/user/${userId}`,
      {
        allergyId: 1, // Peanuts
        severityOverride: 'severe',
      },
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    allergyId = response.data.userAllergy?.id;

    recordTest(
      'Add Allergy',
      response.status === 201,
      'Allergy added successfully',
      `Allergy ID: ${allergyId}`,
    );
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.error?.includes('already exists')
    ) {
      log('⚠️  Allergy already exists (expected)', 'yellow');
      results.warnings++;
    } else {
      recordTest(
        'Add Allergy',
        false,
        'Add allergy failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 2: Get Allergies
  try {
    const response = await axios.get(
      `${API_BASE}/api/v1/dietary/allergies/user/${userId}`,
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    const hasAllergies =
      response.data.allergies && response.data.allergies.length > 0;

    recordTest(
      'Get Allergies',
      hasAllergies,
      'Allergies retrieved',
      `User has ${response.data.allergies?.length || 0} allergies`,
    );
  } catch (error) {
    recordTest(
      'Get Allergies',
      false,
      'Get allergies failed',
      error.response?.data?.message || error.message,
    );
  }

  // Test 3: Recipe Safety Analysis
  if (testRecipeId) {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/recipe-analysis/${testRecipeId}/analysis`,
        {
          headers: {Authorization: `Bearer ${authToken}`},
          timeout: 10000,
        },
      );

      const hasAnalysis = response.data.safetyScore !== undefined;

      recordTest(
        'Recipe Analysis',
        hasAnalysis,
        'Recipe safety analysis works',
        `Safety Score: ${response.data.safetyScore}%, Conflicts: ${response.data.conflicts?.length || 0}`,
      );
    } catch (error) {
      recordTest(
        'Recipe Analysis',
        false,
        'Recipe analysis failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 4: Recipe Modification (Auto-Substitution)
  if (testRecipeId) {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/recipe-modification/${testRecipeId}/modified`,
        {
          headers: {Authorization: `Bearer ${authToken}`},
          timeout: 10000,
        },
      );

      const hasModification = response.data.modifiedIngredients !== undefined;

      recordTest(
        'Auto-Substitution',
        hasModification,
        'Recipe modification works',
        `Modified ingredients: ${response.data.modifiedIngredients?.length || 0}`,
      );
    } catch (error) {
      recordTest(
        'Auto-Substitution',
        false,
        'Recipe modification failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 5: Personalized Recommendations
  try {
    const response = await axios.get(
      `${API_BASE}/api/v1/personalized/for-you`,
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    const hasRecommendations = response.data.recipes !== undefined;

    recordTest(
      'Personalized Recipes',
      hasRecommendations,
      'Personalized recommendations work',
      `Found ${response.data.recipes?.length || 0} personalized recipes`,
    );
  } catch (error) {
    recordTest(
      'Personalized Recipes',
      false,
      'Personalized recipes failed',
      error.response?.data?.message || error.message,
    );
  }

  // Test 6: Safety Check (Cross-Contamination)
  if (testRecipeId) {
    try {
      const response = await axios.get(
        `${API_BASE}/api/v1/safety-check/${testRecipeId}`,
        {
          headers: {Authorization: `Bearer ${authToken}`},
          timeout: 10000,
        },
      );

      const hasSafetyCheck = response.data.safetyLevel !== undefined;

      recordTest(
        'Safety Check',
        hasSafetyCheck,
        'Cross-contamination check works',
        `Safety Level: ${response.data.safetyLevel}, Warnings: ${response.data.warnings?.length || 0}`,
      );
    } catch (error) {
      recordTest(
        'Safety Check',
        false,
        'Safety check failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 7: Substitution Feedback
  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/substitutions`,
      {
        originalIngredient: 'Peanut Butter',
        substitution: 'Almond Butter',
        rating: 5,
        worked: true,
        notes: 'Great alternative for automated test!',
      },
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    recordTest(
      'Substitution Feedback',
      response.status === 201,
      'Feedback submission works',
      `Feedback ID: ${response.data.feedback?.id}`,
    );
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.error?.includes('already submitted')
    ) {
      log('⚠️  Feedback already submitted (expected)', 'yellow');
      results.warnings++;
    } else {
      recordTest(
        'Substitution Feedback',
        false,
        'Feedback submission failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 8: Get Feedback Stats
  try {
    const response = await axios.get(
      `${API_BASE}/api/v1/substitutions/stats?ingredient=Peanut Butter`,
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    const hasStats = response.data.substitutions !== undefined;

    recordTest(
      'Feedback Stats',
      hasStats,
      'Feedback stats retrieval works',
      `Found ${response.data.substitutions?.length || 0} substitutions`,
    );
  } catch (error) {
    recordTest(
      'Feedback Stats',
      false,
      'Feedback stats failed',
      error.response?.data?.message || error.message,
    );
  }
}

// ============================================
// FAVORITES TESTS
// ============================================

async function testFavorites() {
  logSection('FAVORITES FEATURE');

  if (!testRecipeId) {
    log('⚠️  Skipping favorites test - no recipe ID available', 'yellow');
    results.warnings++;
    return;
  }

  // Test 1: Add to Favorites
  try {
    const response = await axios.post(
      `${API_BASE}/api/v1/favorites`,
      {
        recipeId: testRecipeId,
      },
      {
        headers: {Authorization: `Bearer ${authToken}`},
        timeout: 10000,
      },
    );

    recordTest(
      'Add Favorite',
      response.status === 201,
      'Recipe added to favorites',
      `Recipe ID: ${testRecipeId}`,
    );
  } catch (error) {
    if (
      error.response?.status === 400 &&
      error.response?.data?.error?.includes('already in favorites')
    ) {
      log('⚠️  Recipe already in favorites (expected)', 'yellow');
      results.warnings++;
    } else {
      recordTest(
        'Add Favorite',
        false,
        'Add favorite failed',
        error.response?.data?.message || error.message,
      );
    }
  }

  // Test 2: Get Favorites
  try {
    const response = await axios.get(`${API_BASE}/api/v1/favorites`, {
      headers: {Authorization: `Bearer ${authToken}`},
      timeout: 10000,
    });

    const hasFavorites = response.data.favorites !== undefined;

    recordTest(
      'Get Favorites',
      hasFavorites,
      'Favorites retrieved',
      `User has ${response.data.favorites?.length || 0} favorites`,
    );
  } catch (error) {
    recordTest(
      'Get Favorites',
      false,
      'Get favorites failed',
      error.response?.data?.message || error.message,
    );
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     COOK SMART - COMPREHENSIVE FEATURE TEST SUITE         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  log(`Testing Production Environment:`, 'yellow');
  log(`  Website: ${WEBSITE_BASE}`, 'yellow');
  log(`  API: ${API_BASE}`, 'yellow');
  console.log('\n');

  const startTime = Date.now();

  // Run all test suites
  await testWebsite();
  await testAPIHealth();

  const authSuccess = await testAuthentication();

  if (authSuccess) {
    await testUserProfile();
    await testRecipes();
    await testAllergyFeatures();
    await testFavorites();
  } else {
    log('\n⚠️  Authentication failed - skipping remaining tests', 'yellow');
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print Summary
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                      TEST SUMMARY                          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  console.log('\n');

  const total = results.passed + results.failed;
  const successRate =
    total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  log(`Total Tests: ${total}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  log(`⏱️  Duration: ${duration}s`, 'cyan');
  console.log('\n');

  const rateColor =
    successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red';
  log(`Success Rate: ${successRate}%`, rateColor);

  if (results.failed > 0) {
    console.log('\n');
    log('Failed Tests:', 'red');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  • ${t.name}: ${t.message}`, 'red');
        if (t.details) log(`    ${t.details}`, 'yellow');
      });
  }

  console.log('\n');

  if (results.failed === 0) {
    log('🎉 ALL TESTS PASSED! The app is working perfectly!', 'green');
  } else if (successRate >= 80) {
    log('✅ Most tests passed. Minor issues detected.', 'yellow');
  } else {
    log('⚠️  Multiple tests failed. Review errors above.', 'red');
  }

  console.log('\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
