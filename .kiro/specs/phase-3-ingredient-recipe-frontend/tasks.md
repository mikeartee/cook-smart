# Phase 3: Core Ingredient & Recipe System (Frontend) - Implementation Tasks

## Task Execution Instructions

- Execute tasks in sequential order (dependencies are built in)
- Build each component, test it, then move to next task
- Mark task complete only after successful testing
- Each task builds on previous tasks - do not skip ahead
- Focus on MINIMAL implementations - avoid over-engineering

---

## 1. Setup Navigation and Project Structure

Set up the bottom tab navigation and create the folder structure for Phase 3 components.

- [ ] 1.1 Install navigation dependencies
  - Install `@react-navigation/bottom-tabs` package
  - Install `react-native-vector-icons` for tab icons
  - Link native dependencies if needed
  - _Requirements: 9.1, 9.2_

- [ ] 1.2 Create folder structure for new components
  - Create `src/screens/ingredients/` directory
  - Create `src/screens/recipes/` directory
  - Create `src/contexts/` directory (if not exists)
  - Create `src/services/` directory (if not exists)
  - Create `src/components/common/` directory for reusable components
  - _Requirements: All_

- [ ] 1.3 Create bottom tab navigator
  - Create `src/navigation/MainTabNavigator.tsx`
  - Set up bottom tab navigator with three tabs: Ingredients, Recipes, Saved Recipes
  - Add placeholder screens for each tab
  - Configure tab icons and labels
  - Add BETA badge to header
  - Update `App.tsx` to use MainTabNavigator instead of HomeScreen
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 11.1, 11.2_

---

## 2. Create Ingredient Service and Context

Build the service layer and context provider for ingredient management.

- [ ] 2.1 Create ingredient service
  - Create `src/services/ingredientService.ts`
  - Implement `getUserIngredients()` method calling GET /ingredients
  - Implement `addIngredient()` method calling POST /ingredients
  - Implement `updateIngredient()` method calling PUT /ingredients/{id}
  - Implement `deleteIngredient()` method calling DELETE /ingredients/{id}
  - Implement `searchIngredients()` method calling GET /ingredients/search
  - Add JWT token to Authorization header for all requests
  - Handle errors with user-friendly messages
  - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 2.2 Create IngredientContext
  - Create `src/contexts/IngredientContext.tsx`
  - Define IngredientContextType interface
  - Implement useState for ingredients array, isLoading, error
  - Implement `fetchIngredients()` function using ingredientService
  - Implement `addIngredient()` function with optimistic updates
  - Implement `updateIngredient()` function
  - Implement `deleteIngredient()` function with optimistic updates
  - Implement `searchIngredients()` function with debouncing
  - Provide context to app via IngredientProvider
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 2.3 Add IngredientProvider to App.tsx
  - Wrap app content with IngredientProvider
  - Ensure it's inside AuthProvider (needs auth context)
  - Test that context is accessible in child components
  - _Requirements: All ingredient requirements_

---

## 3. Build Ingredient Inventory Screen

Create the main ingredient inventory screen with list display and delete functionality.

- [ ] 3.1 Create IngredientCard component
  - Create `src/components/common/IngredientCard.tsx`
  - Display ingredient name and category
  - Add category icon based on ingredient category
  - Implement swipe-to-delete functionality
  - Style with consistent design (match existing app style)
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 3.2 Create IngredientInventoryScreen
  - Create `src/screens/ingredients/IngredientInventoryScreen.tsx`
  - Fetch ingredients on mount using IngredientContext
  - Group ingredients by category
  - Display grouped ingredients using SectionList
  - Show loading spinner while fetching
  - Show empty state message when no ingredients
  - Implement pull-to-refresh functionality
  - Add floating action button for "Add Ingredient"
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2_

- [ ] 3.3 Implement delete ingredient functionality
  - Add delete handler to IngredientCard swipe action
  - Call IngredientContext.deleteIngredient()
  - Show confirmation dialog before deleting
  - Display success/error toast message
  - Update UI immediately (optimistic update)
  - _Requirements: 1.3, 1.4, 10.1, 10.2_

- [ ] 3.4 Update MainTabNavigator with IngredientInventoryScreen
  - Replace placeholder screen with IngredientInventoryScreen
  - Test navigation to ingredient screen
  - Verify ingredients load correctly
  - _Requirements: 9.1, 9.2, 9.3_

---

## 4. Build Add Ingredient Screen

Create the screen for searching and adding ingredients.

- [ ] 4.1 Create SearchBar component
  - Create `src/components/common/SearchBar.tsx`
  - Implement text input with search icon
  - Add clear button when text is entered
  - Style consistently with app design
  - _Requirements: 2.1, 2.2_

