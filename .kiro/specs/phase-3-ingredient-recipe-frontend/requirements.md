# Phase 3: Core Ingredient & Recipe System (Frontend) - Requirements Document

## Introduction

Phase 3 focuses on building the frontend user interface for the core Cook Smart functionality: ingredient inventory management and recipe generation. This phase connects the React Native frontend to the backend Lambda functions created in Phase 2, enabling users to manage their ingredients, search for recipes, and save favorites.

## Glossary

- **Cook Smart App**: The React Native mobile application for ingredient and recipe management
- **Ingredient Inventory**: User's collection of available ingredients stored in the database
- **Recipe API**: External service providing recipe data based on available ingredients
- **Lambda Backend**: AWS Lambda functions handling business logic and database operations
- **Custom Ingredient**: User-created ingredient not in the prepopulated database
- **Near-Match Recipe**: Recipe that can be made with most available ingredients, with missing items highlighted

## Requirements

### Requirement 1: Ingredient Inventory Screen

**User Story:** As a user, I want to view and manage my ingredient inventory, so that I can keep track of what I have available for cooking

#### Acceptance Criteria

1. WHEN the user navigates to the ingredient inventory screen, THE Cook Smart App SHALL display all saved ingredients from the user's inventory
2. WHEN the user views their ingredient inventory, THE Cook Smart App SHALL group ingredients by category (proteins, vegetables, fruits, grains, dairy, spices)
3. WHEN the user taps on an ingredient, THE Cook Smart App SHALL display options to edit or delete the ingredient
4. WHEN the user deletes an ingredient, THE Cook Smart App SHALL call the DELETE /ingredients/{id} Lambda endpoint and remove the ingredient from the display
5. WHEN the ingredient inventory is empty, THE Cook Smart App SHALL display a helpful message prompting the user to add ingredients

### Requirement 2: Add Ingredient Functionality

**User Story:** As a user, I want to add ingredients to my inventory using search and selection, so that I can quickly build my ingredient list

#### Acceptance Criteria

1. WHEN the user taps the "Add Ingredient" button, THE Cook Smart App SHALL display a search interface with autocomplete functionality
2. WHEN the user types in the search field, THE Cook Smart App SHALL call the GET /ingredients/search Lambda endpoint and display matching ingredients from the prepopulated database
3. WHEN the user selects an ingredient from search results, THE Cook Smart App SHALL call the POST /ingredients Lambda endpoint to add it to their inventory
4. WHEN an ingredient is successfully added, THE Cook Smart App SHALL update the ingredient inventory display immediately
5. WHERE the user cannot find an ingredient in search results, THE Cook Smart App SHALL provide an "Add Custom Ingredient" option

### Requirement 3: Custom Ingredient Creation

**User Story:** As a user, I want to add custom ingredients that aren't in the database, so that I can track all my available ingredients

#### Acceptance Criteria

1. WHEN the user selects "Add Custom Ingredient", THE Cook Smart App SHALL display a form with fields for ingredient name and category
2. WHEN the user submits the custom ingredient form, THE Cook Smart App SHALL validate that the name field is not empty
3. WHEN the custom ingredient form is valid, THE Cook Smart App SHALL call the POST /ingredients Lambda endpoint with is_custom=true
4. WHEN a custom ingredient is successfully created, THE Cook Smart App SHALL add it to the user's inventory and display it in the ingredient list
5. WHEN the user creates a custom ingredient, THE Cook Smart App SHALL save it for future selection in the search interface

### Requirement 4: Recipe Search Screen

**User Story:** As a user, I want to find recipes based on my available ingredients, so that I can cook meals with what I have

#### Acceptance Criteria

1. WHEN the user navigates to the recipe search screen, THE Cook Smart App SHALL display a "Find Recipes" button
2. WHEN the user taps "Find Recipes", THE Cook Smart App SHALL fetch the user's ingredient inventory from the GET /ingredients Lambda endpoint
3. WHEN the ingredient inventory is retrieved, THE Cook Smart App SHALL call the recipe API with the user's ingredients as parameters
4. WHEN recipe results are returned, THE Cook Smart App SHALL display exact match recipes first, followed by near-match recipes
5. WHERE a recipe is a near-match, THE Cook Smart App SHALL highlight missing ingredients in yellow

### Requirement 5: Recipe Display and Details

**User Story:** As a user, I want to view detailed recipe information, so that I can decide which recipe to cook

#### Acceptance Criteria

1. WHEN the user views recipe search results, THE Cook Smart App SHALL display recipe name, image, cooking time, and difficulty level for each recipe
2. WHEN the user taps on a recipe, THE Cook Smart App SHALL navigate to a recipe detail screen showing full instructions and ingredient list
3. WHEN the user views recipe details, THE Cook Smart App SHALL display all required ingredients with quantities
4. WHEN the user views recipe details, THE Cook Smart App SHALL display step-by-step cooking instructions
5. WHEN the user views a near-match recipe, THE Cook Smart App SHALL highlight missing ingredients in yellow within the ingredient list

