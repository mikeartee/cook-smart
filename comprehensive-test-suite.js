const axios = require('axios');

// Comprehensive test suite for Cook Smart
class CookSmartTester {
  constructor() {
    this.baseURL = 'https://api.cooksmartapp.com';
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
    };
    this.authToken = null;
    this.testUser = {
      email: 'test@cooksmarttest.com',
      password: 'TestPassword123!',
      first_name: 'Test',
      last_name: 'User',
      age_verified: true,
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFunction) {
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFunction();
      this.testResults.passed++;
      this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.errors.push({test: name, error: error.message});
      this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async request(method, endpoint, data = null, requireAuth = false) {
    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (requireAuth && this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  }

  // ============================================
  // BACKEND API TESTS
  // ============================================

  async testHealthCheck() {
    const response = await this.request('GET', '/health');
    if (!response || response.status !== 'OK') {
      throw new Error('Health check failed');
    }
  }

  async testUserRegistration() {
    try {
      await this.request('POST', '/api/v1/auth/register', this.testUser);
    } catch (error) {
      // User might already exist, that's okay for testing
      if (!error.response?.data?.message?.includes('already exists')) {
        throw error;
      }
    }
  }

  async testUserLogin() {
    const response = await this.request('POST', '/api/v1/auth/login', {
      email: this.testUser.email,
      password: this.testUser.password,
    });

    if (!response.token) {
      throw new Error('No token received from login');
    }

    this.authToken = response.token;
  }

  async testUserProfile() {
    const response = await this.request('GET', '/api/v1/auth/me', null, true);
    if (!response.user || !response.user.email) {
      throw new Error('User profile not returned');
    }
  }

  async testRecipeSearch() {
    const response = await this.request(
      'GET',
      '/api/v1/recipes/search?ingredients=chicken',
      null,
      true,
    );
    if (!response.recipes || !Array.isArray(response.recipes)) {
      throw new Error('Recipe search did not return recipes array');
    }
  }

  async testRecipeDetails() {
    // First get a recipe from search
    const searchResponse = await this.request(
      'GET',
      '/api/v1/recipes/search?ingredients=chicken',
      null,
      true,
    );
    if (!searchResponse.recipes || searchResponse.recipes.length === 0) {
      throw new Error('No recipes found for details test');
    }

    const recipeId = searchResponse.recipes[0].id;
    const response = await this.request(
      'GET',
      `/api/v1/recipes/${recipeId}`,
      null,
      true,
    );

    if (!response.recipe || !response.recipe.id) {
      throw new Error('Recipe details not returned');
    }
  }

  async testTrendingRecipes() {
    const response = await this.request('GET', '/api/v1/recipes/trending');
    if (!response.recipes || !Array.isArray(response.recipes)) {
      throw new Error('Trending recipes not returned');
    }
  }

  async testSeasonalRecipes() {
    const response = await this.request('GET', '/api/v1/recipes/seasonal');
    if (!response.recipes || !Array.isArray(response.recipes)) {
      throw new Error('Seasonal recipes not returned');
    }
  }

  async testIngredients() {
    const response = await this.request(
      'GET',
      '/api/v1/ingredients',
      null,
      true,
    );
    if (!response.ingredients || !Array.isArray(response.ingredients)) {
      throw new Error('Ingredients not returned');
    }
  }

  async testBarcodeEndpoint() {
    // Test with a common barcode
    try {
      const _response = await this.request(
        'GET',
        '/api/v1/barcode/012000073502',
        null,
        true,
      );
      // This might fail if barcode not found, which is okay
    } catch (error) {
      // Barcode not found is acceptable
      if (!error.response?.status === 404) {
        throw error;
      }
    }
  }

  async testReferralSystem() {
    const response = await this.request('GET', '/api/v1/referrals', null, true);
    if (!response.referrals || !Array.isArray(response.referrals)) {
      throw new Error('Referrals not returned');
    }
  }

  async testReferralStats() {
    const response = await this.request(
      'GET',
      '/api/v1/referrals/stats',
      null,
      true,
    );
    if (typeof response.totalReferrals !== 'number') {
      throw new Error('Referral stats not returned');
    }
  }

  async testPointsSystem() {
    const response = await this.request('GET', '/api/v1/points', null, true);
    if (typeof response.points !== 'number') {
      throw new Error('Points not returned');
    }
  }

  async testShoppingList() {
    const response = await this.request(
      'GET',
      '/api/v1/shopping-list',
      null,
      true,
    );
    if (!response.items || !Array.isArray(response.items)) {
      throw new Error('Shopping list not returned');
    }
  }

  async testDietaryPreferences() {
    const _response = await this.request('GET', '/api/v1/dietary', null, true);
    // Response structure may vary, just check it doesn't error
  }

  async testFeedbackSubmission() {
    const feedbackData = {
      type: 'bug',
      message: 'Test feedback from automated test',
      email: this.testUser.email,
    };

    const _response = await this.request(
      'POST',
      '/api/v1/feedback',
      feedbackData,
    );
    if (!_response.success) {
      throw new Error('Feedback submission failed');
    }
  }

  // ============================================
  // RUN ALL BACKEND TESTS
  // ============================================

  async runBackendTests() {
    console.log('\n🔧 BACKEND API TESTING\n');

    await this.test('Health Check', () => this.testHealthCheck());
    await this.test('User Registration', () => this.testUserRegistration());
    await this.test('User Login', () => this.testUserLogin());
    await this.test('User Profile', () => this.testUserProfile());
    await this.test('Recipe Search', () => this.testRecipeSearch());
    await this.test('Recipe Details', () => this.testRecipeDetails());
    await this.test('Trending Recipes', () => this.testTrendingRecipes());
    await this.test('Seasonal Recipes', () => this.testSeasonalRecipes());
    await this.test('Ingredients API', () => this.testIngredients());
    await this.test('Barcode Lookup', () => this.testBarcodeEndpoint());
    await this.test('Referral System', () => this.testReferralSystem());
    await this.test('Referral Stats', () => this.testReferralStats());
    await this.test('Points System', () => this.testPointsSystem());
    await this.test('Shopping List', () => this.testShoppingList());
    await this.test('Dietary Preferences', () => this.testDietaryPreferences());
    await this.test('Feedback Submission', () => this.testFeedbackSubmission());
  }

  // ============================================
  // RESULTS SUMMARY
  // ============================================

  printResults() {
    console.log('\n📊 TEST RESULTS SUMMARY\n');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`,
    );

    if (this.testResults.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults.errors.forEach(error => {
        console.log(`   • ${error.test}: ${error.error}`);
      });
    }
  }
}

// Run the tests
async function runTests() {
  const tester = new CookSmartTester();

  try {
    await tester.runBackendTests();
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    tester.printResults();
  }
}

runTests();
