# Phase 3: Core Ingredient & Recipe System (Frontend) - Design Document

## Overview

Phase 3 implements the core user-facing functionality of Cook Smart by building React Native screens that connect to the Phase 2 Lambda backend. This phase delivers the primary value proposition: helping users find recipes based on their available ingredients.

The design follows React Native best practices with a component-based architecture, centralized state management, and clean separation between UI, business logic, and API communication.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
├─────────────────────────────────────────────────────────────┤
│  Navigation Layer (React Navigation)                         │
│  ├── Bottom Tab Navigator                                    │
│  │   ├── Ingredients Tab                                     │
│  │   ├── Recipes Tab                                         │
│  │   └── Saved Recipes Tab                                   │
│  └── Stack Navigator (for detail screens)                    │
├─────────────────────────────────────────────────────────────┤
│  Screen Layer                                                │
│  ├── IngredientInventoryScreen                              │
│  ├── AddIngredientScreen                                     │
│  ├── RecipeSearchScreen                                      │
│  ├── RecipeDetailScreen                                      │
│  └── SavedRecipesScreen                                      │
├─────────────────────────────────────────────────────────────┤
│  Context Layer (State Management)                            │
│  ├── AuthContext (existing)                                  │
│  ├── IngredientContext (new)                                 │
│  └── RecipeContext (new)                                     │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (API Communication)                           │
│  ├── authService.ts (existing)                               │
│  ├── ingredientService.ts (new)                              │
│  └── recipeService.ts (new)                                  │
├─────────────────────────────────────────────────────────────┤
│  Component Layer (Reusable UI)                               │
│  ├── IngredientCard                                          │
│  ├── RecipeCard                                              │
│  ├── SearchBar                                               │
│  ├── FilterChips                                             │
│  └── LoadingSpinner                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Lambda Backend (Phase 2)                    │
│  ├── GET /ingredients (getUserIngredients)                   │
│  ├── POST /ingredients (addIngredient)                       │
│  ├── PUT /ingredients/{id} (updateIngredient)                │
│  ├── DELETE /ingredients/{id} (deleteIngredient)             │
│  ├── GET /ingredients/search (searchIngredients)             │
│  ├── GET /recipes (getUserRecipes)                           │
│  ├── POST /recipes (saveRecipe)                              │
│  └── DELETE /recipes/{id} (deleteRecipe)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Recipe API                             │
│  (Spoonacular, Edamam, or similar)                           │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Navigation Structure

**Bottom Tab Navigator**
- Replaces the current simple HomeScreen with a tab-based navigation
- Three main tabs: Ingredients, Recipes, Saved Recipes
- Uses `@react-navigation/bottom-tabs`
- Displays BETA badge in header across all tabs

```typescript
// Navigation structure
<Tab.Navigator>
  <Tab.Screen name="Ingredients" component={IngredientInventoryScreen} />
  <Tab.Screen name="Recipes" component={RecipeSearchScreen} />
  <Tab.Screen name="SavedRecipes" component={SavedRecipesScreen} />
</Tab.Navigator>
```

### 2. Ingredient Management Components

#### IngredientInventoryScreen
- Displays user's ingredient inventory grouped by category
- Shows "Add Ingredient" floating action button
- Implements pull-to-refresh functionality
- Handles empty state with helpful messaging

**Key Features:**
- Fetches ingredients on mount using IngredientContext
- Groups ingredients by category (proteins, vegetables, fruits, grains, dairy, spices)
- Swipe-to-delete functionality for each ingredient
- Navigation to AddIngredientScreen

#### AddIngredientScreen
- Search interface with autocomplete
- Displays search results from prepopulated database
- "Add Custom Ingredient" option when no results found
- Modal-based custom ingredient form

**Key Features:**
- Debounced search input (300ms delay)
- Calls ingredientService.searchIngredients()
- Category selector for custom ingredients
- Immediate feedback on successful addition

#### IngredientCard Component
- Reusable card displaying ingredient name and category
- Swipe actions for edit/delete
- Category icon display
- Consistent styling across the app

### 3. Recipe Management Components

#### RecipeSearchScreen
- "Find Recipes" button to trigger search
- Filter chips for cooking time and difficulty
- Recipe results displayed in scrollable list
- Distinguishes exact matches from near-matches

**Key Features:**
- Fetches user ingredients before searching
- Calls external recipe API with ingredient list
- Displays loading state during API calls
- Highlights near-match recipes with yellow border
- Shows missing ingredients for near-matches

