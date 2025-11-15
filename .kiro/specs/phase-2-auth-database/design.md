# Phase 2: Authentication & Database - Design Document

## Overview

This phase implements the core data layer and authentication system for Cook Smart. The design follows a serverless architecture with AWS Lambda for compute, PostgreSQL for data storage, and React Native for the frontend. All subsequent features depend on this foundation.

## Architecture

### System Layers

```
┌─────────────────────────────────────┐
│   React Native Frontend             │
│   - Auth Screens                    │
│   - Auth Context (JWT storage)      │
│   - Protected Routes                │
└──────────────┬──────────────────────┘
               │ HTTPS/REST
┌──────────────▼──────────────────────┐
│   AWS API Gateway                   │
│   - Route Management                │
│   - Request/Response Transformation │
│   - CORS Configuration              │
└──────────────┬──────────────────────┘
               │ Invoke
┌──────────────▼──────────────────────┐
│   AWS Lambda Functions              │
│   - Auth Functions (register/login) │
│   - User Functions (profile/GDPR)   │
│   - JWT Middleware                  │
│   - Shared Utilities                │
└──────────────┬──────────────────────┘
               │ SQL Queries
┌──────────────▼──────────────────────┐
│   AWS RDS PostgreSQL                │
│   - Users Table                     │
│   - Ingredients Tables              │
│   - Recipes Tables                  │
│   - User Data Tables                │
└─────────────────────────────────────┘
```

### Technology Stack

- **Compute**: AWS Lambda (Node.js 18+) - FREE forever
- **API Gateway**: AWS API Gateway - FREE forever
- **Database**: AWS RDS PostgreSQL (t3.micro) - FREE for 7 months (credits)
- **Migrations**: node-pg-migrate for versioned schema changes
- **Authentication**: JWT tokens with bcrypt password hashing
- **Deployment**: Serverless Framework for infrastructure as code
- **Frontend State**: React Context API for auth state
- **Storage**: AsyncStorage for JWT persistence

### AWS Cost Structure

**Always Free (Forever):**
- Lambda: 1M requests/month + 400K GB-seconds
- API Gateway: 1M API calls/month
- S3: 5GB storage + 20K GET requests

**Credit-Covered (7 months):**
- RDS PostgreSQL t3.micro: ~$15/month

**After Credits:**
- RDS only: $15/month
- Everything else: FREE

## Components and Interfaces

### Serverless Framework Configuration

**Purpose**: Define and deploy Lambda functions and API Gateway

**Configuration** (`serverless.yml`):
```yaml
service: cook-smart-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  register:
    handler: functions/auth/register.handler
    events:
      - http:
          path: auth/register
          method: post
          cors: true
          
  login:
    handler: functions/auth/login.handler
    events:
      - http:
          path: auth/login
          method: post
          cors: true
```

### Lambda Function Structure

**Purpose**: Handle individual API endpoints as separate functions

**Pattern**:
```typescript
// functions/auth/register.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthService } from '../shared/services/AuthService';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { email, password, firstName, lastName } = JSON.parse(event.body || '{}');
    
    const result = await AuthService.register(email, password, firstName, lastName);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

### Database Connection Pooling

**Purpose**: Reuse database connections across Lambda invocations

**Implementation**:
```typescript
// functions/shared/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export const getPool = (): Pool => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1, // Lambda: 1 connection per instance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
};
```

### Database Migration System

**Purpose**: Manage database schema changes in a versioned, repeatable way

**Implementation**:
- Use `node-pg-migrate` package for migration management
- Store migrations in `backend/migrations/` directory
- Each migration has `up` and `down` functions for apply/rollback
- Migrations run in sequential order based on timestamp
- Track applied migrations in `pgmigrations` table

**Key Commands**:
- `npm run migrate up` - Apply pending migrations
- `npm run migrate down` - Rollback last migration
- `npm run migrate create <name>` - Create new migration file

### Database Schema

#### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_co_founder BOOLEAN DEFAULT FALSE,
  subscription_status VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_co_founder ON users(is_co_founder) WHERE is_co_founder = TRUE;
```

