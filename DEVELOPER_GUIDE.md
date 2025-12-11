# Cook Smart - Complete Developer Guide

## Project Overview

Cook Smart is a React Native mobile app with a Next.js website and Node.js backend. This guide contains everything needed to develop, deploy, and troubleshoot the system.

## Architecture

```
Cook Smart System
├── Mobile App (React Native - NO Expo)
├── Website (Next.js 14 - includes admin dashboard)
├── Backend API (Node.js/Express + TypeScript)
├── Database (PostgreSQL on AWS RDS)
└── Infrastructure (AWS EC2, Route 53, etc.)
```

## Repository Structure

```
cook-smart/
├── src/                     # React Native mobile app
│   ├── components/
│   ├── screens/
│   ├── config/api.ts        # API configuration (CRITICAL)
│   └── services/
├── website/                 # Next.js website + admin dashboard
│   ├── app/
│   │   ├── admin/          # Admin dashboard pages
│   │   └── ...
│   ├── contexts/auth-context.tsx  # Authentication logic
│   └── lib/api-client.ts   # API client
├── backend/                # Node.js/Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.ts       # Main server file
│   ├── .env                # Environment variables
│   └── dist/               # Compiled TypeScript
├── android/                # Android build files
├── infrastructure/         # AWS CloudFormation templates
└── .kiro/steering/         # Project rules and guidelines
```

## Critical Configuration Files

### 1. Mobile App API Configuration
**File**: `src/config/api.ts`
```typescript
// CRITICAL: Always use production URL in release builds
const isDevelopment = __DEV__ && !process.env.REACT_APP_FORCE_PRODUCTION;

export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000' // Local development only
  : 'https://api.cooksmartapp.com'; // Production (used in all release builds)
```

### 2. Backend Environment Variables
**File**: `backend/.env`
```env
# Database
DB_HOST=cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=cooksmartdb
DB_USER=cooksmartadmin
DB_PASSWORD=CookSmart2024!

# JWT
JWT_SECRET=cook_smart_jwt_secret_2024_very_long_and_secure_key_for_production

# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SRkHlKSbJqCZWWDLbbUxcsh5Nd2nrQOpuuCnJ5U8RdDVNKAdL954YDcfREHkooJaOPyR0guknOo1coRO0c8BnpZ0004oWidmO

# FatSecret API (Primary Recipe Source)
FATSECRET_CLIENT_ID=e2cf80c43b0c4687ba237b45438c4ad4
FATSECRET_CLIENT_SECRET=3ce76986cd444c4084d093f70f3e36bf

# Discord Webhooks
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD

# Email
RESEND_API_KEY=re_YTJB5qiM_LM8APhhAo6MyyLYysTdk8GR6
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# Server
PORT=3000
NODE_ENV=production
```

## AWS Infrastructure

### Current Setup
- **Account ID**: 976289921508
- **Region**: us-east-1
- **EC2 Instance**: i-05e0746da4f5f9da0 (34.203.8.150)
- **Database**: cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
- **Domain**: cooksmartapp.com → api.cooksmartapp.com

### SSH Access
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
```

## Development Commands

### Backend Development
```bash
# Local development
cd backend
npm install
npm run build
npm start

# Check if running
curl http://localhost:3000/health

# Production deployment
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd /home/ubuntu/cook-smart/backend/backend
git pull origin fresh-project-migration
npm install
npm run build
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 20
```

### Website Development
```bash
# Local development
cd website
npm install
npm run dev

# Production deployment (auto-deploys from GitHub)
git add website/
git commit -m "Update: description"
git push origin fresh-project-migration
# Wait 5-10 minutes for AWS auto-deploy
```

### Mobile App Development
```bash
# Development
npm install
npm start

# Android build
cd android
gradlew assembleRelease
# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## Authentication System

### Two Separate Auth Systems

1. **Regular Users** (Mobile App + Website)
   - Login: `/api/v1/auth/login`
   - User Info: `/api/v1/auth/me`
   - Database: `users` table

2. **Admin Users** (Admin Dashboard)
   - Login: `/api/v1/admin/auth/login`
   - User Info: `/api/v1/admin/auth/me`
   - Database: `admin_users` + `approved_admin_emails` tables

### Admin User Management
```bash
# Check admin setup
node backend/check-admin-setup.js

# Add approved admin email
node backend/add-approved-email.js

# Reset admin password
node backend/reset-admin-password.js

# Test admin login
node test-admin-email-login.js
```

### Current Admin Account
- **Username**: brad
- **Email**: bradturnbough80@gmail.com
- **Password**: June172018!
- **Access**: Super Admin

## Common Issues & Solutions

### 1. Backend Not Responding
**Symptoms**: API timeouts, admin dashboard login fails
**Solution**:
```bash
# Check if EC2 is running
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# SSH and check PM2
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
pm2 status
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend
```

### 2. Admin Login Issues
**Symptoms**: "Invalid credentials" or redirects back to login
**Check**:
1. Backend is running: `curl https://api.cooksmartapp.com/health`
2. Admin endpoints work: `node test-admin-email-login.js`
3. Website deployed: Check GitHub Actions or wait 10 minutes after push

