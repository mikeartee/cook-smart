# AWS Deployment Guide - Cook Smart

## Deploying to Your Existing AWS Infrastructure

### Overview

You already have AWS infrastructure running. We'll use it to deploy Cook Smart:

**What you have:**
- ECS Cluster (container orchestration)
- RDS Instance (database)
- App Runner (web apps)
- Load Balancer (traffic routing)
- S3 + CloudFront (static hosting)
- Secrets Manager (credential storage)

**What we'll deploy:**
- Cook Smart backend → ECS or App Runner
- Cook Smart database → RDS (new database in existing instance)
- Admin dashboard → S3 + CloudFront

**Cost:** $0 (covered by credits for 9-10 months)

---

## Deployment Strategy

### Option 1: AWS App Runner (RECOMMENDED - Easiest)

**Why App Runner:**
- ✅ Easiest to set up
- ✅ Fully managed (no server management)
- ✅ Auto-scaling built-in
- ✅ You're already paying $0.30/month for it
- ✅ Perfect for Node.js apps
- ✅ Automatic deployments from GitHub

**Cost:** ~$0.50/month additional (covered by credits)

### Option 2: AWS ECS with Fargate (More Control)

**Why ECS:**
- ✅ More control over infrastructure
- ✅ You already have ECS cluster
- ✅ Better for complex apps
- ✅ Can use existing Load Balancer

**Cost:** ~$1.00/month additional (covered by credits)

**We'll use App Runner for simplicity. You can switch to ECS later if needed.**

---

## Part 1: Prepare Your Backend for Deployment

### Step 1: Create Dockerfile

**File: `backend/Dockerfile`**

```dockerfile
# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "dist/server.js"]
```

### Step 2: Create .dockerignore

**File: `backend/.dockerignore`**

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
.vscode
.idea
dist
coverage
*.test.ts
*.test.js
```

### Step 3: Update package.json Scripts

**File: `backend/package.json`**

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "migrate": "node run-migrations.js"
  }
}
```

### Step 4: Test Docker Build Locally

```bash
# Navigate to backend
cd backend

# Build Docker image
docker build -t cook-smart-backend .

# Test run locally
docker run -p 3000:3000 ^
  -e DATABASE_URL=your-local-db-url ^
  -e JWT_SECRET=test-secret ^
  cook-smart-backend

# Test API
curl http://localhost:3000/health

# Stop container
docker stop $(docker ps -q --filter ancestor=cook-smart-backend)
```

---

## Part 2: Set Up AWS Secrets Manager

### Step 1: Store Secrets in AWS Secrets Manager

**Via AWS Console:**

