/**
 * Frontend Component Testing Script
 * Verifies Phase 3 components are properly structured
 */

const fs = require('fs');
const path = require('path');

console.log('╔════════════════════════════════════════╗');
console.log('║  Phase 3 Frontend Component Tests     ║');
console.log('╚════════════════════════════════════════╝\n');

let passed = 0;
let failed = 0;

function testFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - File not found: ${filePath}`);
    failed++;
    return false;
  }
}

function testFileContains(filePath, searchString, description) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ ${description} - File not found`);
    failed++;
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes(searchString)) {
    console.log(`✅ ${description}`);
    passed++;
    return true;
  } else {
    console.log(`❌ ${description} - String not found: ${searchString}`);
    failed++;
    return false;
  }
}

console.log('📁 Test 1: File Structure');
console.log('──────────────────────────\n');

// Navigation
testFileExists('src/navigation/MainTabNavigator.tsx', 'MainTabNavigator exists');

// Services
testFileExists('src/services/ingredientService.ts', 'IngredientService exists');

// Contexts
testFileExists('src/contexts/IngredientContext.tsx', 'IngredientContext exists');

// Screens
testFileExists('src/screens/ingredients/IngredientInventoryScreen.tsx', 'IngredientInventoryScreen exists');
testFileExists('src/screens/ingredients/AddIngredientScreen.tsx', 'AddIngredientScreen exists');

// Components
testFileExists('src/components/common/IngredientCard.tsx', 'IngredientCard exists');
testFileExists('src/components/common/SearchBar.tsx', 'SearchBar exists');

console.log('\n🔍 Test 2: Component Integration');
console.log('─────────────────────────────────\n');

// Check App.tsx has IngredientProvider
testFileContains('src/App.tsx', 'IngredientProvider', 'App.tsx includes IngredientProvider');

// Check MainTabNavigator has IngredientsStack
testFileContains('src/navigation/MainTabNavigator.tsx', 'IngredientsStack', 'MainTabNavigator has IngredientsStack');
testFileContains('src/navigation/MainTabNavigator.tsx', 'AddIngredient', 'MainTabNavigator includes AddIngredient screen');

// Check IngredientInventoryScreen uses context
testFileContains('src/screens/ingredients/IngredientInventoryScreen.tsx', 'useIngredients', 'IngredientInventoryScreen uses useIngredients hook');
testFileContains('src/screens/ingredients/IngredientInventoryScreen.tsx', 'fetchIngredients', 'IngredientInventoryScreen fetches ingredients');

// Check AddIngredientScreen has search
testFileContains('src/screens/ingredients/AddIngredientScreen.tsx', 'SearchBar', 'AddIngredientScreen includes SearchBar');
testFileContains('src/screens/ingredients/AddIngredientScreen.tsx', 'searchIngredients', 'AddIngredientScreen has search functionality');

console.log('\n🎨 Test 3: UI Components');
console.log('─────────────────────────\n');

// Check IngredientCard has proper structure
testFileContains('src/components/common/IngredientCard.tsx', 'getCategoryIcon', 'IngredientCard has category icons');
testFileContains('src/components/common/IngredientCard.tsx', 'onDelete', 'IngredientCard has delete functionality');

// Check SearchBar has proper structure
testFileContains('src/components/common/SearchBar.tsx', 'TextInput', 'SearchBar has TextInput');
testFileContains('src/components/common/SearchBar.tsx', 'onClear', 'SearchBar has clear functionality');

console.log('\n🔧 Test 4: Service Layer');
console.log('─────────────────────────\n');

// Check ingredientService has all methods
testFileContains('src/services/ingredientService.ts', 'getUserIngredients', 'IngredientService has getUserIngredients');
testFileContains('src/services/ingredientService.ts', 'addIngredient', 'IngredientService has addIngredient');
testFileContains('src/services/ingredientService.ts', 'deleteIngredient', 'IngredientService has deleteIngredient');
testFileContains('src/services/ingredientService.ts', 'searchIngredients', 'IngredientService has searchIngredients');
testFileContains('src/services/ingredientService.ts', 'getAuthToken', 'IngredientService has authentication');

console.log('\n📦 Test 5: Context Provider');
console.log('───────────────────────────\n');

// Check IngredientContext has proper structure
testFileContains('src/contexts/IngredientContext.tsx', 'IngredientProvider', 'IngredientContext exports provider');
testFileContains('src/contexts/IngredientContext.tsx', 'useIngredients', 'IngredientContext exports hook');
testFileContains('src/contexts/IngredientContext.tsx', 'fetchIngredients', 'IngredientContext has fetchIngredients');
testFileContains('src/contexts/IngredientContext.tsx', 'isLoading', 'IngredientContext has loading state');
testFileContains('src/contexts/IngredientContext.tsx', 'error', 'IngredientContext has error state');

console.log('\n╔════════════════════════════════════════╗');
console.log('║  Test Results                          ║');
console.log('╚════════════════════════════════════════╝');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 ALL COMPONENT TESTS PASSED!');
  console.log('   Frontend structure is correct.');
} else {
  console.log('\n⚠️  Some component tests failed.');
  console.log('   Check the file structure and imports.');
}

process.exit(failed > 0 ? 1 : 0);
