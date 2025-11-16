# Implementation Plan

- [x] 1. Create recipe provider interface and base infrastructure


  - Create IRecipeProvider interface defining searchByIngredients, getRecipeDetails, isAvailable, and getProviderName methods
  - Create RecipeProviderService orchestrator class with provider fallback logic
  - Add rate limit tracking functionality
  - Implement cache-first strategy in orchestrator
  - _Requirements: 2.1, 2.2, 4.1, 4.5_



- [ ] 2. Implement Edamam API service
  - [ ] 2.1 Register for Edamam API and obtain credentials
    - Sign up at https://developer.edamam.com/
    - Create application and get APP_ID and APP_KEY
    - Add EDAMAM_APP_ID and EDAMAM_APP_KEY to backend/.env


    - Document registration process
    - _Requirements: 1.4, 2.1_

  - [ ] 2.2 Create EdamamService class implementing IRecipeProvider
    - Implement searchByIngredients method with Edamam API v2 endpoint
    - Implement getRecipeDetails method (retrieve from cache)


    - Implement isAvailable method checking daily limit (333 calls)
    - Add API response mapping from Edamam format to unified Recipe model
    - Include nutrition data mapping
    - _Requirements: 2.1, 2.4, 3.1, 3.2_



  - [ ] 2.3 Write unit tests for EdamamService
    - Test API response mapping with sample Edamam responses
    - Test rate limit checking logic
    - Test error handling for API failures
    - _Requirements: 2.1, 2.5_



- [ ] 3. Implement TheMealDB API service
  - [ ] 3.1 Create TheMealDBService class implementing IRecipeProvider
    - Implement searchByIngredients with single ingredient search
    - Implement getRecipeDetails method with meal lookup endpoint
    - Implement ingredient extraction from meal object (strIngredient1-20)


    - Add API response mapping from TheMealDB format to unified Recipe model
    - Implement isAvailable method (always returns true - unlimited)
    - _Requirements: 2.1, 2.4, 3.1, 3.2_

  - [x] 3.2 Write unit tests for TheMealDBService


    - Test single ingredient search
    - Test recipe detail fetching
    - Test ingredient extraction logic
    - _Requirements: 2.1, 2.5_



- [ ] 4. Update backend routes and integrate new provider service
  - [ ] 4.1 Replace spoonacularService with RecipeProviderService in recipe routes
    - Update /api/v1/recipes/search endpoint to use RecipeProviderService
    - Update /api/v1/recipes/:id endpoint to use RecipeProviderService
    - Add provider name to API responses
    - Update error handling to use new error messages


    - _Requirements: 2.2, 2.3, 3.1, 3.2_

  - [ ] 4.2 Add API usage logging and monitoring
    - Create APIUsageLog model for tracking API calls


    - Log every API call with provider, timestamp, success status, and cache hit
    - Implement usage statistics endpoint
    - Add warning logs when reaching 80% of daily limit
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 4.3 Write integration tests for recipe routes


    - Test recipe search with multiple ingredients
    - Test recipe details retrieval
    - Test cache behavior
    - Test provider fallback scenarios
    - _Requirements: 3.1, 3.2, 3.3, 3.4_


- [ ] 5. Update frontend to handle new API responses
  - [ ] 5.1 Update RecipeContext to handle provider information
    - Add provider field to recipe state
    - Handle new error messages from backend
    - Update loading states

    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 5.2 Update recipe screens with beta labels and status messages
    - Add "Beta - Recipe Database" label to RecipeSearchScreen
    - Display cache status when showing cached results
    - Show user-friendly messages for API limits

    - Add provider attribution in recipe details
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 6. Testing and validation
  - [ ] 6.1 Test Edamam API integration with real credentials
    - Verify recipe search returns results
    - Verify recipe details are complete


    - Test with 1, 3, and 5+ ingredients
    - Verify nutrition data is included
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 6.2 Test TheMealDB fallback functionality
    - Mock Edamam rate limit exceeded


    - Verify TheMealDB is used as fallback
    - Test recipe search and details
    - Verify unlimited availability
    - _Requirements: 2.1, 2.2, 2.3_




  - [ ] 6.3 Verify caching behavior across providers
    - Test cache hit returns data without API call
    - Test cache miss triggers API call
    - Verify 30-day cache duration
    - Check cache statistics are accurate
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 6.4 Test error handling and user messaging
    - Test network error scenarios
    - Test API limit reached scenarios
    - Verify user-friendly error messages
    - Test fallback to cache when all providers fail
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 2.5_

- [ ] 7. Documentation and cleanup
  - [ ] 7.1 Update API setup documentation
    - Rename SPOONACULAR_API_SETUP.md to RECIPE_API_SETUP.md
    - Document Edamam registration process
    - Add TheMealDB information
    - Create API comparison matrix
    - Update environment variable documentation
    - _Requirements: 1.2, 1.3_

  - [ ] 7.2 Archive Spoonacular service
    - Move spoonacularService.ts to deprecated folder
    - Remove SPOONACULAR_API_KEY from .env.example
    - Update backend README
    - Remove Spoonacular references from documentation
    - _Requirements: 1.5_

  - [ ] 7.3 Update deployment checklist
    - Add Edamam API key setup steps
    - Update environment variable checklist
    - Document API usage monitoring
    - Add troubleshooting section
    - _Requirements: 1.2, 5.4_