### Requirement 6: Save Favorite Recipes

**User Story:** As a user, I want to save my favorite recipes, so that I can easily find and cook them again

#### Acceptance Criteria

1. WHEN the user views a recipe detail screen, THE Cook Smart App SHALL display a "Save Recipe" button
2. WHEN the user taps "Save Recipe", THE Cook Smart App SHALL call the POST /recipes Lambda endpoint with the recipe data
3. WHEN a recipe is successfully saved, THE Cook Smart App SHALL display a confirmation message
4. WHEN the user navigates to the saved recipes screen, THE Cook Smart App SHALL call the GET /recipes Lambda endpoint and display all saved recipes
5. WHEN the user taps on a saved recipe, THE Cook Smart App SHALL display the full recipe details

### Requirement 7: Delete Saved Recipes

**User Story:** As a user, I want to remove recipes from my saved collection, so that I can keep my recipe list organized

#### Acceptance Criteria

1. WHEN the user views their saved recipes, THE Cook Smart App SHALL display a delete option for each recipe
2. WHEN the user taps the delete option, THE Cook Smart App SHALL display a confirmation dialog
3. WHEN the user confirms deletion, THE Cook Smart App SHALL call the DELETE /recipes/{id} Lambda endpoint
4. WHEN a recipe is successfully deleted, THE Cook Smart App SHALL remove it from the saved recipes display
5. WHEN the saved recipes list is empty, THE Cook Smart App SHALL display a message prompting the user to search for and save recipes

### Requirement 8: Recipe Filtering

**User Story:** As a user, I want to filter recipes by cooking time and difficulty, so that I can find recipes that match my available time and skill level

#### Acceptance Criteria

1. WHEN the user views recipe search results, THE Cook Smart App SHALL display filter options for cooking time and difficulty level
2. WHEN the user selects a cooking time filter, THE Cook Smart App SHALL display only recipes matching the selected time range (Under 30min, 30-60min, 60+ min)
3. WHEN the user selects a difficulty filter, THE Cook Smart App SHALL display only recipes matching the selected difficulty (Easy, Medium, Hard)
4. WHEN the user applies multiple filters, THE Cook Smart App SHALL display recipes matching all selected criteria
5. WHEN the user clears filters, THE Cook Smart App SHALL display all available recipes again

### Requirement 9: Navigation and User Flow

**User Story:** As a user, I want intuitive navigation between screens, so that I can easily access all features

#### Acceptance Criteria

1. WHEN the user is authenticated, THE Cook Smart App SHALL display a bottom tab navigation with tabs for Ingredients, Recipes, and Saved Recipes
2. WHEN the user taps the Ingredients tab, THE Cook Smart App SHALL navigate to the ingredient inventory screen
3. WHEN the user taps the Recipes tab, THE Cook Smart App SHALL navigate to the recipe search screen
4. WHEN the user taps the Saved Recipes tab, THE Cook Smart App SHALL navigate to the saved recipes screen
5. WHEN the user is on any screen, THE Cook Smart App SHALL display the current tab as active in the navigation

### Requirement 10: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when actions are processing or errors occur, so that I understand what's happening

#### Acceptance Criteria

1. WHEN the app is fetching data from Lambda endpoints, THE Cook Smart App SHALL display a loading indicator
2. WHEN a Lambda endpoint call fails, THE Cook Smart App SHALL display a user-friendly error message
3. WHEN the user has no internet connection, THE Cook Smart App SHALL display a message indicating connectivity issues
4. WHEN an error occurs, THE Cook Smart App SHALL provide an option to retry the failed action
5. WHEN data is successfully loaded, THE Cook Smart App SHALL hide loading indicators and display the content

### Requirement 11: BETA Status Display

**User Story:** As a beta tester, I want to see clear BETA labeling, so that I understand the app is in development

#### Acceptance Criteria

1. WHEN the user views any screen in the app, THE Cook Smart App SHALL display "BETA" badge in the header
2. WHEN features are not yet implemented, THE Cook Smart App SHALL display "Under Development" markers
3. WHEN the user encounters a placeholder feature, THE Cook Smart App SHALL provide a message explaining it will be available in a future update
4. WHEN the app launches, THE Cook Smart App SHALL display the current version number in the settings or about section
5. WHEN the user provides feedback, THE Cook Smart App SHALL include the BETA version number in the feedback data

### Requirement 12: Offline Support for Saved Recipes

**User Story:** As a user, I want to access my saved recipes offline, so that I can cook even without internet connection

#### Acceptance Criteria

1. WHEN the user saves a recipe, THE Cook Smart App SHALL store the complete recipe data in local AsyncStorage
2. WHEN the user views saved recipes offline, THE Cook Smart App SHALL load recipes from local storage
3. WHEN the user is offline, THE Cook Smart App SHALL display a message indicating offline mode
4. WHEN the user regains internet connection, THE Cook Smart App SHALL sync any changes with the Lambda backend
5. WHEN offline data conflicts with server data, THE Cook Smart App SHALL prioritize server data and update local storage