#### Ingredients Table

```sql
CREATE TABLE ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  is_common BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients(name);
```

#### Ingredient Synonyms Table

```sql
CREATE TABLE ingredient_synonyms (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  synonym VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_synonyms_ingredient ON ingredient_synonyms(ingredient_id);
```

#### User Ingredients Table

```sql
CREATE TABLE user_ingredients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity VARCHAR(100),
  expiration_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, ingredient_id)
);

CREATE INDEX idx_user_ingredients_user ON user_ingredients(user_id);
```

#### Custom Ingredients Table

```sql
CREATE TABLE custom_ingredients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_ingredients_user ON custom_ingredients(user_id);
```

#### User Recipes Table (Favorites)

```sql
CREATE TABLE user_recipes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipe_id VARCHAR(255) NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX idx_user_recipes_user ON user_recipes(user_id);
```

#### Shopping Lists Table

```sql
CREATE TABLE shopping_lists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100),
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);
```

#### User Points Table

```sql
CREATE TABLE user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  action VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
```

#### Referrals Table

```sql
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
```

### Authentication Service

**Purpose**: Handle user registration, login, and JWT token management

**Key Functions**:

```typescript
class AuthService {
  // Register new user with email/password
  async register(email: string, password: string, firstName: string, lastName: string): Promise<{user, token}>
  
  // Authenticate user and return JWT
  async login(email: string, password: string): Promise<{user, token}>
  
  // Verify JWT token and return user
  async verifyToken(token: string): Promise<User>
  
  // Generate JWT token for user
  generateToken(user: User): string
  
  // Hash password with bcrypt
  async hashPassword(password: string): Promise<string>
  
  // Compare password with hash
  async comparePassword(password: string, hash: string): Promise<boolean>
}
```

**JWT Payload Structure**:
```json
{
  "userId": 123,
  "email": "user@example.com",
  "isCoFounder": false,
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Token Expiration**: 7 days from issue

### User Service

**Purpose**: Manage user profile data and GDPR operations

**Key Functions**:

```typescript
class UserService {
  // Get user by ID
  async getUserById(userId: number): Promise<User>
  
  // Update user profile
  async updateProfile(userId: number, updates: Partial<User>): Promise<User>
  
  // Change user password
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>
  
  // Export all user data (GDPR)
  async exportUserData(userId: number): Promise<object>
  
  // Delete user account (GDPR)
  async deleteUserAccount(userId: number): Promise<void>
}
```

### API Endpoints (via API Gateway)

**Base URL**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev`

#### Authentication Endpoints

```
POST /auth/register
Body: { email, password, firstName, lastName }
Response: { user: {...}, token: "jwt..." }
Lambda: functions/auth/register.handler

POST /auth/login
Body: { email, password }
Response: { user: {...}, token: "jwt..." }
Lambda: functions/auth/login.handler

GET /auth/me
Headers: Authorization: Bearer <token>
Response: { user: {...} }
Lambda: functions/auth/me.handler
```

#### User Profile Endpoints

```
GET /users/profile
Headers: Authorization: Bearer <token>
Response: { user: {...} }
Lambda: functions/users/getProfile.handler

PUT /users/profile
Headers: Authorization: Bearer <token>
Body: { firstName, lastName }
Response: { user: {...} }
Lambda: functions/users/updateProfile.handler

PUT /users/password
Headers: Authorization: Bearer <token>
Body: { currentPassword, newPassword }
Response: { message: "Password updated" }
Lambda: functions/users/changePassword.handler

GET /users/export
Headers: Authorization: Bearer <token>
Response: { userData: {...} }
Lambda: functions/users/exportData.handler

DELETE /users/account
Headers: Authorization: Bearer <token>
Response: { message: "Account deleted" }
Lambda: functions/users/deleteAccount.handler
```

**Note**: API Gateway automatically provides HTTPS, CORS, and request/response transformation

### Frontend Authentication Context