- [ ] 4.2 Create AddIngredientScreen
  - Create `src/screens/ingredients/AddIngredientScreen.tsx`
  - Add SearchBar component at top
  - Implement debounced search (300ms delay)
  - Call IngredientContext.searchIngredients() on search
  - Display search results in FlatList
  - Show loading indicator during search
  - Show "No results" message when search returns empty
  - Add "Add Custom Ingredient" button at bottom of results
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2_

- [ ] 4.3 Implement ingredient selection from search
  - Add onPress handler to search result items
  - Call IngredientContext.addIngredient() with selected ingredient
  - Show success toast message
  - Navigate back to IngredientInventoryScreen
  - Verify new ingredient appears in inventory
  - _Requirements: 2.3, 2.4, 10.1, 10.2_

- [ ] 4.4 Create custom ingredient modal
  - Create modal component for custom ingredient form
  - Add text input for ingredient name
  - Add category picker (dropdown or radio buttons)
  - Add "Save" and "Cancel" buttons
  - Validate that name is not empty
  - Call IngredientContext.addIngredient() with is_custom=true
  - Close modal and show success message
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.1, 10.2_

- [ ] 4.5 Connect AddIngredientScreen to navigation
  - Add AddIngredientScreen to stack navigator
  - Navigate from IngredientInventoryScreen FAB to AddIngredientScreen
  - Test complete flow: navigate → search → add → return
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

---

## 5. Create Recipe Service and Context

Build the service layer and context provider for recipe management.

- [ ] 5.1 Set up recipe API integration
  - Sign up for Spoonacular API (free tier)
  - Store API key in `.env` file as RECIPE_API_KEY
  - Add API base URL to environment variables
  - Document API rate limits (150 requests/day)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.2 Create recipe service
  - Create `src/services/recipeService.ts`
  - Implement `searchRecipesByIngredients()` calling Spoonacular API
  - Implement `getRecipeDetails()` for full recipe information
  - Implement `getUserRecipes()` calling GET /recipes Lambda
  - Implement `saveRecipe()` calling POST /recipes Lambda
  - Implement `deleteRecipe()` calling DELETE /recipes/{id} Lambda
  - Transform Spoonacular API responses to internal Recipe type
  - Add JWT token to Authorization header for Lambda calls
  - Handle API errors and rate limiting
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 5.3 Create RecipeContext
  - Create `src/contexts/RecipeContext.tsx`
  - Define RecipeContextType interface
  - Implement useState for savedRecipes, searchResults, isLoading, error
  - Implement `fetchSavedRecipes()` function using recipeService
  - Implement `searchRecipes()` function with ingredient list parameter
  - Implement `saveRecipe()` function with offline storage
  - Implement `deleteRecipe()` function with optimistic updates
  - Implement `filterRecipes()` function for cooking time and difficulty
  - Provide context to app via RecipeProvider
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [ ] 5.4 Add RecipeProvider to App.tsx
  - Wrap app content with RecipeProvider
  - Ensure it's inside AuthProvider and IngredientProvider
  - Test that context is accessible in child components
  - _Requirements: All recipe requirements_

---

## 6. Build Recipe Search Screen

Create the screen for searching recipes based on available ingredients.

- [ ] 6.1 Create RecipeCard component
  - Create `src/components/common/RecipeCard.tsx`
  - Display recipe image, name, cooking time, difficulty
  - Add visual indicator for near-match recipes (yellow border)
  - Show missing ingredients count for near-matches
  - Style consistently with app design
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6.2 Create FilterChips component
  - Create `src/components/common/FilterChips.tsx`
  - Implement chip buttons for cooking time filters
  - Implement chip buttons for difficulty filters
  - Highlight selected filters
  - Allow multiple filter selection
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.3 Create RecipeSearchScreen
  - Create `src/screens/recipes/RecipeSearchScreen.tsx`
  - Add "Find Recipes" button at top
  - Add FilterChips component below button
  - Display recipe results in FlatList
  - Show loading spinner during search
  - Show empty state when no recipes found
  - Separate exact matches from near-matches in display
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2_

- [ ] 6.4 Implement recipe search functionality
  - Add onPress handler to "Find Recipes" button
  - Fetch user ingredients from IngredientContext
  - Call RecipeContext.searchRecipes() with ingredient list
  - Display results with exact matches first
  - Highlight near-match recipes with yellow border
  - Show missing ingredients for near-matches
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2_

