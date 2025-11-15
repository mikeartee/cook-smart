# Phase 2: Authentication & Database - Implementation Tasks

## Task Execution Instructions

- Execute tasks in sequential order (dependencies are built in)
- Build each component, test it, then clean up test files
- Mark task complete only after successful testing
- Document any new patterns in fixes-log.md
- Each task builds on previous tasks - do not skip ahead

---

## 1. Database Migration System Setup

Set up the migration infrastructure that will manage all database schema changes.

- [ ] 1.1 Install and configure node-pg-migrate package
  - Install `node-pg-migrate` and `pg` packages in backend
  - Create `backend/migrations/` directory
  - Add migration scripts to package.json: `migrate:up`, `migrate:down`, `migrate:create`
  - Configure database connection string in `.env` file
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Create initial users table migration
  - Generate migration file: `npm run migrate:create create-users-table`
  - Write `up` function to create users table with all columns
  - Write `down` function to drop users table
  - Include indexes on email and is_co_founder columns
  - Test migration: run up, verify table exists, run down, verify table dropped
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 1.3 Create ingredients tables migration
  - Generate migration: `npm run migrate:create create-ingredients-tables`
  - Create ingredients table with name, category, is_common columns
  - Create ingredient_synonyms table with foreign key to ingredients
  - Include appropriate indexes
  - Test migration up and down
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 1.4 Create user ingredients tables migration
  - Generate migration: `npm run migrate:create create-user-ingredients-tables`
  - Create user_ingredients table with foreign keys to users and ingredients
  - Create custom_ingredients table for user-created ingredients
  - Include unique constraint on (user_id, ingredient_id) in user_ingredients
  - Test migration up and down
  - _Requirements: 7.4, 7.5_

- [ ] 1.5 Create user data tables migration
  - Generate migration: `npm run migrate:create create-user-data-tables`
  - Create user_recipes table for favorites (with JSONB column)
  - Create shopping_lists table
  - Create user_points table
  - Create referrals table with referral_code unique constraint
  - Test migration up and down
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 1.6 Run all migrations and verify database schema
  - Execute `npm run migrate:up` to apply all migrations
  - Connect to PostgreSQL and verify all tables exist
  - Verify all indexes are created
  - Verify foreign key constraints are in place
  - Document any issues in fixes-log.md
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

---

## 2. Serverless Framework Setup

Set up AWS Lambda deployment infrastructure using Serverless Framework.

- [ ] 2.1 Install and configure Serverless Framework
  - Install `serverless` globally: `npm install -g serverless`
  - Install in backend: `npm install --save-dev serverless serverless-offline`
  - Create `backend/serverless.yml` configuration file
  - Configure AWS provider, region (us-east-1), runtime (nodejs18.x)
  - Add environment variables: DATABASE_URL, JWT_SECRET
  - Test configuration: `serverless print`
  - _Requirements: 1.1, 1.2_

- [ ] 2.2 Create shared database connection module
  - Create `backend/functions/shared/db.ts`
  - Implement connection pooling with pg library
  - Use single connection per Lambda instance (max: 1)
  - Export `getPool()` function for reuse across functions
  - Test connection with simple query
  - _Requirements: 1.1, 1.3_

- [ ] 2.3 Create shared utilities module
  - Create `backend/functions/shared/utils/passwordUtils.ts`
  - Install `bcrypt` package
  - Implement `hashPassword()` function using bcrypt with 10 salt rounds
  - Implement `comparePassword()` function to verify passwords
  - Test both functions with sample passwords
  - _Requirements: 2.3, 3.3, 4.2_

- [ ] 2.4 Create JWT utilities module
  - Create `backend/functions/shared/utils/jwtUtils.ts`
  - Install `jsonwebtoken` package
  - Implement `generateToken()` function with 7-day expiration
  - Implement `verifyToken()` function to decode and validate tokens
  - Include userId, email, isCoFounder in JWT payload
  - Store JWT_SECRET in `.env` file
  - Test token generation and verification
  - _Requirements: 4.1, 4.3, 4.4, 4.5_

