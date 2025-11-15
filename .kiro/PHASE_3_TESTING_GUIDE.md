# Phase 3 Testing Guide - Ingredient Management

## What We Built

✅ **Complete Ingredient Management System**
- Bottom tab navigation with BETA badge
- Ingredient inventory screen (view, delete, refresh)
- Add ingredient screen (search & custom)
- Full API integration with Lambda backend
- Optimistic updates and error handling

## Pre-Testing Checklist

### ✅ Code Quality
- TypeScript errors: **0**
- ESLint errors: **0**
- Build status: **PASSED**

### Backend Requirements
- PostgreSQL database running on AWS RDS
- Lambda functions deployed OR serverless-offline running locally
- Environment variables configured

## Testing Steps

### Option 1: Test with Serverless Offline (Recommended for Development)

#### 1. Start the Backend Locally

```bash
cd backend
npm install  # If not already done
serverless offline start
```

This will start the Lambda functions locally at `http://localhost:3000`

**Expected Output:**
```
Starting Offline at stage dev (us-east-1)

Offline [http for lambda] listening on http://localhost:3002
Function names exposed for local invocation by aws-sdk:
           * register: cook-smart-api-dev-register
           * login: cook-smart-api-dev-login
           * me: cook-smart-api-dev-me
           * getUserIngredients: cook-smart-api-dev-getUserIngredients
           * addIngredient: cook-smart-api-dev-addIngredient
           * updateIngredient: cook-smart-api-dev-updateIngredient
           * deleteIngredient: cook-smart-api-dev-deleteIngredient
           * searchIngredients: cook-smart-api-dev-searchIngredients

   ┌─────────────────────────────────────────────────────────────────────────┐
   │                                                                         │
   │   POST | http://localhost:3000/auth/register                           │
   │   POST | http://localhost:3000/auth/login                              │
   │   GET  | http://localhost:3000/auth/me                                 │
   │   GET  | http://localhost:3000/ingredients                             │
   │   POST | http://localhost:3000/ingredients                             │
   │   PUT  | http://localhost:3000/ingredients/{id}                        │
   │   DELETE | http://localhost:3000/ingredients/{id}                      │
   │   GET  | http://localhost:3000/ingredients/search                      │
   │                                                                         │
   └─────────────────────────────────────────────────────────────────────────┘

Server ready: http://localhost:3000 🚀
```

#### 2. Verify Database Connection

Make sure your `.env` file in the backend directory has:
```
DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/cooksmartdb
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

#### 3. Run Database Migrations (if not done)

```bash
cd backend
npm run migrate:up
```

#### 4. Start the React Native App

In a **new terminal**:

```bash
# For iOS
npm run ios

# For Android
npm run android