#### RecipeDetailScreen
- Full recipe information display
- Ingredient list with quantities
- Step-by-step instructions
- "Save Recipe" button
- Missing ingredients highlighted in yellow (for near-matches)

**Key Features:**
- Receives recipe data via navigation params
- Calls recipeService.saveRecipe() on save
- Displays recipe image, cooking time, difficulty
- Scrollable content for long recipes

#### SavedRecipesScreen
- Grid/list view of saved recipes
- Pull-to-refresh functionality
- Swipe-to-delete for each recipe
- Empty state messaging

**Key Features:**
- Fetches saved recipes on mount using RecipeContext
- Navigation to RecipeDetailScreen on tap
- Offline support via AsyncStorage
- Sync with backend when online

#### RecipeCard Component
- Reusable card for recipe display
- Shows recipe image, name, cooking time, difficulty
- Visual indicator for near-match recipes
- Consistent styling

### 4. Context Providers

#### IngredientContext
Manages ingredient inventory state across the app.

```typescript
interface IngredientContextType {
  ingredients: Ingredient[];
  isLoading: boolean;
  error: string | null;
  fetchIngredients: () => Promise<void>;
  addIngredient: (ingredient: CreateIngredientDto) => Promise<void>;
  updateIngredient: (id: number, updates: UpdateIngredientDto) => Promise<void>;
  deleteIngredient: (id: number) => Promise<void>;
  searchIngredients: (query: string) => Promise<Ingredient[]>;
}
```

**Responsibilities:**
- Maintains ingredients array in state
- Provides CRUD operations for ingredients
- Handles loading and error states
- Caches ingredients to reduce API calls

#### RecipeContext
Manages recipe state and interactions with recipe API.

```typescript
interface RecipeContextType {
  savedRecipes: Recipe[];
  searchResults: Recipe[];
  isLoading: boolean;
  error: string | null;
  fetchSavedRecipes: () => Promise<void>;
  searchRecipes: (ingredients: string[]) => Promise<void>;
  saveRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  filterRecipes: (filters: RecipeFilters) => Recipe[];
}
```

**Responsibilities:**
- Maintains saved recipes and search results
- Handles recipe API integration
- Provides filtering functionality
- Manages offline storage for saved recipes

### 5. Service Layer

#### ingredientService.ts
Handles all ingredient-related API calls to Lambda backend.

```typescript
class IngredientService {
  async getUserIngredients(): Promise<Ingredient[]>
  async addIngredient(data: CreateIngredientDto): Promise<Ingredient>
  async updateIngredient(id: number, data: UpdateIngredientDto): Promise<Ingredient>
  async deleteIngredient(id: number): Promise<void>
  async searchIngredients(query: string): Promise<Ingredient[]>
}
```

**Implementation Details:**
- Uses fetch API with JWT token from AsyncStorage
- Base URL from environment variable (API_BASE_URL)
- Error handling with user-friendly messages
- Request/response logging for debugging

#### recipeService.ts
Handles recipe API calls to both Lambda backend and external recipe API.

```typescript
class RecipeService {
  async getUserRecipes(): Promise<Recipe[]>
  async saveRecipe(recipe: Recipe): Promise<Recipe>
  async deleteRecipe(id: number): Promise<void>
  async searchRecipesByIngredients(ingredients: string[]): Promise<Recipe[]>
  async getRecipeDetails(recipeId: string): Promise<Recipe>
}
```

**Implementation Details:**
- Integrates with external recipe API (Spoonacular or Edamam)
- Stores API key in environment variable
- Transforms external API responses to internal Recipe type
- Handles rate limiting and API quotas
- Offline storage for saved recipes using AsyncStorage

## Data Models

### Ingredient Type

```typescript
interface Ingredient {
  id: number;
  user_id: number;
  ingredient_id?: number;  // null for custom ingredients
  name: string;
  category: IngredientCategory;
  is_custom: boolean;
  quantity?: string;
  expiration_date?: string;
  created_at: string;
  updated_at: string;
}

type IngredientCategory = 
  | 'proteins'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'dairy'
  | 'spices'
  | 'other';

interface CreateIngredientDto {
  name: string;
  category: IngredientCategory;
  is_custom: boolean;
  ingredient_id?: number;
  quantity?: string;
  expiration_date?: string;
}

interface UpdateIngredientDto {
  quantity?: string;
  expiration_date?: string;
}
```

### Recipe Type