**Purpose**: Manage authentication state across the React Native app

**Context Structure**:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}
```

**Implementation Details**:
- Store JWT token in AsyncStorage for persistence
- Load token on app startup and verify with backend
- Provide authentication state to all child components
- Handle token expiration and prompt re-authentication

### Protected Routes

**Purpose**: Restrict access to authenticated users only

**Implementation**:
- Create `PrivateRoute` component that checks authentication state
- Redirect to login screen if user is not authenticated
- Allow access to protected screens if user is authenticated
- Show loading indicator while verifying authentication

**Example Usage**:
```typescript
<Stack.Navigator>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Signup" component={SignupScreen} />
  <Stack.Screen name="Home" component={PrivateRoute(HomeScreen)} />
  <Stack.Screen name="Profile" component={PrivateRoute(ProfileScreen)} />
</Stack.Navigator>
```

## Data Models

### User Model

```typescript
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isCoFounder: boolean;
  subscriptionStatus: 'free' | 'active' | 'expired';
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ingredient Model

```typescript
interface Ingredient {
  id: number;
  name: string;
  category: 'proteins' | 'vegetables' | 'fruits' | 'grains' | 'dairy' | 'spices' | 'condiments' | 'other';
  isCommon: boolean;
  createdAt: Date;
}
```

### UserIngredient Model

```typescript
interface UserIngredient {
  id: number;
  userId: number;
  ingredientId: number;
  quantity?: string;
  expirationDate?: Date;
  createdAt: Date;
}
```

## Error Handling

### Authentication Errors

- **401 Unauthorized**: Invalid credentials or expired token
- **409 Conflict**: Email already exists during registration
- **400 Bad Request**: Invalid email format or password too short
- **403 Forbidden**: Attempting to access resource without permission

### Database Errors

- **500 Internal Server Error**: Database connection failure
- **503 Service Unavailable**: Database temporarily unavailable
- Log all database errors with stack traces for debugging
- Return generic error messages to clients (don't expose internal details)

### Frontend Error Handling

- Display user-friendly error messages for all API failures
- Show validation errors inline on form fields
- Provide retry mechanism for network failures
- Log errors to console for debugging in development

## Testing Strategy

### Unit Tests

**Database Layer**:
- Test migration up/down functions
- Test database connection pooling
- Mock database queries for service layer tests

**Authentication Service**:
- Test password hashing and comparison
- Test JWT token generation and verification
- Test Co-Founder email detection logic
- Mock database calls with test data

**User Service**:
- Test profile update logic
- Test password change validation
- Test GDPR export data structure
- Test account deletion cascades

### Integration Tests

**API Endpoints**:
- Test registration flow end-to-end
- Test login with valid/invalid credentials
- Test protected endpoints with/without valid tokens
- Test GDPR endpoints return correct data

**Frontend Authentication**:
- Test login form submission
- Test registration form validation
- Test token persistence across app restarts
- Test protected route redirection

### Testing Approach

1. Write service/model code
2. Create minimal test file with mocked dependencies
3. Run test to verify logic works
4. Clean up test files after verification
5. Mark task complete only after successful testing

### Test Cleanup

- Remove all test files after verification
- Keep only production code in repository
- Document successful patterns in fixes-log.md
- Maintain clean codebase for deployment

## Security Considerations

### Password Security

- Use bcrypt with salt rounds of 10 for password hashing
- Never store plain text passwords
- Require minimum 8 character passwords
- Validate password strength on frontend and backend

### JWT Security

- Sign tokens with strong secret key (stored in environment variables)
- Set reasonable expiration (7 days)
- Include minimal data in payload (no sensitive information)
- Verify token signature on every protected request

### API Security

- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Validate all input data
- Sanitize user input to prevent SQL injection
- Use parameterized queries for all database operations

### GDPR Compliance

- Provide data export in machine-readable format (JSON)
- Complete data deletion within 30 days
- Anonymize rather than delete referral relationships
- Log all data access and deletion requests
- Provide clear privacy policy and terms of service