- [ ] 6.5 Implement recipe filtering
  - Connect FilterChips to RecipeContext.filterRecipes()
  - Update displayed recipes when filters change
  - Show filtered count in UI
  - Allow clearing all filters
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 6.6 Update MainTabNavigator with RecipeSearchScreen
  - Replace placeholder screen with RecipeSearchScreen
  - Test navigation to recipe search screen
  - Verify recipe search works correctly
  - _Requirements: 9.1, 9.2, 9.3_

---

## 7. Build Recipe Detail Screen

Create the screen for displaying full recipe information.

- [ ] 7.1 Create RecipeDetailScreen
  - Create `src/screens/recipes/RecipeDetailScreen.tsx`
  - Display recipe image at top
  - Show recipe name, cooking time, difficulty, servings
  - Display ingredient list with quantities
  - Highlight missing ingredients in yellow (for near-matches)
  - Display step-by-step instructions
  - Add "Save Recipe" button at bottom
  - Make content scrollable
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7.2 Implement save recipe functionality
  - Add onPress handler to "Save Recipe" button
  - Call RecipeContext.saveRecipe() with recipe data
  - Store recipe in AsyncStorage for offline access
  - Show success toast message
  - Disable button if recipe already saved
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.1, 12.2_

- [ ] 7.3 Connect RecipeDetailScreen to navigation
  - Add RecipeDetailScreen to stack navigator
  - Navigate from RecipeCard onPress to RecipeDetailScreen
  - Pass recipe data via navigation params
  - Test navigation from search results to detail screen
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

---

## 8. Build Saved Recipes Screen

Create the screen for viewing and managing saved recipes.

- [ ] 8.1 Create SavedRecipesScreen
  - Create `src/screens/recipes/SavedRecipesScreen.tsx`
  - Fetch saved recipes on mount using RecipeContext
  - Display recipes in grid layout (2 columns)
  - Show loading spinner while fetching
  - Show empty state message when no saved recipes
  - Implement pull-to-refresh functionality
  - Add swipe-to-delete for each recipe
  - _Requirements: 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2_

- [ ] 8.2 Implement delete saved recipe functionality
  - Add delete handler to recipe card swipe action
  - Call RecipeContext.deleteRecipe()
  - Show confirmation dialog before deleting
  - Remove from AsyncStorage
  - Display success/error toast message
  - Update UI immediately (optimistic update)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 10.1, 10.2_

- [ ] 8.3 Implement navigation to recipe details
  - Add onPress handler to saved recipe cards
  - Navigate to RecipeDetailScreen with recipe data
  - Test navigation from saved recipes to detail screen
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.4 Update MainTabNavigator with SavedRecipesScreen
  - Replace placeholder screen with SavedRecipesScreen
  - Test navigation to saved recipes screen
  - Verify saved recipes load correctly
  - _Requirements: 9.1, 9.2, 9.3_

---

## 9. Implement Offline Support

Add offline functionality for saved recipes.

- [ ] 9.1 Implement offline storage for saved recipes
  - Store complete recipe data in AsyncStorage when saving
  - Use recipe ID as storage key
  - Store array of saved recipe IDs separately
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 9.2 Implement offline loading for saved recipes
  - Check network connectivity on app launch
  - Load saved recipes from AsyncStorage when offline
  - Display "Offline Mode" indicator in UI
  - Disable recipe search when offline
  - _Requirements: 12.2, 12.3, 12.4_

- [ ] 9.3 Implement sync logic for online/offline transitions
  - Detect when app comes back online
  - Sync local changes with Lambda backend
  - Fetch latest saved recipes from server
  - Resolve conflicts (server data wins)
  - Update AsyncStorage with server data
  - _Requirements: 12.4, 12.5_

---

## 10. Add Error Handling and Loading States

Implement comprehensive error handling and loading indicators.

- [ ] 10.1 Create LoadingSpinner component
  - Create `src/components/common/LoadingSpinner.tsx`
  - Display centered spinner with optional message
  - Style consistently with app design
  - _Requirements: 10.1, 10.2_

- [ ] 10.2 Create ErrorMessage component
  - Create `src/components/common/ErrorMessage.tsx`
  - Display error icon and message
  - Add "Retry" button
  - Style consistently with app design
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 10.3 Add loading states to all screens
  - Show LoadingSpinner while fetching ingredients
  - Show LoadingSpinner while searching recipes
  - Show LoadingSpinner while loading saved recipes
  - Disable buttons during loading
  - _Requirements: 10.1, 10.2_

- [ ] 10.4 Add error handling to all screens
  - Display ErrorMessage on API failures
  - Show network error message when offline
  - Provide retry functionality for failed requests
  - Log errors to console for debugging
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [ ] 10.5 Handle authentication errors
  - Detect 401 errors from Lambda endpoints
  - Clear expired JWT token
  - Redirect to login screen
  - Show "Session expired" message
  - _Requirements: 10.2, 10.3_