```typescript
interface Recipe {
  id: number;  // Local database ID for saved recipes
  external_id: string;  // ID from external recipe API
  user_id: number;
  title: string;
  image_url: string;
  cooking_time: number;  // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard';
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  is_exact_match: boolean;
  missing_ingredients?: string[];
  recipe_data: any;  // Full JSON from external API
  created_at: string;
  updated_at: string;
}

interface RecipeIngredient {
  name: string;
  quantity: string;
  unit: string;
  is_missing?: boolean;  // For near-match recipes
}

interface RecipeFilters {
  cookingTime?: 'under30' | '30to60' | 'over60';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}
```

## Error Handling

### Error Types

1. **Network Errors**
   - No internet connection
   - API timeout
   - Server unavailable

2. **Authentication Errors**
   - Expired JWT token
   - Invalid token
   - Unauthorized access

3. **Validation Errors**
   - Empty ingredient name
   - Invalid category
   - Missing required fields

4. **API Errors**
   - Recipe API rate limit exceeded
   - Recipe API quota exhausted
   - Invalid API response

### Error Handling Strategy

**User-Facing Errors:**
- Display toast notifications for transient errors
- Show inline error messages for form validation
- Provide retry buttons for failed API calls
- Offer offline mode when network unavailable

**Error Recovery:**
- Automatic token refresh on 401 errors
- Retry logic for transient network failures (max 3 attempts)
- Fallback to cached data when API unavailable
- Graceful degradation for missing features

**Error Logging:**
- Log all errors to console in development
- Send critical errors to Discord webhook (future enhancement)
- Include error context (screen, action, user ID)

## Testing Strategy

### Unit Testing
- Test service layer functions (ingredientService, recipeService)
- Test context providers (IngredientContext, RecipeContext)
- Test utility functions (data transformations, filters)
- Mock API responses for predictable testing

### Component Testing
- Test individual components in isolation
- Verify correct rendering with different props
- Test user interactions (button clicks, swipes)
- Test loading and error states

### Integration Testing
- Test complete user flows (add ingredient → search recipes → save recipe)
- Test navigation between screens
- Test context provider integration with components
- Test offline/online mode transitions

### Manual Testing Checklist
- Test on iOS and Android devices
- Test with slow network conditions
- Test with no network (offline mode)
- Test with expired JWT token
- Test with empty ingredient inventory
- Test with no recipe results
- Test Co-Founder badge display

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Load recipe images on demand
   - Paginate recipe search results
   - Defer loading of saved recipes until tab is active

2. **Caching**
   - Cache ingredient search results (5-minute TTL)
   - Cache recipe search results (10-minute TTL)
   - Store saved recipes in AsyncStorage for offline access

3. **Debouncing**
   - Debounce ingredient search input (300ms)
   - Debounce filter changes (200ms)

4. **Memoization**
   - Memoize filtered recipe lists
   - Memoize grouped ingredient lists
   - Use React.memo for expensive components

5. **Image Optimization**
   - Use thumbnail images in list views
   - Load full-size images only in detail views
   - Implement image caching with react-native-fast-image

## Security Considerations

1. **JWT Token Management**
   - Store JWT in secure AsyncStorage
   - Include token in Authorization header for all API calls
   - Handle token expiration gracefully
   - Clear token on logout

2. **API Key Protection**
   - Store recipe API key in environment variables
   - Never expose API keys in client code
   - Use backend proxy for recipe API calls (future enhancement)

3. **Input Validation**
   - Sanitize user input for custom ingredients
   - Validate ingredient names (max length, allowed characters)
   - Prevent XSS attacks in recipe instructions

4. **Data Privacy**
   - Only fetch user's own ingredients and recipes
   - Verify user ID matches JWT token user ID
   - Implement proper authorization checks

## Accessibility

1. **Screen Reader Support**
   - Add accessibilityLabel to all interactive elements
   - Provide meaningful descriptions for images
   - Announce state changes (loading, errors)

2. **Touch Targets**
   - Minimum 44x44 pt touch targets for all buttons
   - Adequate spacing between interactive elements

3. **Color Contrast**
   - Ensure 4.5:1 contrast ratio for text
   - Don't rely solely on color for information (use icons + text)

4. **Font Scaling**
   - Support dynamic type/font scaling
   - Test with large text sizes

## BETA Status Display

1. **Visual Indicators**
   - Display "BETA" badge in header of all screens
   - Show version number in settings/about section
   - Add "Under Development" labels for incomplete features