- [ ] 2.5 Create User model for database operations
  - Create `backend/functions/shared/models/User.ts`
  - Implement `create()` method to insert new user
  - Implement `findByEmail()` method to query by email
  - Implement `findById()` method to query by ID
  - Use pool.query() pattern from fixes-log.md
  - Test with mocked database, verify queries are correct
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2.6 Create AuthService with business logic
  - Create `backend/functions/shared/services/AuthService.ts`
  - Implement `register()` method with email validation
  - Check if email already exists (return error if so)
  - Validate password length (min 8 chars)
  - Detect Co-Founder email (brianaolszewski1@gmail.com)
  - Hash password before storing
  - Set is_co_founder=true and subscription_status='lifetime' for Co-Founder
  - Generate and return JWT token
  - Implement `login()` method with password verification
  - Test both methods with mocked User model
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3_

---

## 3. Lambda Functions for Authentication

Create Lambda function handlers for authentication endpoints.

- [ ] 3.1 Create registration Lambda function
  - Create `backend/functions/auth/register.ts`
  - Implement handler function with APIGatewayProxyHandler type
  - Parse request body (email, password, firstName, lastName)
  - Call AuthService.register()
  - Return 200 with user data and JWT token
  - Handle errors (duplicate email, validation failures)
  - Add function to serverless.yml with POST /auth/register endpoint
  - Test locally with `serverless invoke local -f register`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3.2 Create login Lambda function
  - Create `backend/functions/auth/login.ts`
  - Implement handler function
  - Parse request body (email, password)
  - Call AuthService.login()
  - Return 200 with user data and JWT token
  - Handle authentication errors (401 for invalid credentials)
  - Add function to serverless.yml with POST /auth/login endpoint
  - Test locally with valid and invalid credentials
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3.3 Create "get current user" Lambda function
  - Create `backend/functions/auth/me.ts`
  - Implement handler function
  - Extract JWT token from Authorization header
  - Verify token using jwtUtils
  - Fetch user by ID from token payload
  - Return user data (exclude password hash)
  - Return 401 for invalid/missing tokens
  - Add function to serverless.yml with GET /auth/me endpoint
  - Test with valid and invalid tokens
  - _Requirements: 5.1, 4.4, 4.5, 10.2, 10.3_

---

## 4. Lambda Functions for User Profile

Implement user profile viewing and updating functionality.

- [ ] 4.1 Create UserService for profile operations
  - Create `backend/functions/shared/services/UserService.ts`
  - Implement `getProfile()` method to fetch user by ID
  - Implement `updateProfile()` method to update firstName/lastName
  - Implement `changePassword()` method with current password verification
  - Prevent modification of email, is_co_founder, subscription fields
  - Test all methods with mocked User model
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.2 Create get profile Lambda function
  - Create `backend/functions/users/getProfile.ts`
  - Extract and verify JWT token from Authorization header
  - Call UserService.getProfile() with user ID from token
  - Return user data (exclude password hash)
  - Return 401 for invalid tokens
  - Add function to serverless.yml with GET /users/profile endpoint
  - Test with valid token
  - _Requirements: 5.1_

- [ ] 4.3 Create update profile Lambda function
  - Create `backend/functions/users/updateProfile.ts`
  - Extract and verify JWT token
  - Parse request body (firstName, lastName)
  - Call UserService.updateProfile()
  - Return updated user data
  - Validate input data
  - Add function to serverless.yml with PUT /users/profile endpoint
  - Test profile updates
  - _Requirements: 5.2, 5.3_

- [ ] 4.4 Create change password Lambda function
  - Create `backend/functions/users/changePassword.ts`
  - Extract and verify JWT token
  - Parse request body (currentPassword, newPassword)
  - Call UserService.changePassword()
  - Return success message
  - Handle incorrect current password error
  - Add function to serverless.yml with PUT /users/password endpoint
  - Test password change flow
  - _Requirements: 5.3_

---

## 5. Lambda Functions for GDPR Compliance

Implement data export and account deletion for GDPR compliance.

- [ ] 5.1 Create data export Lambda function
  - Add `exportUserData()` method to UserService
  - Gather all user data: profile, ingredients, recipes, shopping lists, points
  - Format as JSON with clear structure
  - Create `backend/functions/users/exportData.ts`
  - Extract and verify JWT token
  - Call UserService.exportUserData()
  - Return complete user data as JSON
  - Add function to serverless.yml with GET /users/export endpoint
  - Test export returns complete user data
  - _Requirements: 6.1, 6.5_