# Or start Metro bundler separately
npm start
```

### Option 2: Test with Deployed Lambda Functions

If your Lambda functions are already deployed to AWS:

1. Update `src/services/authService.ts` and `src/services/ingredientService.ts`
2. Change `API_BASE_URL` to your API Gateway endpoint
3. Start the React Native app

## Test Scenarios

### Test 1: User Registration & Login ✅ (Already Working from Phase 2)

1. **Register a new user**
   - Open the app
   - Tap "Sign Up"
   - Enter email, password, name
   - Tap "Create Account"
   - ✅ Should see success and navigate to main app

2. **Login**
   - Enter credentials
   - Tap "Login"
   - ✅ Should see main app with bottom tabs

### Test 2: View Ingredient Inventory (NEW)

1. **Navigate to Ingredients Tab**
   - Should be the first tab (already selected)
   - ✅ Should see "No Ingredients Yet" empty state
   - ✅ Should see green FAB button (+) at bottom right
   - ✅ Should see BETA badge in header
   - ✅ Co-founder should see crown badge

2. **Pull to Refresh**
   - Pull down on the screen
   - ✅ Should show loading indicator
   - ✅ Should refresh ingredient list

### Test 3: Add Ingredient from Search (NEW)

1. **Open Add Ingredient Screen**
   - Tap the green FAB button (+)
   - ✅ Should navigate to "Add Ingredient" screen
   - ✅ Should see search bar at top
   - ✅ Should see "Search for Ingredients" message

2. **Search for Ingredient**
   - Type "chicken" in search bar
   - Wait 300ms (debounce)
   - ✅ Should show "Searching..." loading state
   - ✅ Should display search results from database
   - ✅ Each result should show name and category

3. **Select Ingredient**
   - Tap on a search result (e.g., "Chicken Breast")
   - ✅ Should show "Success" alert
   - ✅ Should navigate back to inventory
   - ✅ Should see ingredient in the list
   - ✅ Ingredient should be grouped under correct category

4. **Search with No Results**
   - Type "xyz123notfound"
   - ✅ Should show "No Results Found" message
   - ✅ Should suggest adding custom ingredient

### Test 4: Add Custom Ingredient (NEW)

1. **Open Custom Ingredient Modal**
   - From Add Ingredient screen
   - Tap "Add Custom Ingredient" button at bottom
   - ✅ Should show modal from bottom

2. **Fill Custom Ingredient Form**
   - Enter name: "Organic Honey"
   - Select category: "Other" (or any category)
   - Enter quantity: "1"
   - Enter unit: "jar"
   - Tap "Add Ingredient"
   - ✅ Should show "Success" alert
   - ✅ Should close modal
   - ✅ Should navigate back to inventory
   - ✅ Should see custom ingredient in list

3. **Validation**
   - Try to add without name
   - ✅ Should show error alert

### Test 5: Delete Ingredient (NEW)

1. **Delete from Inventory**
   - Swipe or tap delete icon on an ingredient
   - ✅ Should show confirmation dialog
   - Tap "Cancel"
   - ✅ Ingredient should remain

2. **Confirm Delete**
   - Tap delete again
   - Tap "Delete" in confirmation
   - ✅ Ingredient should disappear immediately (optimistic update)
   - ✅ Should show success

### Test 6: Grouped Display (NEW)

1. **Add Multiple Ingredients**
   - Add ingredients from different categories:
     - Chicken (Proteins)
     - Tomato (Vegetables)
     - Apple (Fruits)
     - Rice (Grains)

2. **Verify Grouping**
   - ✅ Should see section headers for each category
   - ✅ Categories should be alphabetically sorted
   - ✅ Ingredients should be under correct category
   - ✅ Each category should have green uppercase label

### Test 7: Navigation Flow (NEW)

1. **Tab Navigation**
   - Tap "Recipes" tab
   - ✅ Should see "Coming soon..." placeholder
   - Tap "Saved" tab
   - ✅ Should see "Coming soon..." placeholder
   - Tap "Ingredients" tab
   - ✅ Should return to ingredient inventory

2. **Back Navigation**
   - From Ingredients tab, tap FAB
   - ✅ Should go to Add Ingredient screen
   - Tap back arrow
   - ✅ Should return to inventory
   - ✅ Tab should still be selected

### Test 8: Error Handling (NEW)

1. **Network Error**
   - Turn off backend server
   - Try to add ingredient
   - ✅ Should show error alert
   - ✅ Should not crash

2. **Invalid Token**
   - (Advanced) Manually corrupt token in AsyncStorage
   - Try to fetch ingredients
   - ✅ Should show error
   - ✅ Should handle gracefully

## Expected Backend API Calls

When testing, you should see these API calls in the backend logs:

### Registration/Login
```
POST /auth/register
POST /auth/login
GET /auth/me
```

### Ingredient Operations
```
GET /ingredients                    # Fetch user's ingredients
GET /ingredients/search?q=chicken   # Search ingredients
POST /ingredients                   # Add ingredient
DELETE /ingredients/{id}            # Delete ingredient
```

## Troubleshooting

### Issue: "No authentication token" error
**Solution:** Make sure you're logged in. Token should be stored in AsyncStorage.

### Issue: "Failed to fetch ingredients"
**Solution:** 
- Check backend is running
- Verify DATABASE_URL is correct
- Check database has ingredients table
- Run migrations if needed

### Issue: Search returns no results
**Solution:**
- Check if ingredients table has data
- You may need to seed the database with common ingredients
- For now, use "Add Custom Ingredient" feature

### Issue: App crashes on ingredient screen
**Solution:**
- Check console for errors
- Verify IngredientContext is properly wrapped in App.tsx
- Check all imports are correct

### Issue: Navigation doesn't work
**Solution:**
- Verify Stack.Navigator is set up in MainTabNavigator
- Check navigation.navigate() calls use correct screen names
- Restart Metro bundler

## Success Criteria

✅ **Phase 3 Ingredient Management is working if:**

1. User can view ingredient inventory (empty or populated)
2. User can search for ingredients
3. User can add ingredients from search results
4. User can create custom ingredients
5. User can delete ingredients with confirmation
6. Ingredients are grouped by category
7. Pull-to-refresh works
8. Navigation between screens works smoothly
9. No crashes or errors
10. ZERO TypeScript/ESLint errors in code

## Next Steps After Testing

Once testing is complete:

1. **If everything works:** Ready to continue with Recipe functionality (Tasks 5-7)
2. **If issues found:** Document them and we'll fix before proceeding
3. **Optional:** Seed database with common ingredients for better testing

## Database Seeding (Optional)

If you want to test search with real data, you can seed common ingredients:

```sql
INSERT INTO ingredients (name, category) VALUES
  ('Chicken Breast', 'Proteins'),
  ('Ground Beef', 'Proteins'),
  ('Salmon', 'Proteins'),
  ('Eggs', 'Proteins'),
  ('Tomato', 'Vegetables'),
  ('Onion', 'Vegetables'),
  ('Garlic', 'Vegetables'),
  ('Carrot', 'Vegetables'),
  ('Apple', 'Fruits'),
  ('Banana', 'Fruits'),
  ('Orange', 'Fruits'),
  ('Rice', 'Grains'),
  ('Pasta', 'Grains'),
  ('Bread', 'Grains'),
  ('Milk', 'Dairy'),
  ('Cheese', 'Dairy'),
  ('Butter', 'Dairy'),
  ('Salt', 'Spices'),
  ('Pepper', 'Spices'),
  ('Olive Oil', 'Other');
```

---

**Ready to test!** Start with the backend, then launch the app and follow the test scenarios above.
