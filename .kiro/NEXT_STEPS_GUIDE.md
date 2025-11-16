# Cook Smart - Complete Step-by-Step Guide to Launch 🚀

**Current Status:** Code complete, tested, and pushed to GitHub  
**Next Phase:** Deployment and Distribution  
**Timeline:** 1-2 weeks to beta launch

---

## Overview: What's Left to Do

You have 3 main paths to complete:

1. **Backend Deployment** (Deploy API to cloud)
2. **Mobile App Build** (Create APK for Android)
3. **Admin Dashboard** (Optional: Build web interface)

Let's tackle them one by one!

---

# Phase 1: Backend Deployment to AWS (Priority 1)

## Why This First?
Your mobile app needs the backend API to work. This is the foundation.

## Estimated Time: 2-3 hours
## Estimated Cost: $0-20/month (using free tiers)

---

## Step 1.1: Set Up AWS Account

### What You Need:
- AWS account (free tier eligible)
- Credit card (for verification, won't be charged if you stay in free tier)

### Actions:
1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Follow the signup process
4. Verify your email and phone
5. Add payment method (required but won't charge for free tier)

**Time:** 15 minutes

---

## Step 1.2: Set Up PostgreSQL Database (AWS RDS)

### Option A: Free Tier RDS (Recommended for Beta)

**Steps:**
1. Log into AWS Console
2. Search for "RDS" in the services search
3. Click "Create database"
4. Choose:
   - **Engine:** PostgreSQL
   - **Version:** PostgreSQL 15.x (latest)
   - **Template:** Free tier
   - **DB instance identifier:** `cook-smart-db`
   - **Master username:** `postgres`
   - **Master password:** Create a strong password (save it!)
   - **DB instance class:** db.t3.micro (free tier)
   - **Storage:** 20 GB (free tier)
   - **Public access:** Yes (for now, we'll secure it)
   - **VPC security group:** Create new
   - **Database name:** `cooksmartdb`

5. Click "Create database"
6. Wait 5-10 minutes for it to be available

**Save These Details:**
```
Database Endpoint: [will appear after creation]
Port: 5432
Database Name: cooksmartdb
Username: postgres
Password: [your password]
```

**Time:** 20 minutes (including wait time)

---

### Option B: Local PostgreSQL (For Testing First)

If you want to test locally before AWS:

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set
4. Open pgAdmin (installed with PostgreSQL)
5. Create database named `cooksmartdb`

**Time:** 15 minutes

---

## Step 1.3: Run Database Migrations

### Update Backend .env File

Edit `backend/.env`:
```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_RDS_ENDPOINT:5432/cooksmartdb

# Or for local testing:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cooksmartdb

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# APIs (get these from respective services)
EDAMAM_APP_ID=your-edamam-app-id
EDAMAM_APP_KEY=your-edamam-app-key

# Discord (optional for now)
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

### Run Migrations

```bash
cd backend
npm install
node run-migrations.js
```

**Expected Output:**
```
✅ Migration 001_create_users_table.sql - Success
✅ Migration 002_create_ingredients.sql - Success
✅ Migration 003_create_feedback.sql - Success
... (all 12 migrations)
✅ All migrations completed successfully!
```

**Time:** 5 minutes

---

## Step 1.4: Deploy Backend to AWS

### Option A: AWS Elastic Beanstalk (Easiest)

**Steps:**

1. **Install AWS CLI and EB CLI:**
```bash
# Install AWS CLI
# Download from: https://aws.amazon.com/cli/

# Install EB CLI
pip install awsebcli
```

2. **Initialize Elastic Beanstalk:**
```bash
cd backend
eb init

# Answer prompts:
# - Region: Choose closest to you (e.g., us-east-1)
# - Application name: cook-smart-backend
# - Platform: Node.js
# - Platform version: Latest
# - SSH: Yes (for debugging)
```

3. **Create Environment:**
```bash
eb create cook-smart-prod

# This will:
# - Create EC2 instance
# - Set up load balancer
# - Deploy your code
# - Give you a URL
```

4. **Set Environment Variables:**
```bash
eb setenv DATABASE_URL="postgresql://postgres:PASSWORD@RDS_ENDPOINT:5432/cooksmartdb" \
  JWT_SECRET="your-secret" \
  EDAMAM_APP_ID="your-id" \
  EDAMAM_APP_KEY="your-key" \
  NODE_ENV="production"
```

5. **Deploy:**
```bash
eb deploy
```

6. **Get Your API URL:**
```bash
eb status
# Look for "CNAME" - this is your API URL
# Example: cook-smart-prod.us-east-1.elasticbeanstalk.com
```

**Time:** 30 minutes

---

### Option B: AWS EC2 (More Control)

**Steps:**

1. **Launch EC2 Instance:**
   - Go to EC2 in AWS Console
   - Click "Launch Instance"
   - Choose: Ubuntu Server 22.04 LTS
   - Instance type: t2.micro (free tier)
   - Create new key pair (download .pem file)
   - Security group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (API)
   - Launch instance

2. **Connect to Instance:**
```bash
# Windows (use PuTTY or WSL)
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

3. **Install Node.js:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

4. **Deploy Code:**
```bash
# On your local machine
cd backend
npm run build

# Copy to EC2 (or use git)
scp -i your-key.pem -r dist package.json ubuntu@YOUR_EC2_IP:~/backend/

# On EC2
cd ~/backend
npm install --production
```

5. **Set Environment Variables:**
```bash
# On EC2
nano .env
# Paste your production environment variables
```

6. **Start Server:**
```bash
pm2 start dist/server.js --name cook-smart-api
pm2 save
pm2 startup
```

**Time:** 45 minutes

---

## Step 1.5: Test Backend Deployment

### Test API Endpoints:

```bash
# Replace with your actual API URL
curl https://your-api-url.com/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

### Test from Mobile App:

Update `src/config/api.ts`:
```typescript
export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local
  : 'https://your-api-url.com'; // Production
```

**Time:** 10 minutes

---

# Phase 2: Build Android APK (Priority 2)

## Estimated Time: 1-2 hours
## Estimated Cost: $0

---

## Step 2.1: Prepare for Build

### Update App Configuration

1. **Update API URL** (already done above)

2. **Update App Version:**

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0-beta"
    }
}
```

3. **Generate Signing Key:**

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore cook-smart-release.keystore -alias cook-smart -keyalg RSA -keysize 2048 -validity 10000

# Enter password when prompted (remember it!)
# Fill in the details (name, organization, etc.)
```

4. **Configure Signing:**

Create `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=cook-smart-release.keystore
MYAPP_RELEASE_KEY_ALIAS=cook-smart
MYAPP_RELEASE_STORE_PASSWORD=your-keystore-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**Time:** 20 minutes

---

## Step 2.2: Build APK

### Clean and Build:

```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

**Expected Output:**
```
BUILD SUCCESSFUL in 5m 23s
```

**APK Location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**Time:** 30 minutes (including build time)

---

## Step 2.3: Test APK

### Install on Your Device:

**Option A: USB Connection**
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Option B: Manual Transfer**
1. Copy APK to your phone
2. Open file manager
3. Tap APK file
4. Allow installation from unknown sources
5. Install

### Test Checklist:
- [ ] App opens without crashing
- [ ] Can register new account
- [ ] Can login
- [ ] Can add ingredients
- [ ] Can search recipes
- [ ] Can scan barcodes
- [ ] All screens load properly

**Time:** 15 minutes

---

# Phase 3: Distribute to Beta Testers

## Estimated Time: 30 minutes
## Estimated Cost: $0 (Firebase free tier)

---

## Step 3.1: Set Up Firebase App Distribution

### Create Firebase Project:

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "Cook Smart"
4. Disable Google Analytics (optional for beta)
5. Create project

### Add Android App:

1. Click "Add app" → Android
2. Package name: `com.cooksmart` (from your app)
3. Download `google-services.json`
4. Place in `android/app/`
5. Follow setup instructions

### Enable App Distribution:

1. In Firebase Console, go to "App Distribution"
2. Click "Get started"
3. Upload your APK
4. Add tester emails
5. Click "Distribute"

**Time:** 20 minutes

---

## Step 3.2: Invite Beta Testers

### Add Testers:

1. In App Distribution, click "Testers & Groups"
2. Add tester emails
3. Click "Invite"

### Testers Will:
1. Receive email invitation
2. Click link to download APK
3. Install and test

**Time:** 10 minutes

---

# Phase 4: Admin Dashboard (Optional)

## Estimated Time: 2-3 hours
## Estimated Cost: $0 (Netlify/Vercel free tier)

---

## Step 4.1: Build React Admin Dashboard

### Install Dependencies:

```bash
cd admin-dashboard
npm install
```

### Update API Configuration:

Edit `admin-dashboard/src/config.ts`:
```typescript
export const API_BASE_URL = 'https://your-api-url.com';
```

### Build:

```bash
npm run build
```

**Time:** 15 minutes

---

## Step 4.2: Deploy to Netlify

### Steps:

1. Go to https://www.netlify.com
2. Sign up (free)
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `build` folder
5. Get your URL (e.g., `cook-smart-admin.netlify.app`)

**Alternative: Vercel**
1. Go to https://vercel.com
2. Import from GitHub
3. Select `admin-dashboard` folder
4. Deploy

**Time:** 15 minutes

---

# Summary Checklist

## Must Do (Critical Path):
- [ ] Set up AWS account
- [ ] Create RDS PostgreSQL database
- [ ] Run database migrations
- [ ] Deploy backend to AWS
- [ ] Test backend API
- [ ] Build Android APK
- [ ] Test APK on device
- [ ] Set up Firebase App Distribution
- [ ] Distribute to beta testers

## Nice to Have:
- [ ] Build admin dashboard
- [ ] Deploy admin dashboard
- [ ] Set up monitoring
- [ ] Configure custom domain

---

# Estimated Timeline

**Week 1:**
- Day 1-2: AWS setup and backend deployment
- Day 3-4: Build and test APK
- Day 5: Firebase setup and distribution

**Week 2:**
- Day 1-2: Beta testing and bug fixes
- Day 3-4: Admin dashboard (optional)
- Day 5: Polish and prepare for wider release

---

# Cost Breakdown

**Free Tier (First Year):**
- AWS RDS: Free (db.t3.micro, 20GB)
- AWS EC2: Free (t2.micro, 750 hours/month)
- Firebase: Free (up to 100 testers)
- Netlify/Vercel: Free

**After Free Tier (~$20-50/month):**
- AWS RDS: $15-25/month
- AWS EC2: $10-15/month
- Firebase: Free (unless you exceed limits)
- Netlify/Vercel: Free

---

# Need Help?

## Documentation Available:
- `.kiro/AWS_DEPLOYMENT_GUIDE.md` - Detailed AWS setup
- `.kiro/FIREBASE_APP_DISTRIBUTION_SETUP.md` - Firebase guide
- `.kiro/ADMIN_DASHBOARD_BUILD_GUIDE.md` - Admin dashboard

## Common Issues:
- **Database connection fails:** Check security group allows port 5432
- **APK won't install:** Enable "Install from unknown sources"
- **API not responding:** Check EC2 security group allows port 3000

---

**You're ready to launch! Let's do this! 🚀**