- [ ] 5.2 Create account deletion Lambda function
  - Add `deleteAccount()` method to UserService
  - Delete user record (cascades to related tables via foreign keys)
  - Anonymize referral records (set referred_user_id to NULL)
  - Log deletion request with timestamp
  - Create `backend/functions/users/deleteAccount.ts`
  - Extract and verify JWT token
  - Call UserService.deleteAccount()
  - Return success message
  - Add function to serverless.yml with DELETE /users/account endpoint
  - Test deletion removes user and related data
  - Verify referral records are anonymized, not deleted
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

---

## 6. Deploy and Test Lambda Backend

Deploy the Lambda functions to AWS and verify they work.

- [ ] 6.1 Deploy Lambda functions to AWS
  - Configure AWS credentials: `aws configure`
  - Deploy with Serverless Framework: `serverless deploy`
  - Note the API Gateway endpoint URL
  - Verify all functions deployed successfully
  - Check AWS Lambda console to confirm functions exist
  - _Requirements: 1.1, 1.2_

- [ ] 6.2 Test deployed endpoints
  - Test POST /auth/register with curl or Postman
  - Test POST /auth/login with valid credentials
  - Test GET /auth/me with JWT token
  - Test GET /users/profile with JWT token
  - Test PUT /users/profile with updates
  - Test PUT /users/password with password change
  - Test GET /users/export for data export
  - Test DELETE /users/account for account deletion
  - Document API Gateway base URL for frontend
  - _Requirements: All authentication and user requirements_

- [ ] 6.3 Configure environment variables
  - Set DATABASE_URL in AWS Lambda environment
  - Set JWT_SECRET in AWS Lambda environment
  - Verify functions can connect to RDS database
  - Test that environment variables are loaded correctly
  - _Requirements: 1.1, 1.2, 1.4_

---

## 7. Frontend Authentication Context

Build the React Native authentication state management.

- [ ] 7.1 Create AuthContext with state management
  - Create or update `src/contexts/AuthContext.tsx`
  - Define AuthContextType interface
  - Implement useState for user, token, isLoading
  - Implement useEffect to load token from AsyncStorage on mount
  - Provide context to app via AuthProvider
  - _Requirements: 9.2, 9.3, 10.5_

- [ ] 7.2 Implement login function in AuthContext
  - Add `login()` function to AuthContext
  - Call POST /auth/login endpoint (API Gateway URL)
  - Store JWT token in AsyncStorage
  - Update user and token state
  - Handle errors and display messages
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 7.3 Implement register function in AuthContext
  - Add `register()` function to AuthContext
  - Call POST /auth/register endpoint (API Gateway URL)
  - Store JWT token in AsyncStorage
  - Update user and token state
  - Handle errors and display messages
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 7.4 Implement logout function in AuthContext
  - Add `logout()` function to AuthContext
  - Clear JWT token from AsyncStorage
  - Reset user and token state to null
  - Redirect to login screen
  - _Requirements: 9.3_

- [ ] 7.5 Implement token verification on app startup
  - In useEffect, check if token exists in AsyncStorage
  - If token exists, call GET /auth/me to verify
  - If valid, set user and token state
  - If invalid, clear token and show login screen
  - Handle token expiration gracefully
  - _Requirements: 10.3, 10.4, 10.5_

---

## 8. Frontend Authentication Screens

Update and connect the authentication screens to the backend.

- [ ] 8.1 Update LoginScreen with API integration
  - Update `src/screens/LoginScreen.tsx`
  - Connect form to AuthContext.login()
  - Add form validation (email format, required fields)
  - Display loading state during login
  - Show error messages for failed login
  - Redirect to home screen on successful login
  - Test login flow end-to-end
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 8.2 Update SignupScreen with API integration
  - Update `src/screens/SignupScreen.tsx`
  - Connect form to AuthContext.register()
  - Add form validation (email format, password length, required fields)
  - Display loading state during registration
  - Show error messages for failed registration
  - Redirect to home screen on successful registration
  - Test registration flow end-to-end
  - _Requirements: 9.1, 9.3, 9.4_

