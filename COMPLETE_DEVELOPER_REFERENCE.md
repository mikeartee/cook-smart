# Cook Smart - Complete Developer Reference

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Development Environment Setup](#development-environment-setup)
4. [Mobile App Development](#mobile-app-development)
5. [Backend API Development](#backend-api-development)
6. [Website Development](#website-development)
7. [Database Management](#database-management)
8. [AWS Infrastructure](#aws-infrastructure)
9. [Authentication Systems](#authentication-systems)
10. [Third-Party Integrations](#third-party-integrations)
11. [Build & Deployment](#build--deployment)
12. [Testing & Quality Assurance](#testing--quality-assurance)
13. [Troubleshooting](#troubleshooting)
14. [Security & Compliance](#security--compliance)
15. [Performance & Monitoring](#performance--monitoring)

---

## Project Overview

**Cook Smart** is a comprehensive recipe and meal planning platform consisting of:

- **Mobile Application**: React Native (Android primary, iOS planned)
- **Website**: Next.js 14 with integrated admin dashboard
- **Backend API**: Node.js/Express with TypeScript
- **Database**: PostgreSQL on AWS RDS
- **Infrastructure**: AWS (EC2, RDS, Route 53, CloudFront)

### Business Context

- **Target Users**: Home cooks, meal planners, recipe enthusiasts
- **Monetization**: Subscription-based (Stripe integration)
- **Stage**: Beta with live users
- **Budget**: $20/month emergency budget (cost-conscious development)

---

## System Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │     Website     │    │  Admin Dashboard│
│  (React Native) │    │   (Next.js 14)  │    │  (Next.js Pages)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │     Backend API         │
                    │  (Node.js/Express/TS)   │
                    └─────────────┬───────────┘
                                  │
                    ┌─────────────┴───────────┐
                    │    PostgreSQL DB        │
                    │     (AWS RDS)           │
                    └─────────────────────────┘
```

### Data Flow

1. **Mobile App** → API → Database
2. **Website** → API → Database  
3. **Admin Dashboard** → Admin API → Database
4. **Third-party APIs** → Backend → Database

---

## Development Environment Setup

### Required Software

#### Core Development Tools

```bash
# Node.js (v18 or higher)
node --version  # Should be 18.x.x or higher
npm --version   # Should be 9.x.x or higher

# Git
git --version

# Code Editor (choose one)
# - Visual Studio Code (recommended)
# - IntelliJ IDEA
# - Android Studio (for mobile development)
```

#### Mobile Development

```bash
# React Native CLI (NOT Expo CLI)
npm install -g @react-native-community/cli

# Android Studio (required for Android builds)
# Download from: https://developer.android.com/studio

# Java Development Kit (JDK 11 or 17)
java -version

# Android SDK (via Android Studio)
# Set ANDROID_HOME environment variable
```

#### Backend Development

```bash
# TypeScript (global installation)
npm install -g typescript

# PM2 (for production process management)
npm install -g pm2

# PostgreSQL client (for database access)
# Windows: Download from postgresql.org
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql-client
```

#### AWS Development

```bash
# AWS CLI v2
aws --version

# Configure AWS CLI
aws configure
# Access Key ID: [from AWS IAM]
# Secret Access Key: [from AWS IAM]
# Default region: us-east-1
# Default output format: json
```

### Environment Variables Setup

#### Global Environment Variables

```bash
# Windows (PowerShell)
$env:ANDROID_HOME = "C:\Users\[USERNAME]\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11.0.x"

# macOS/Linux (bash/zsh)
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
```

#### Project-Specific Environment Files

**Backend Environment** (`backend/.env`):

```env
# Database Configuration
DB_HOST=cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=cooksmartdb
DB_USER=cooksmartadmin
DB_PASSWORD=CookSmart2024!
DATABASE_URL=postgresql://cooksmartadmin:CookSmart2024!@cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com:5432/cooksmartdb

# JWT Configuration
JWT_SECRET=cook_smart_jwt_secret_2024_very_long_and_secure_key_for_production
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=cook-smart-storage-beta-976289921508

# Recipe API Keys
SPOONACULAR_API_KEY=f06e7b083f1742dd88c8d69741027775
FATSECRET_CLIENT_ID=e2cf80c43b0c4687ba237b45438c4ad4
FATSECRET_CLIENT_SECRET=3ce76986cd444c4084d093f70f3e36bf

# Stripe Configuration (LIVE MODE)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SRkHlKSbJqCZWWDLbbUxcsh5Nd2nrQOpuuCnJ5U8RdDVNKAdL954YDcfREHkooJaOPyR0guknOo1coRO0c8BnpZ0004oWidmO

# Stripe Product Price IDs
STRIPE_BETA_PRICE_ID=price_1SUFYdKSbJqCZWWDxroHNtLF
STRIPE_YEARLY_PRICE_ID=price_1SUFYdKSbJqCZWWDCwFyA6zb
STRIPE_MONTHLY_PRICE_ID=price_1SUFYdKSbJqCZWWDM9SDtJhp
STRIPE_WEEKLY_PRICE_ID=price_1SUFYeKSbJqCZWWDT9CO4qJX

# Discord Webhooks (for monitoring)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD

# Email Configuration (Resend)
RESEND_API_KEY=re_YTJB5qiM_LM8APhhAo6MyyLYysTdk8GR6
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
ADMIN_EMAIL=services.cooksmart@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=production
```

**Website Environment** (`website/.env.local`):

```env
NEXT_PUBLIC_API_URL=https://api.cooksmartapp.com
NEXT_PUBLIC_SITE_URL=https://cooksmartapp.com
RESEND_API_KEY=re_YTJB5qiM_LM8APhhAo6MyyLYysTdk8GR6
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
```

---

## Mobile App Development

### Technology Stack

- **Framework**: React Native 0.72+ (NO Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation v6
- **State Management**: React Context + Hooks
- **HTTP Client**: Axios
- **Push Notifications**: React Native Firebase

### Project Structure

```text
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Input, etc.)
│   ├── forms/           # Form-specific components
│   └── navigation/      # Navigation components
├── screens/             # Screen components
│   ├── auth/           # Authentication screens
│   ├── recipes/        # Recipe-related screens
│   ├── profile/        # User profile screens
│   └── settings/       # Settings screens
├── services/           # API and external service integrations
│   ├── api.ts          # Main API client
│   ├── auth.ts         # Authentication service
│   └── storage.ts      # Local storage service
├── config/             # Configuration files
│   ├── api.ts          # API configuration (CRITICAL)
│   └── constants.ts    # App constants
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

### Critical Configuration Files

#### API Configuration (`src/config/api.ts`)

```typescript
// CRITICAL: This determines which backend the app connects to
const isDevelopment = __DEV__ && !process.env.REACT_APP_FORCE_PRODUCTION;

export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local development
  : 'https://api.cooksmartapp.com'; // Production

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
  },
  RECIPES: {
    SEARCH: '/api/v1/recipes/search',
    FAVORITES: '/api/v1/recipes/favorites',
    USER_RECIPES: '/api/v1/recipes/user',
  },
  USER: {
    PROFILE: '/api/v1/users/profile',
    SETTINGS: '/api/v1/users/settings',
  },
};
```

#### Android Configuration (`android/app/src/main/res/values/strings.xml`)

```xml
<resources>
    <string name="app_name">Cook Smart</string>
</resources>
```

#### Android Manifest (`android/app/src/main/AndroidManifest.xml`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

### Development Commands

#### Mobile App Setup and Installation

```bash
# Clone repository
git clone https://github.com/tootallgames2020/cook-smart.git
cd cook-smart

# Install dependencies
npm install

# iOS setup (if developing for iOS)
cd ios && pod install && cd ..

# Android setup - ensure Android Studio is installed
# Open android/ folder in Android Studio to sync Gradle
```

#### Development

```bash
# Start Metro bundler
npm start

# Run on Android (device/emulator must be connected)
npm run android

# Run on iOS (macOS only)
npm run ios

# Clear cache if needed
npm start -- --reset-cache
```

#### Building

```bash
# Debug build (for testing)
cd android
./gradlew assembleDebug

# Release build (for production)
cd android
./gradlew assembleRelease --no-daemon

# APK location after build
# android/app/build/outputs/apk/release/app-release.apk
```



### Common Issues & Solutions

#### Build Issues

```bash
# Clean build
cd android
./gradlew clean
cd ..
npm start -- --reset-cache

# Fix Metro cache issues
npx react-native start --reset-cache

# Fix Android build issues
cd android
./gradlew clean
./gradlew assembleDebug
```

#### API Connection Issues

1. **Check API configuration** in `src/config/api.ts`
2. **Verify backend is running**: `curl https://api.cooksmartapp.com/health`
3. **For development**: Ensure local IP is correct (`192.168.12.196:3000`)
4. **For production**: Must use `https://api.cooksmartapp.com`

---

## Backend API Development

### Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database ORM**: Raw SQL with pg (PostgreSQL driver)
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Process Manager**: PM2 (production)

### Project Structure

```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── AuthController.ts
│   │   ├── AdminAuthController.ts
│   │   ├── RecipeController.ts
│   │   └── UserController.ts
│   ├── routes/            # API route definitions
│   │   ├── auth.ts
│   │   ├── adminAuth.ts
│   │   ├── recipes.ts
│   │   └── users.ts
│   ├── services/          # Business logic
│   │   ├── AuthService.ts
│   │   ├── RecipeService.ts
│   │   └── EmailService.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── models/           # Database models
│   │   ├── User.ts
│   │   ├── AdminUser.ts
│   │   └── Recipe.ts
│   ├── config/           # Configuration
│   │   └── database.ts
│   ├── utils/            # Utility functions
│   └── server.ts         # Main server file
├── dist/                 # Compiled JavaScript (generated)
├── migrations/           # Database migrations
├── seeds/               # Database seed data
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

### Development Commands

#### Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start
```

#### Database Operations

```bash
# Run migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Create new migration
npm run migrate:create migration_name

# Seed database
npm run seed
```

#### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint
```

### API Endpoints

#### Authentication Endpoints

```
POST /api/v1/auth/register          # User registration
POST /api/v1/auth/login             # User login
POST /api/v1/auth/logout            # User logout
POST /api/v1/auth/refresh           # Refresh JWT token
GET  /api/v1/auth/me                # Get current user info
POST /api/v1/auth/forgot-password   # Request password reset
POST /api/v1/auth/reset-password    # Reset password with token
```

#### Admin Authentication Endpoints

```
POST /api/v1/admin/auth/signup      # Admin registration
POST /api/v1/admin/auth/login       # Admin login (accepts email or username)
POST /api/v1/admin/auth/logout      # Admin logout
GET  /api/v1/admin/auth/me          # Get current admin info
POST /api/v1/admin/auth/forgot-password  # Admin password reset
```

#### Recipe Endpoints

```
GET    /api/v1/recipes              # Get recipes (with pagination)
GET    /api/v1/recipes/:id          # Get specific recipe
POST   /api/v1/recipes              # Create new recipe
PUT    /api/v1/recipes/:id          # Update recipe
DELETE /api/v1/recipes/:id          # Delete recipe
GET    /api/v1/recipes/search       # Search recipes
GET    /api/v1/recipes/trending     # Get trending recipes
```

#### User Endpoints

```
GET    /api/v1/users/profile        # Get user profile
PUT    /api/v1/users/profile        # Update user profile
GET    /api/v1/users/settings       # Get user settings
PUT    /api/v1/users/settings       # Update user settings
DELETE /api/v1/users/account        # Delete user account
```

### Database Schema

#### Core Tables

```sql
-- Users table (for mobile app users)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  subscription_status VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin users table (for admin dashboard)
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approved admin emails
CREATE TABLE approved_admin_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  added_by INTEGER,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients JSONB,
  instructions JSONB,
  prep_time INTEGER,
  cook_time INTEGER,
  servings INTEGER,
  difficulty VARCHAR(50),
  cuisine VARCHAR(100),
  created_by VARCHAR(255) REFERENCES users(id),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Production Deployment

#### EC2 Server Details

- **Instance ID**: i-05e0746da4f5f9da0
- **Public IP**: 34.203.8.150
- **SSH Key**: `~/.ssh/cook-smart-key.pem`
- **User**: ubuntu
- **Location**: `/home/ubuntu/cook-smart/backend/backend`

#### Deployment Process

```bash
# 1. SSH into server
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150

# 2. Navigate to backend directory
cd /home/ubuntu/cook-smart/backend/backend

# 3. Pull latest changes
git pull origin fresh-project-migration

# 4. Install dependencies (if package.json changed)
npm install

# 5. Build TypeScript
npm run build

# 6. Restart PM2 process
pm2 restart cook-smart-backend

# 7. Check status
pm2 status
pm2 logs cook-smart-backend --lines 20

# 8. Test API
curl http://localhost:3000/health
```

#### PM2 Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'cook-smart-backend',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

---

## Website Development

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Custom JWT implementation
- **Deployment**: AWS (auto-deploy from GitHub)

### Project Structure

```
website/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── login/         # Admin login
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── users/         # User management
│   │   └── recipes/       # Recipe management
│   ├── api/               # API routes (Next.js API)
│   ├── blog/              # Blog pages
│   ├── recipes/           # Public recipe pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── admin/            # Admin-specific components
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context (CRITICAL)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── api-client.ts     # API client (CRITICAL)
│   └── utils.ts          # Utility functions
├── styles/               # CSS styles
├── types/                # TypeScript type definitions
├── public/               # Static assets
├── .env.local            # Environment variables
└── next.config.ts        # Next.js configuration
```

### Critical Files

#### Authentication Context (`contexts/auth-context.tsx`)

```typescript
// This file handles authentication for both regular users and admin users
// It detects admin pages and uses appropriate endpoints

const login = useCallback(async (email: string, password: string): Promise<void> => {
  const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  
  let response;
  if (isAdminPage) {
    // Use admin login endpoint
    response = await apiClient.post('/api/v1/admin/auth/login', { email, password });
  } else {
    // Use regular user login endpoint
    response = await authApi.login(email, password);
  }
  // ... rest of login logic
}, []);
```

#### API Client (`lib/api-client.ts`)

```typescript
// Main API client with automatic URL correction
let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.cooksmartapp.com';

// Fix common misconfiguration
if (API_BASE_URL === 'https://cooksmartapp.com' || API_BASE_URL === 'http://cooksmartapp.com') {
  console.warn('[API] Correcting API URL from main domain to API subdomain');
  API_BASE_URL = 'https://api.cooksmartapp.com';
}
```

### Development Commands

#### Setup

```bash
cd website

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

#### Deployment

The website auto-deploys from GitHub pushes:

```bash
# Make changes to website/
git add website/
git commit -m "Website: description of changes"
git push origin fresh-project-migration

# Wait 5-10 minutes for AWS deployment
# Verify deployment
curl -I https://cooksmartapp.com
```

### Admin Dashboard

#### Admin Pages Structure

```
/admin/login              # Admin login page
/admin/dashboard          # Main admin dashboard
/admin/users              # User management
/admin/recipes            # Recipe management
/admin/analytics          # Analytics and reports
/admin/settings           # Admin settings
/admin/moderation         # Content moderation
```

#### Admin Authentication Flow

1. User visits `/admin/login`
2. Enters email and password
3. `auth-context.tsx` detects admin page
4. Calls `/api/v1/admin/auth/login` endpoint
5. On success, calls `/api/v1/admin/auth/me` for user info
6. Redirects to `/admin/dashboard`

---

## Database Management

### Database Details

- **Type**: PostgreSQL 16
- **Host**: cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
- **Port**: 5432
- **Database**: cooksmartdb
- **Username**: cooksmartadmin
- **Password**: CookSmart2024!

### Connection Methods

#### Direct Connection

```bash
# Using psql
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin \
     -d cooksmartdb

# Using connection string
psql "postgresql://cooksmartadmin:CookSmart2024!@cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com:5432/cooksmartdb"
```

#### From Backend Code

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
```

### Key Tables and Relationships

#### User Management

```sql
-- Regular app users
SELECT COUNT(*) FROM users;
SELECT email, subscription_status, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Admin users
SELECT COUNT(*) FROM admin_users;
SELECT email, username, email_verified, last_login FROM admin_users;

-- Approved admin emails
SELECT email, is_super_admin, added_at FROM approved_admin_emails;
```

#### Recipe Management

```sql
-- All recipes
SELECT COUNT(*) FROM recipes;
SELECT title, created_by, is_public, created_at FROM recipes ORDER BY created_at DESC LIMIT 10;

-- User recipes
SELECT u.email, COUNT(r.id) as recipe_count 
FROM users u 
LEFT JOIN recipes r ON u.id = r.created_by 
GROUP BY u.id, u.email 
ORDER BY recipe_count DESC;
```

### Database Maintenance

#### Backup

```bash
# Create backup
pg_dump -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
        -U cooksmartadmin \
        -d cooksmartdb \
        --no-password \
        > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin \
     -d cooksmartdb \
     < backup_20251211_120000.sql
```

#### Migrations

```bash
# Run pending migrations
cd backend
npm run migrate:up

# Create new migration
npm run migrate:create add_new_table

# Rollback last migration
npm run migrate:down
```

---

## AWS Infrastructure

### Account Details

- **Account ID**: 976289921508
- **Region**: us-east-1 (US East - N. Virginia)
- **IAM User**: kitchen-helper-deploy

### Resources Overview

#### EC2 Instances

```bash
# Backend server
Instance ID: i-05e0746da4f5f9da0
Public IP: 34.203.8.150
Private IP: 10.0.1.x
Instance Type: t3.small
OS: Ubuntu 22.04 LTS
```

#### RDS Database

```bash
# PostgreSQL database
Identifier: cook-smart-db-beta
Endpoint: cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
Engine: PostgreSQL 16
Instance Class: db.t3.micro (free tier)
Storage: 20 GB gp2
```

#### Route 53 DNS

```bash
# Domain configuration
Domain: cooksmartapp.com
Hosted Zone ID: Z1D633PJN98FT9
Records:
  - cooksmartapp.com → Website (AWS)
  - api.cooksmartapp.com → 34.203.8.150
  - www.cooksmartapp.com → cooksmartapp.com (redirect)
```

### AWS CLI Commands

#### EC2 Management

```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Start instance
aws ec2 start-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Stop instance
aws ec2 stop-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Reboot instance
aws ec2 reboot-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1
```

#### RDS Management

```bash
# Check database status
aws rds describe-db-instances --db-instance-identifier cook-smart-db-beta --region us-east-1

# Create database snapshot
aws rds create-db-snapshot \
  --db-instance-identifier cook-smart-db-beta \
  --db-snapshot-identifier cook-smart-backup-$(date +%Y%m%d) \
  --region us-east-1
```

#### Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1

# Set up billing alarm (if not exists)
aws cloudwatch put-metric-alarm \
  --alarm-name "CookSmartBillingAlarm" \
  --alarm-description "Alarm when charges exceed $15" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 15 \
  --comparison-operator GreaterThanThreshold \
  --region us-east-1
```

---

## Authentication Systems

### Dual Authentication Architecture

Cook Smart uses **two separate authentication systems**:

1. **Regular Users** (Mobile App + Website)
2. **Admin Users** (Admin Dashboard)

#### Regular User Authentication

**Endpoints**:

- Login: `POST /api/v1/auth/login`
- User Info: `GET /api/v1/auth/me`
- Register: `POST /api/v1/auth/register`

**Database**: `users` table

**JWT Payload**:

```json
{
  "id": "user_1763454524090_w2r1tkuyb",
  "email": "user@example.com",
  "subscription_status": "premium",
  "iat": 1703454524,
  "exp": 1704059324
}
```

#### Admin User Authentication

**Endpoints**:

- Login: `POST /api/v1/admin/auth/login` (accepts email OR username)
- User Info: `GET /api/v1/admin/auth/me`
- Signup: `POST /api/v1/admin/auth/signup`

**Database**: `admin_users` + `approved_admin_emails` tables

**JWT Payload**:

```json
{
  "id": 3,
  "email": "admin@cooksmartapp.com",
  "username": "admin",
  "is_super_admin": true,
  "iat": 1703454524,
  "exp": 1704059324
}
```

### Current Admin Account

- **Email**: bradturnbough80@gmail.com
- **Username**: brad
- **Password**: June172018!
- **Status**: Super Admin, Email Verified

### Authentication Testing Scripts

#### Test Admin Login

```bash
# Test with email
node test-admin-email-login.js

# Test both endpoints
node test-admin-me-endpoint.js

# Check admin setup
node backend/check-admin-setup.js
```

#### Admin User Management

```bash
# Add new approved admin email
# Edit backend/add-approved-email.js with new email
node backend/add-approved-email.js

# Reset admin password
# Edit backend/reset-admin-password.js with new password
node backend/reset-admin-password.js
```

---

## Third-Party Integrations

### FatSecret API (Primary Recipe Source)

```env
FATSECRET_CLIENT_ID=e2cf80c43b0c4687ba237b45438c4ad4
FATSECRET_CLIENT_SECRET=3ce76986cd444c4084d093f70f3e36bf
```

**Usage**:

- Recipe search and retrieval
- Nutrition information
- 500,000 API calls/month (free during beta)

### Stripe Payment Processing (LIVE MODE)

```env
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SRkHlKSbJqCZWWDLbbUxcsh5Nd2nrQOpuuCnJ5U8RdDVNKAdL954YDcfREHkooJaOPyR0guknOo1coRO0c8BnpZ0004oWidmO
```

**Products**:

- Beta Plan: price_1SUFYdKSbJqCZWWDxroHNtLF
- Monthly Plan: price_1SUFYdKSbJqCZWWDM9SDtJhp
- Yearly Plan: price_1SUFYdKSbJqCZWWDCwFyA6zb
- Weekly Plan: price_1SUFYeKSbJqCZWWDT9CO4qJX

### Resend Email Service

```env
RESEND_API_KEY=re_YTJB5qiM_LM8APhhAo6MyyLYysTdk8GR6
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
```

**Usage**:

- Transactional emails
- Password reset emails
- Subscription notifications

### Discord Webhooks (Monitoring)

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
```

**Usage**:

- Error notifications
- System health alerts
- User activity monitoring



---

## Build & Deployment

### Mobile App Deployment

#### Development Build

```bash
# Start development
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

#### Production Build

```bash
# Clean previous builds
cd android
./gradlew clean
cd ..

# Build release APK
cd android
./gradlew assembleRelease --no-daemon

# APK location
# android/app/build/outputs/apk/release/app-release.apk

# Install on device for testing
adb install android/app/build/outputs/apk/release/app-release.apk
```



### Backend Deployment

#### Local Development

```bash
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Build TypeScript
npm run build

# Start production server locally
npm start
```

#### Production Deployment (EC2)

```bash
# 1. SSH into server
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150

# 2. Navigate to backend
cd /home/ubuntu/cook-smart/backend/backend

# 3. Pull latest changes
git pull origin fresh-project-migration

# 4. Install new dependencies (if needed)
npm install

# 5. Build TypeScript
npm run build

# 6. Restart PM2 process
pm2 restart cook-smart-backend

# 7. Verify deployment
pm2 status
pm2 logs cook-smart-backend --lines 10
curl http://localhost:3000/health

# 8. Exit SSH
exit

# 9. Test from outside
curl https://api.cooksmartapp.com/health
```

### Website Deployment

#### Local Development

```bash
cd website

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start
```

#### Production Deployment (AWS Auto-Deploy)

```bash
# Website auto-deploys from GitHub pushes
git add website/
git commit -m "Website: description of changes"
git push origin fresh-project-migration

# Wait 5-10 minutes for AWS deployment
# Check deployment status
curl -I https://cooksmartapp.com

# Verify admin dashboard
curl -I https://cooksmartapp.com/admin/login
```

---

## Testing & Quality Assurance

### Testing Strategy

#### Backend Testing

```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- AuthController.test.ts

# Run tests in watch mode
npm test -- --watch
```

#### Frontend Testing (Website)

```bash
cd website

# Run Jest tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (if configured)
npm run test:e2e
```

#### Mobile App Testing

```bash
# Run Jest tests
npm test

# Run tests on device
npm run test:android
npm run test:ios

# Run E2E tests (Detox)
npm run test:e2e:android
npm run test:e2e:ios
```

### Quality Assurance Scripts

#### Health Checks

```bash
# Backend health
curl https://api.cooksmartapp.com/health

# Website health
curl -I https://cooksmartapp.com

# Database health
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb -c "SELECT 1;"
```

#### Authentication Testing

```bash
# Test admin authentication
node test-admin-email-login.js
node test-admin-me-endpoint.js

# Check admin setup
node backend/check-admin-setup.js
```

#### Performance Testing

```bash
# Load test API endpoints
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s https://api.cooksmartapp.com/health
done

# Test concurrent requests
seq 1 10 | xargs -n1 -P10 -I{} curl -s https://api.cooksmartapp.com/health
```

### Code Quality Standards

#### TypeScript Standards

- Explicit type annotations for function parameters and return types
- Interfaces for all object structures
- No `any` types unless absolutely necessary
- Organized imports (external libraries first, then internal modules)

#### JavaScript/React Standards

- Use semicolons consistently
- Single quotes for strings
- 2-space indentation
- Const/let instead of var

#### SQL Standards

- Uppercase SQL keywords
- One clause per line for complex queries
- Proper indentation and alignment

---

## Troubleshooting

### Common Issues

#### Backend Not Responding

**Symptoms**: API timeouts, 502/503 errors, admin dashboard login fails

**Diagnosis**:

```bash
# Check EC2 instance status
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Check if backend process is running
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 status"

# Check backend logs
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 logs cook-smart-backend --lines 20"
```

**Solutions**:

```bash
# Restart backend process
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 restart cook-smart-backend"

# If that fails, restart EC2 instance
aws ec2 reboot-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Wait and check status
sleep 60
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1
```

#### Mobile App Connection Issues

**Symptoms**: "Network Error", "JSON Parse Error", app can't connect to API

**Diagnosis**:

1. Check API configuration in `src/config/api.ts`
2. Verify which URL the app is using (development vs production)
3. Test API endpoint directly

**Solutions**:

```bash
# For development builds
# Ensure src/config/api.ts uses: http://192.168.12.196:3000

# For production builds
# Ensure src/config/api.ts uses: https://api.cooksmartapp.com

# Test API connectivity
curl https://api.cooksmartapp.com/health
curl http://192.168.12.196:3000/health  # For local development
```

#### Admin Authentication Issues

**Symptoms**: "Invalid credentials", login redirects back to login page

**Diagnosis**:

```bash
# Test admin login directly
node test-admin-email-login.js

# Check admin setup
node backend/check-admin-setup.js

# Test admin endpoints
node test-admin-me-endpoint.js
```

**Solutions**:

```bash
# Reset admin password
node backend/reset-admin-password.js

# Add admin email if not approved
node backend/add-approved-email.js

# Check if website deployed with auth fixes
curl -I https://cooksmartapp.com/admin/login
```

#### Database Connection Issues

**Symptoms**: Backend errors mentioning database, connection timeouts

**Diagnosis**:

```bash
# Test database connection
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb -c "SELECT 1;"

# Check RDS status
aws rds describe-db-instances --db-instance-identifier cook-smart-db-beta --region us-east-1
```

**Solutions**:

```bash
# Check RDS security groups allow EC2 access
# Restart RDS instance if needed (via AWS Console)
# Verify environment variables in backend/.env
```

#### Build Issues

**Mobile App Build Failures**:

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
cd android
./gradlew assembleDebug
```

**Backend Build Failures**:

```bash
cd backend
rm -rf node_modules dist
npm install
npm run build
```

**Website Build Failures**:

```bash
cd website
rm -rf node_modules .next
npm install
npm run build
```

### Emergency Recovery Procedures

#### Complete System Failure

1. **Check AWS resources status**
2. **Restart EC2 instance**
3. **Verify database connectivity**
4. **Redeploy backend if needed**
5. **Force website redeploy**

#### Data Recovery

```bash
# Create database backup before any recovery
pg_dump -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
        -U cooksmartadmin -d cooksmartdb > emergency_backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup if needed
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb < backup_file.sql
```

#### Admin Access Recovery

```sql
-- Direct database access to reset admin
UPDATE admin_users 
SET password_hash = '$2a$10$rQJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5',
    email_verified = TRUE
WHERE email = 'bradturnbough80@gmail.com';

-- Ensure email is approved
INSERT INTO approved_admin_emails (email, is_super_admin) 
VALUES ('bradturnbough80@gmail.com', TRUE) 
ON CONFLICT (email) DO UPDATE SET is_super_admin = TRUE;
```

---

## Security & Compliance

### Security Measures

#### Authentication Security

- JWT tokens with expiration (7 days)
- Password hashing with bcrypt (10 rounds)
- Email verification for admin accounts
- Rate limiting on authentication endpoints

#### API Security

- CORS configuration for allowed origins
- Helmet.js for security headers
- Input validation with express-validator
- SQL injection prevention with parameterized queries

#### Infrastructure Security

- SSH key-based authentication for EC2
- Security groups restricting access
- RDS in private subnet (not publicly accessible)
- SSL/TLS encryption for all API communications

### Environment Security

#### Secrets Management

```bash
# Backend secrets (never commit to Git)
backend/.env

# Website secrets (never commit to Git)
website/.env.local

# SSH keys (stored locally)
~/.ssh/cook-smart-key.pem
```

#### Access Control

- AWS IAM users with minimal required permissions
- Database users with specific role-based access
- Admin dashboard requires pre-approved email addresses

### Compliance Considerations

#### Data Privacy

- User data stored securely in PostgreSQL
- Password hashing for all user accounts
- Email verification processes
- User account deletion capabilities

#### GDPR Compliance

- User data export functionality
- Account deletion processes
- Privacy policy implementation
- Cookie consent management

---

## Performance & Monitoring

### Performance Optimization

#### Backend Performance

- Connection pooling for database
- Caching strategies for frequently accessed data
- Rate limiting to prevent abuse
- Efficient SQL queries with proper indexing

#### Frontend Performance

- Next.js optimization features
- Image optimization and lazy loading
- Code splitting and dynamic imports
- CDN usage for static assets

#### Mobile App Performance

- React Native performance best practices
- Image caching and optimization
- Efficient state management
- Background task optimization

### Monitoring & Logging

#### Backend Monitoring

```bash
# PM2 monitoring
pm2 monit

# Check logs
pm2 logs cook-smart-backend --lines 50

# System resource monitoring
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "top -bn1 | head -20"
```

#### AWS Monitoring

- CloudWatch metrics for EC2 and RDS
- Billing alarms for cost control
- Performance insights for database

#### Application Monitoring

- Discord webhooks for error notifications
- Health check endpoints
- User activity tracking

### Cost Monitoring

#### Current Budget

- **Emergency Budget**: $20/month
- **Priority**: Free tier and open-source solutions
- **Monitoring**: CloudWatch alarm at $15/month

#### Cost Optimization

- Use AWS free tier resources when possible
- Monitor usage regularly
- Optimize database queries for efficiency
- Use efficient EC2 instance types

---

## Contact Information & Resources

### Support Contacts

- **Support Email**: services.cooksmart@gmail.com
- **Discord Community**: <https://discord.gg/7mAeMvjGVH>
- **Repository**: <https://github.com/tootallgames2020/cook-smart>
- **Main Branch**: fresh-project-migration

### External Resources

- **AWS Console**: <https://console.aws.amazon.com>
- **Stripe Dashboard**: <https://dashboard.stripe.com>
- **Resend Dashboard**: <https://resend.com/dashboard>

### Documentation Files

- `DEVELOPER_GUIDE.md` - Complete development reference
- `TROUBLESHOOTING_ADMIN_AUTH.md` - Admin authentication issues
- `DEPLOYMENT_COMMANDS.md` - All deployment commands
- `README_FOR_AI_ASSISTANTS.md` - Quick reference for AI tools
- `.kiro/steering/` - Project rules and coding standards

---

**Last Updated**: December 11, 2025
**Document Version**: 1.0
**Purpose**: Complete reference for all developers and AI assistants
**Scope**: Entire Cook Smart application ecosystem
