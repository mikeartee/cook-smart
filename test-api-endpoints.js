/**
 * API Endpoint Testing Script
 * Tests Phase 3 ingredient management endpoints
 */

const API_BASE = 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: 'test@cooksmartapp.com',
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'User',
  age_verified: true
};

let authToken = null;
let testIngredientId = null;

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

// Test functions
async function testRegisterOrLogin() {
  console.log('\n📝 Test 1: Register/Login');
  console.log('─────────────────────────');
  
  // Try to register
  let result = await apiCall('/auth/register', 'POST', testUser);
  
  if (result.status === 201 || result.status === 200) {
    console.log('✅ Registration successful');
    authToken = result.data.token;
    return true;
  }
  
  // If user exists, try login
  if (result.status === 400 || result.status === 409) {
    console.log('ℹ️  User exists, trying login...');
    result = await apiCall('/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password
    });
    
    if (result.status === 200) {
      console.log('✅ Login successful');
      authToken = result.data.token;
      return true;
    }
  }
  
  console.log('❌ Authentication failed:', result.data);
  return false;
}

async function testGetIngredients() {
  console.log('\n📋 Test 2: Get User Ingredients');
  console.log('─────────────────────────────────');
  
  const result = await apiCall('/ingredients', 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Successfully fetched ingredients');
    console.log(`   Total: ${result.data.total || 0}`);
    console.log(`   Standard: ${result.data.ingredients?.length || 0}`);
    console.log(`   Custom: ${result.data.customIngredients?.length || 0}`);
    return true;
  }
  
  console.log('❌ Failed to fetch ingredients:', result.data);
  return false;
}

async function testSearchIngredients() {
  console.log('\n🔍 Test 3: Search Ingredients');
  console.log('──────────────────────────────');
  
  const result = await apiCall('/ingredients/search?q=chicken', 'GET', null, authToken);
  
  if (result.status === 200) {
    console.log('✅ Search successful');
    console.log(`   Results: ${result.data.ingredients?.length || 0}`);
    if (result.data.ingredients?.length > 0) {
      console.log(`   First result: ${result.data.ingredients[0].name}`);
    }
    return true;
  }
  
  console.log('❌ Search failed:', result.data);
  return false;
}

async function testAddIngredient() {
  console.log('\n➕ Test 4: Add Ingredient');
  console.log('──────────────────────────');
  
  const ingredient = {
    customName: 'Test Ingredient',
    category: 'Other',
    quantity: 1,
    unit: 'unit'
  };
  
  const result = await apiCall('/ingredients', 'POST', ingredient, authToken);
  
  if (result.status === 201 || result.status === 200) {
    console.log('✅ Ingredient added successfully');
    testIngredientId = result.data.ingredient?.id;
    console.log(`   ID: ${testIngredientId}`);
    return true;
  }
  
  console.log('❌ Failed to add ingredient:', result.data);
  return false;
}

async function testDeleteIngredient() {
  console.log('\n🗑️  Test 5: Delete Ingredient');
  console.log('──────────────────────────────');
  
  if (!testIngredientId) {
    console.log('⚠️  No ingredient ID to delete (skipping)');
    return true;
  }
  
  const result = await apiCall(`/ingredients/${testIngredientId}`, 'DELETE', null, authToken);
  
  if (result.status === 200 || result.status === 204) {
    console.log('✅ Ingredient deleted successfully');
    return true;
  }
  
  console.log('❌ Failed to delete ingredient:', result.data);
  return false;
}

// Run all tests
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  Phase 3 API Endpoint Testing         ║');
  console.log('╚════════════════════════════════════════╝');
  console.log('\n🎯 Testing against:', API_BASE);
  console.log('⏰ Started:', new Date().toLocaleTimeString());
  
  const tests = [
    testRegisterOrLogin,
    testGetIngredients,
    testSearchIngredients,
    testAddIngredient,
    testDeleteIngredient
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
      failed++;
    }
  }
  
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Test Results                          ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  console.log(`⏰ Finished: ${new Date().toLocaleTimeString()}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Phase 3 is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend is running:');
    console.log('   cd backend && serverless offline start');
  }
}

// Check if backend is running first
async function checkBackend() {
  console.log('🔍 Checking if backend is running...');
  try {
    await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    });
    console.log('✅ Backend is responding\n');
    return true;
  } catch (_error) {
    console.log('❌ Backend is not running!');
    console.log('\n📝 To start the backend:');
    console.log('   1. Open a new terminal');
    console.log('   2. Run: cd backend');
    console.log('   3. Run: serverless offline start');
    console.log('   4. Wait for "Server ready" message');
    console.log('   5. Run this test again\n');
    return false;
  }
}

// Main execution
(async () => {
  const backendRunning = await checkBackend();
  if (backendRunning) {
    await runTests();
  }
  process.exit(0);
})();