### 3. Mobile App Connection Issues
**Symptoms**: "JSON Parse error", network errors
**Check**:
1. API configuration in `src/config/api.ts`
2. Release builds use production URL
3. Development uses local IP: `http://192.168.12.196:3000`

### 4. TypeScript Compilation Errors
**Solution**:
```bash
cd backend
npm run build
# Fix any errors shown
```

## Testing Commands

### Test Backend Health
```bash
curl https://api.cooksmartapp.com/health
curl http://localhost:3000/health  # Local
```

### Test Admin Authentication
```bash
node test-admin-email-login.js
node test-admin-me-endpoint.js
```

### Test Mobile API Connection
```bash
# From mobile app directory
curl http://192.168.12.196:3000/health  # Development
curl https://api.cooksmartapp.com/health  # Production
```

## Deployment Workflows

### 1. Backend Changes
```bash
# 1. Make changes in backend/
# 2. Test locally
cd backend && npm run build && npm start

# 3. Commit and push
git add backend/
git commit -m "Backend: description"
git push origin fresh-project-migration

# 4. Deploy to production
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
cd /home/ubuntu/cook-smart/backend/backend
git pull origin fresh-project-migration
npm run build
pm2 restart cook-smart-backend
```

### 2. Website Changes
```bash
# 1. Make changes in website/
# 2. Test locally
cd website && npm run dev

# 3. Commit and push (auto-deploys)
git add website/
git commit -m "Website: description"
git push origin fresh-project-migration
# Wait 5-10 minutes for deployment
```

### 3. Mobile App Changes
```bash
# 1. Make changes in src/
# 2. Test locally
npm start

# 3. Build release APK
cd android
gradlew assembleRelease

# 4. Test APK connects to production
# Install APK and verify it connects to https://api.cooksmartapp.com
```

## Database Access

### Direct Database Connection
```bash
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin \
     -d cooksmartdb
```

### Key Tables
- `users` - Regular app users
- `admin_users` - Admin dashboard users
- `approved_admin_emails` - Approved admin emails
- `recipes` - Recipe data
- `ingredients` - Ingredient data

## Environment Setup

### Required Tools
- Node.js 18+
- npm
- AWS CLI (configured with account 976289921508)
- SSH key: `~/.ssh/cook-smart-key.pem`
- Android Studio (for mobile development)

### AWS CLI Setup
```bash
aws configure
# Access Key ID: [from AWS IAM]
# Secret Access Key: [from AWS IAM]
# Default region: us-east-1
# Default output format: json
```

## Monitoring & Logs

### Backend Logs
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
pm2 logs cook-smart-backend --lines 50
```

### Website Logs
- Check AWS CloudWatch or deployment logs
- GitHub Actions for deployment status

### Database Monitoring
- AWS RDS Console
- CloudWatch metrics

## Security Notes

### Secrets Management
- Backend secrets in `backend/.env`
- Website secrets in `website/.env.local`
- Never commit secrets to Git
- SSH key required for EC2 access

### Admin Access
- Admin emails must be pre-approved in `approved_admin_emails` table
- Admin users created separately from regular users
- Super admin flag for elevated permissions

## Budget & Cost Control

### Current Budget
- **Emergency Budget**: $20/month
- **Priority**: Free tier and open-source solutions
- **Monitoring**: CloudWatch alarm at $15/month

### Cost Check
```bash
# Check AWS costs
aws ce get-cost-and-usage --time-period Start=2025-12-01,End=2025-12-31 --granularity MONTHLY --metrics BlendedCost
```

## Troubleshooting Checklist

When something breaks:

1. **Check Backend Health**
   ```bash
   curl https://api.cooksmartapp.com/health
   ```

2. **Check EC2 Status**
   ```bash
   aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1
   ```

3. **Check PM2 Process**
   ```bash
   ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 status"
   ```

4. **Check Recent Deployments**
   - GitHub commits
   - AWS deployment logs

5. **Check Database Connection**
   ```bash
   psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com -U cooksmartadmin -d cooksmartdb -c "SELECT 1;"
   ```

## Contact Information

- **Support Email**: services.cooksmart@gmail.com
- **Discord Community**: https://discord.gg/7mAeMvjGVH
- **Repository**: https://github.com/tootallgames2020/cook-smart
- **Branch**: fresh-project-migration

## Quick Reference

### URLs
- **Website**: https://cooksmartapp.com
- **Admin Dashboard**: https://cooksmartapp.com/admin
- **API**: https://api.cooksmartapp.com
- **Health Check**: https://api.cooksmartapp.com/health

### Key Files to Know
- `src/config/api.ts` - Mobile API configuration
- `backend/.env` - Backend environment variables
- `website/contexts/auth-context.tsx` - Authentication logic
- `backend/src/controllers/AdminAuthController.ts` - Admin authentication
- `.kiro/steering/` - Project rules and guidelines

---

**Last Updated**: December 11, 2025
**Maintained By**: Development Team
**Purpose**: Complete reference for developers and AI assistants