2. **User Feedback**
   - Provide feedback button in header
   - Include BETA version in feedback submissions
   - Encourage users to report issues

## Offline Support

### Offline Capabilities

1. **Saved Recipes**
   - Store complete recipe data in AsyncStorage
   - Display saved recipes when offline
   - Show "Offline Mode" indicator

2. **Ingredient Inventory**
   - Cache ingredient list locally
   - Allow viewing ingredients offline
   - Queue changes for sync when online

3. **Sync Strategy**
   - Sync on app launch when online
   - Sync after network reconnection
   - Resolve conflicts (server data wins)

### Offline Limitations

- Cannot search for new recipes offline
- Cannot add ingredients from prepopulated database offline
- Cannot search ingredient database offline
- Can add custom ingredients offline (synced later)

## Implementation Phases

### Phase 3.1: Ingredient Management (Priority 1)
- Create IngredientContext
- Build ingredientService
- Implement IngredientInventoryScreen
- Implement AddIngredientScreen
- Add bottom tab navigation

### Phase 3.2: Recipe Search (Priority 1)
- Create RecipeContext
- Build recipeService
- Integrate external recipe API
- Implement RecipeSearchScreen
- Implement RecipeDetailScreen

### Phase 3.3: Saved Recipes (Priority 2)
- Implement SavedRecipesScreen
- Add offline storage for recipes
- Implement sync logic

### Phase 3.4: Filtering & Polish (Priority 2)
- Add recipe filtering functionality
- Implement loading states
- Add error handling
- Polish UI/UX

### Phase 3.5: Testing & Optimization (Priority 3)
- Write unit tests
- Perform integration testing
- Optimize performance
- Fix bugs

## External Dependencies

### Required Packages
- `@react-navigation/bottom-tabs` - Bottom tab navigation
- `react-native-fast-image` - Optimized image loading
- `react-native-vector-icons` - Icons for UI

### Recipe API Options

**Option 1: Spoonacular API (Recommended)**
- Free tier: 150 requests/day
- Comprehensive recipe data
- Good ingredient matching
- Cost: $0 (free tier sufficient for BETA)

**Option 2: Edamam Recipe API**
- Free tier: 10 requests/minute
- Good recipe database
- Nutrition data included
- Cost: $0 (free tier sufficient for BETA)

**Option 3: TheMealDB API**
- Completely free
- Limited recipe database
- No ingredient-based search
- Cost: $0 (fallback option)

**Recommendation:** Start with Spoonacular for BETA, implement fallback to Edamam if quota exceeded.

## Cost Analysis

### Phase 3 Costs
- Recipe API: $0 (free tier)
- No additional AWS costs (using existing Lambda/RDS)
- Total Phase 3 cost: $0

### Ongoing Costs
- Recipe API: $0 (free tier sufficient for 250 BETA users)
- Lambda: $0 (within free tier)
- RDS: ~$15/month (existing from Phase 2)
- Total: ~$15/month (within $20 budget)

## Design Decisions

### Why Bottom Tab Navigation?
- Standard mobile pattern for primary navigation
- Easy access to main features
- Clear visual indication of current section
- Better UX than hamburger menu

### Why Context API Instead of Redux?
- Simpler setup and less boilerplate
- Sufficient for app's state management needs
- Better performance for small to medium apps
- Easier to learn and maintain

### Why External Recipe API Instead of Building Own?
- Saves development time
- Access to thousands of recipes immediately
- Free tier sufficient for BETA
- Can migrate to own database later if needed

### Why AsyncStorage for Offline Support?
- Built-in React Native solution
- Simple key-value storage
- Sufficient for recipe data
- No additional dependencies

## Future Enhancements (Post-Phase 3)

1. **Barcode Scanning** (Phase 4)
   - Integrate barcode scanning library
   - Connect to Open Food Facts API
   - Auto-add ingredients from barcodes

2. **Dietary Restrictions** (Phase 5)
   - Add dietary preference settings
   - Filter recipes by restrictions
   - Highlight conflicting ingredients

3. **Shopping List** (Phase 6)
   - Add missing ingredients to shopping list
   - Organize by store sections
   - Share shopping lists

4. **Recipe Scaling** (Phase 7)
   - Adjust serving sizes
   - Recalculate ingredient quantities
   - Unit conversions

5. **Nutrition Information** (Phase 8)
   - Display calories and macros
   - Integrate USDA nutrition database
   - Track daily nutrition