1. Go to [AWS Secrets Manager](https://console.aws.amazon.com/secretsmanager/)
2. Click "Store a new secret"
3. Select "Other type of secret"
4. Add key-value pairs:

```json
{
  "DATABASE_URL": "postgresql://user:pass@your-rds-endpoint:5432/cook_smart",
  "JWT_SECRET": "your-super-secret-jwt-key-here",
  "ADMIN_JWT_SECRET": "your-super-secret-admin-jwt-key-here",
  "DISCORD_WEBHOOK_ERRORS": "your-discord-webhook-url",
  "DISCORD_WEBHOOK_FEEDBACK": "your-discord-webhook-url",
  "DISCORD_WEBHOOK_ACTIVITY": "your-discord-webhook-url",
  "THEMEALDB_API_KEY": "1",
  "EDAMAM_APP_ID": "your-edamam-app-id",
  "EDAMAM_APP_KEY": "your-edamam-app-key"
}
```

5. Secret name: `cook-smart/production`
6. Click "Next" → "Next" → "Store"
7. Copy the Secret ARN (you'll need this)

**Via AWS CLI:**

```bash
# Create secret
aws secretsmanager create-secret ^
  --name cook-smart/production ^
  --description "Cook Smart production secrets" ^
  --secret-string file://secrets.json

# secrets.json contains your key-value pairs
```

---

## Part 3: Deploy Backend to AWS App Runner

### Step 1: Push Code to GitHub (if not already)

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/yourusername/cook-smart.git

# Commit and push
git add .
git commit -m "Prepare for AWS deployment"
git push -u origin main
```

### Step 2: Create App Runner Service

**Via AWS Console:**

1. Go to [AWS App Runner](https://console.aws.amazon.com/apprunner/)
2. Click "Create service"

**Source:**
- Repository type: Source code repository
- Connect to GitHub (first time only)
- Repository: your-username/cook-smart
- Branch: main
- Source directory: /backend

**Build settings:**
- Runtime: Node.js 18
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Port: 3000

**Service settings:**
- Service name: cook-smart-api
- CPU: 1 vCPU
- Memory: 2 GB
- Environment variables: (we'll add these next)

**Auto scaling:**
- Min instances: 1
- Max instances: 3
- Concurrency: 100

**Security:**
- Instance role: Create new role (or use existing)
- Add permissions for Secrets Manager

**Networking:**
- VPC: Use your existing VPC
- Subnets: Select private subnets

3. Click "Create & deploy"
4. Wait 5-10 minutes for deployment

### Step 3: Add Environment Variables

1. Go to App Runner → cook-smart-api → Configuration
2. Click "Edit" under Environment variables
3. Add variables:

```
NODE_ENV=production
PORT=3000
```

4. For secrets, use Secrets Manager reference:
```
DATABASE_URL=arn:aws:secretsmanager:region:account:secret:cook-smart/production:DATABASE_URL::
JWT_SECRET=arn:aws:secretsmanager:region:account:secret:cook-smart/production:JWT_SECRET::
```

5. Click "Save changes"
6. Service will redeploy automatically

### Step 4: Get Your API URL

1. Go to App Runner → cook-smart-api
2. Copy the "Default domain" URL
3. Example: `https://abc123.us-east-1.awsapprunner.com`
4. Save this URL - you'll need it for the mobile app

### Step 5: Test Your API

```bash
# Test health endpoint
curl https://your-app-runner-url.awsapprunner.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-15T..."}

# Test API endpoint
curl https://your-app-runner-url.awsapprunner.com/api/ingredients

# Should return empty array or your ingredients
```

---

## Part 4: Set Up Database on RDS

### Step 1: Create Cook Smart Database

**Via AWS Console:**

1. Go to [RDS Console](https://console.aws.amazon.com/rds/)
2. Click on your existing RDS instance
3. Note the endpoint (e.g., `your-db.abc123.us-east-1.rds.amazonaws.com`)

**Connect to RDS:**

```bash
# Install PostgreSQL client (if not installed)
# Windows: Download from postgresql.org

# Connect to RDS
psql -h your-rds-endpoint.rds.amazonaws.com -U your-username -d postgres

# Create database
CREATE DATABASE cook_smart;

# Exit
\q
```

### Step 2: Run Migrations

**Update DATABASE_URL in Secrets Manager:**
```
postgresql://username:password@your-rds-endpoint:5432/cook_smart
```

**Run migrations from your local machine:**

```bash
# Set environment variable
set DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/cook_smart

# Run migrations
cd backend
node run-migrations.js

# Expected output:
# Running migration: 001_create_users_table.sql
# Running migration: 002_create_ingredients_table.sql
# ...
# All migrations completed successfully!
```

### Step 3: Add Your Admin Email

```bash
# Connect to database
psql -h your-rds-endpoint.rds.amazonaws.com -U your-username -d cook_smart

# Add your email to approved admins
INSERT INTO approved_admin_emails (email, approved_by, notes)
VALUES ('your-email@example.com', 'system', 'Initial super admin');

# Verify
SELECT * FROM approved_admin_emails;

# Exit
\q
```

---

## Part 5: Deploy Admin Dashboard to S3

### Step 1: Build Admin Dashboard

**First, create the admin dashboard (if not already created):**

```bash
# Create React app for admin dashboard
npx create-react-app admin-dashboard --template typescript
cd admin-dashboard

# Install dependencies
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom axios recharts
npm install @types/react-router-dom

# Update API URL in src/config/api.ts
# Point to your App Runner URL
```

### Step 2: Build for Production

```bash
# Build admin dashboard
cd admin-dashboard
npm run build

# Build folder will be created with static files
```

### Step 3: Upload to S3

**Via AWS Console:**

1. Go to [S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Bucket name: `cook-smart-admin-dashboard`
4. Region: us-east-1 (same as your other resources)
5. Uncheck "Block all public access"
6. Click "Create bucket"

**Upload files:**

1. Click on your bucket
2. Click "Upload"
3. Drag and drop all files from `admin-dashboard/build/`
4. Click "Upload"

**Enable static website hosting:**

1. Go to bucket → Properties
2. Scroll to "Static website hosting"
3. Click "Edit"
4. Enable static website hosting
5. Index document: `index.html`
6. Error document: `index.html`
7. Click "Save changes"

### Step 4: Configure CloudFront

**Via AWS Console:**

1. Go to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
2. Click "Create distribution"
3. Origin domain: Select your S3 bucket
4. Origin access: Origin access control
5. Create new OAC
6. Default cache behavior: Redirect HTTP to HTTPS
7. Click "Create distribution"
8. Copy the CloudFront domain (e.g., `d123abc.cloudfront.net`)

**Update S3 bucket policy:**

CloudFront will provide a policy to copy. Add it to your S3 bucket permissions.

### Step 5: Access Admin Dashboard

1. Go to your CloudFront URL: `https://d123abc.cloudfront.net`
2. You should see the admin login page
3. Login with your email
4. Admin dashboard should work!

---

## Part 6: Update Mobile App API URL

### Step 1: Update API Configuration

**File: `src/config/api.ts`**

```typescript
// src/config/api.ts
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.12.196:3000'  // Local development
  : 'https://your-app-runner-url.awsapprunner.com';  // Production AWS

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/api/auth`,
  ingredients: `${API_BASE_URL}/api/ingredients`,
  recipes: `${API_BASE_URL}/api/recipes`,
  feedback: `${API_BASE_URL}/api/feedback`,
  barcode: `${API_BASE_URL}/api/barcode`,
};
```

### Step 2: Build New APK

```bash
# Update version
# android/app/build.gradle
# versionCode 2
# versionName "1.0.1"

# Build APK
cd android
.\gradlew clean
.\gradlew assembleRelease
cd ..
```

### Step 3: Upload to Firebase

```bash
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk ^
  --app YOUR_FIREBASE_APP_ID ^
  --groups "beta-testers" ^
  --release-notes "v1.0.1 - Connected to production AWS backend"
```

---

## Part 7: Testing & Verification

### Test Backend API

```bash
# Health check
curl https://your-app-runner-url.awsapprunner.com/health

# Create test user
curl -X POST https://your-app-runner-url.awsapprunner.com/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}"

# Login
curl -X POST https://your-app-runner-url.awsapprunner.com/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
```

### Test Admin Dashboard

1. Go to CloudFront URL
2. Login with your admin email
3. Verify you can see:
   - User list
   - Analytics
   - Error logs
   - Feedback

### Test Mobile App

1. Download latest APK from Firebase
2. Install on phone
3. Create account
4. Add ingredients
5. Search recipes
6. Scan barcode
7. Submit feedback
8. Verify everything works!

---

## Part 8: Monitoring & Maintenance

### CloudWatch Logs

**View App Runner logs:**
1. Go to App Runner → cook-smart-api
2. Click "Logs" tab
3. View application logs
4. Set up alarms for errors

**View RDS metrics:**
1. Go to RDS → your instance
2. Click "Monitoring" tab
3. View CPU, memory, connections
4. Set up alarms for high usage

### Discord Notifications

Your Discord webhooks will send notifications for:
- Errors (real-time)
- User feedback
- User activity

### Cost Monitoring

1. Go to [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/)
2. View daily costs
3. Set up budget alerts
4. Monitor credit usage

---

## Deployment Checklist

### Backend Deployment
- [ ] Dockerfile created
- [ ] Docker build tested locally
- [ ] Secrets stored in Secrets Manager
- [ ] App Runner service created
- [ ] Environment variables configured
- [ ] API URL obtained
- [ ] Health check passes

### Database Setup
- [ ] Cook Smart database created in RDS
- [ ] Migrations run successfully
- [ ] Admin email added
- [ ] Database connection tested

### Admin Dashboard
- [ ] Dashboard built
- [ ] S3 bucket created
- [ ] Files uploaded to S3
- [ ] CloudFront distribution created
- [ ] Dashboard accessible
- [ ] Login works

### Mobile App
- [ ] API URL updated
- [ ] New APK built
- [ ] Uploaded to Firebase
- [ ] Testers notified
- [ ] App connects to production backend
- [ ] All features work

### Monitoring
- [ ] CloudWatch logs configured
- [ ] Discord webhooks tested
- [ ] Cost alerts set up
- [ ] Admin dashboard monitoring works

---

## Cost Summary

### Current AWS Usage: $9.91/month

### With Cook Smart Added:
- App Runner: +$0.50/month
- RDS storage: +$0.50/month
- S3 + CloudFront: +$0.20/month
- **New Total: ~$11.61/month**

### Your Cost:
- **$0/month for 9-10 months** (covered by $110.53 credits)
- **$12/month after credits** (well within $20 budget)

---

## Troubleshooting

### App Runner deployment fails

**Check logs:**
1. Go to App Runner → cook-smart-api → Logs
2. Look for build errors
3. Common issues:
   - Missing dependencies in package.json
   - TypeScript compilation errors
   - Port configuration

### Database connection fails

**Check:**
1. DATABASE_URL is correct in Secrets Manager
2. RDS security group allows connections
3. VPC configuration is correct
4. Database exists

### Admin dashboard not loading

**Check:**
1. S3 bucket is public
2. CloudFront distribution is deployed
3. Bucket policy allows CloudFront access
4. index.html exists in bucket

### Mobile app can't connect

**Check:**
1. API URL is correct in app
2. App Runner service is running
3. Health endpoint responds
4. CORS is configured correctly

---

## Next Steps

1. ✅ Deploy backend to App Runner
2. ✅ Set up database on RDS
3. ✅ Deploy admin dashboard to S3
4. ✅ Update mobile app API URL
5. ✅ Distribute to testers via Firebase
6. ⏭️ Monitor usage and feedback
7. ⏭️ Iterate based on tester feedback
8. ⏭️ Prepare for production launch

---

## Support Resources

**AWS Documentation:**
- [App Runner](https://docs.aws.amazon.com/apprunner/)
- [RDS](https://docs.aws.amazon.com/rds/)
- [S3](https://docs.aws.amazon.com/s3/)
- [CloudFront](https://docs.aws.amazon.com/cloudfront/)

**Your Infrastructure:**
- Backend API: https://your-app-runner-url.awsapprunner.com
- Admin Dashboard: https://your-cloudfront-url.cloudfront.net
- Database: your-rds-endpoint.rds.amazonaws.com
- App Distribution: Firebase Console

**You're all set! Your Cook Smart app is now running on AWS with Firebase distribution! 🚀**