---

## 11. Polish UI and Add BETA Indicators

Refine the user interface and add BETA status displays.

- [ ] 11.1 Add BETA badge to header
  - Update MainTabNavigator header
  - Display "BETA" badge in top right
  - Style with green background
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 11.2 Style all screens consistently
  - Use consistent color scheme across app
  - Match existing LoginScreen and SignupScreen styles
  - Ensure proper spacing and padding
  - Add smooth transitions and animations
  - _Requirements: All_

- [ ] 11.3 Add empty state messages
  - Create helpful empty state for ingredient inventory
  - Create helpful empty state for recipe search
  - Create helpful empty state for saved recipes
  - Include call-to-action buttons in empty states
  - _Requirements: 1.5, 4.5, 7.5_

- [ ] 11.4 Add success/error toast notifications
  - Install toast notification library (react-native-toast-message)
  - Show success toast when ingredient added
  - Show success toast when recipe saved
  - Show error toast on API failures
  - Style toasts consistently
  - _Requirements: 10.2, 10.4, 10.5_

---

## 12. Integration Testing

Test complete user flows end-to-end.

- [ ] 12.1 Test ingredient management flow
  - Start with empty ingredient inventory
  - Add ingredient from search
  - Add custom ingredient
  - Verify ingredients appear in inventory
  - Delete ingredient
  - Verify ingredient removed from inventory
  - Test pull-to-refresh
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 12.2 Test recipe search flow
  - Add multiple ingredients to inventory
  - Navigate to recipe search screen
  - Tap "Find Recipes" button
  - Verify recipes are displayed
  - Verify exact matches shown first
  - Verify near-matches have yellow border
  - Apply cooking time filter
  - Apply difficulty filter
  - Verify filtered results
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.3 Test recipe detail and save flow
  - Tap on recipe from search results
  - Verify recipe details displayed correctly
  - Verify missing ingredients highlighted (if near-match)
  - Tap "Save Recipe" button
  - Verify success message shown
  - Navigate to saved recipes screen
  - Verify recipe appears in saved list
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 12.4 Test saved recipes flow
  - Navigate to saved recipes screen
  - Verify all saved recipes displayed
  - Tap on saved recipe
  - Verify recipe details shown
  - Swipe to delete recipe
  - Confirm deletion
  - Verify recipe removed from list
  - Test pull-to-refresh
  - _Requirements: 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12.5 Test offline functionality
  - Save multiple recipes while online
  - Turn off network connection
  - Navigate to saved recipes screen
  - Verify recipes load from AsyncStorage
  - Verify "Offline Mode" indicator shown
  - Verify recipe search disabled
  - Turn on network connection
  - Verify sync occurs automatically
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12.6 Test error scenarios
  - Test with expired JWT token
  - Test with no internet connection
  - Test with API rate limit exceeded
  - Test with invalid recipe API key
  - Verify error messages displayed
  - Verify retry functionality works
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12.7 Test navigation flow
  - Test all tab navigation
  - Test stack navigation to detail screens
  - Test back button functionality
  - Test deep linking (if applicable)
  - Verify navigation state persists
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## 13. Final Verification and Cleanup

Verify all requirements met and clean up code.

- [ ] 13.1 Run verification scan
  - Execute `node .kiro/verify-and-scan.js`
  - Fix any TypeScript errors
  - Fix any ESLint errors
  - Verify zero errors before proceeding
  - _Requirements: All_

- [ ] 13.2 Test on both iOS and Android
  - Test all features on iOS device/simulator
  - Test all features on Android device/emulator
  - Verify UI looks correct on both platforms
  - Fix any platform-specific issues
  - _Requirements: All_

- [ ] 13.3 Verify all Phase 3 requirements met
  - Review requirements.md
  - Confirm each requirement implemented
  - Test each requirement manually
  - Document any incomplete requirements
  - _Requirements: All_

- [ ] 13.4 Update project documentation
  - Update `.kiro/PHASE_2_PROGRESS.md` to mark Phase 2 complete
  - Create `.kiro/PHASE_3_PROGRESS.md` with completion status
  - Update `README.md` with Phase 3 features
  - Document any known issues or limitations
  - _Requirements: All_

- [ ] 13.5 Verify cost compliance
  - Confirm recipe API usage within free tier
  - Verify no additional AWS costs incurred
  - Document actual costs vs budget
  - Confirm total cost still under $20/month
  - _Requirements: All_