- [ ] 8.3 Create Co-Founder welcome screen
  - Create `src/screens/CoFounderWelcomeScreen.tsx`
  - Display special welcome message for Briana
  - Show Co-Founder badge prominently
  - Include "Continue to App" button
  - Only show this screen once after Co-Founder first login
  - Store flag in AsyncStorage to prevent showing again
  - _Requirements: 3.5, 9.5_

- [ ] 8.4 Update App.tsx with Co-Founder detection
  - Check if user.isCoFounder is true after login
  - Show CoFounderWelcomeScreen before main app
  - After welcome screen, navigate to main app
  - Display Co-Founder badge in header/profile
  - _Requirements: 9.5_

---

## 9. Protected Routes Implementation

Implement route protection to require authentication.

- [ ] 9.1 Create PrivateRoute wrapper component
  - Create `src/components/PrivateRoute.tsx`
  - Check if user is authenticated via AuthContext
  - If authenticated, render the protected component
  - If not authenticated, redirect to login screen
  - Show loading indicator while checking auth state
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 9.2 Apply PrivateRoute to protected screens
  - Wrap all main app screens with PrivateRoute
  - Keep Login and Signup screens public
  - Test that unauthenticated users are redirected to login
  - Test that authenticated users can access all screens
  - _Requirements: 10.1, 10.2_

---

## 10. Integration Testing and Verification

Test the complete authentication flow end-to-end.

- [ ] 10.1 Test complete registration flow
  - Start app without authentication
  - Navigate to signup screen
  - Fill out registration form with valid data
  - Submit and verify user is created in database
  - Verify JWT token is stored in AsyncStorage
  - Verify user is redirected to home screen
  - Close and reopen app, verify user stays logged in
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 10.5_

- [ ] 10.2 Test Co-Founder registration flow
  - Register with email brianaolszewski1@gmail.com
  - Verify is_co_founder is set to true in database
  - Verify subscription_status is set to 'lifetime'
  - Verify Co-Founder welcome screen is displayed
  - Verify Co-Founder badge appears in app
  - _Requirements: 2.4, 2.5, 2.6, 3.5, 9.5_

- [ ] 10.3 Test login flow
  - Logout from app
  - Navigate to login screen
  - Enter valid credentials
  - Verify user is authenticated and redirected to home
  - Verify JWT token is stored
  - Test with invalid credentials, verify error message
  - _Requirements: 4.1, 4.2, 4.3, 9.1, 9.3, 9.4_

- [ ] 10.4 Test profile management
  - Login as authenticated user
  - Navigate to profile screen
  - Update first name and last name
  - Verify changes are saved in database
  - Change password
  - Logout and login with new password
  - Verify new password works
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10.5 Test GDPR features
  - Login as authenticated user
  - Request data export
  - Verify exported JSON contains all user data
  - Request account deletion
  - Verify user is deleted from database
  - Verify related data is deleted (cascades)
  - Verify referral records are anonymized
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10.6 Test protected routes
  - Logout from app
  - Attempt to access protected screen directly
  - Verify redirect to login screen
  - Login and verify access is granted
  - Let token expire (or manually delete from AsyncStorage)
  - Verify user is prompted to re-authenticate
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

---

## 11. Cleanup and Documentation

Clean up test files and document the implementation.

- [ ] 11.1 Remove all test files
  - Delete any .test.ts or .spec.ts files created during development
  - Keep only production code
  - Verify app still works after cleanup
  - _Testing Strategy: Test Cleanup_

- [ ] 11.2 Update fixes-log.md with successful patterns
  - Document database migration pattern
  - Document authentication service pattern
  - Document JWT token handling
  - Document any issues encountered and solutions
  - _Testing Strategy: Test Cleanup_

- [ ] 11.3 Verify all Phase 2 requirements are met
  - Review requirements.md
  - Confirm each requirement has been implemented
  - Test each requirement manually
  - Mark any incomplete requirements for follow-up
  - _All Requirements_

- [ ] 11.4 Update master-checklist.md progress
  - Mark all Phase 2 tasks as complete
  - Update progress percentage
  - Document completion date
  - Prepare for Phase 3
  - _Project Management_
