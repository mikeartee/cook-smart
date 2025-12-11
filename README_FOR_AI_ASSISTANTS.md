# Cook Smart - AI Assistant Reference Guide

## For Amazon Q, GitHub Copilot, and Other AI Assistants

This document provides essential context for AI assistants working on the Cook Smart project.

## Project Overview

**Cook Smart** is a recipe and meal planning application with:
- **Mobile App**: React Native (Android, iOS planned)
- **Website**: Next.js 14 with admin dashboard
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL on AWS RDS
- **Infrastructure**: AWS (EC2, RDS, Route 53)

## Key Documentation Files

1. **`DEVELOPER_GUIDE.md`** - Complete development reference
2. **`TROUBLESHOOTING_ADMIN_AUTH.md`** - Admin authentication issues
3. **`DEPLOYMENT_COMMANDS.md`** - All deployment commands
4. **`.kiro/steering/`** - Project rules and coding standards

## Critical Information

### Current Infrastructure
- **AWS Account**: 976289921508
- **Region**: us-east-1
- **EC2 Instance**: i-05e0746da4f5f9da0 (34.203.8.150)
- **Database**: cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
- **Main Branch**: fresh-project-migration

### URLs
- **Website**: https://cooksmartapp.com
- **Admin Dashboard**: https://cooksmartapp.com/admin
- **API**: https://api.cooksmartapp.com
- **Health Check**: https://api.cooksmartapp.com/health

### Authentication Systems
**Two separate auth systems exist:**

1. **Regular Users** (Mobile + Website)
   - Login: `/api/v1/auth/login`
   - User Info: `/api/v1/auth/me`

2. **Admin Users** (Admin Dashboard)
   - Login: `/api/v1/admin/auth/login`
   - User Info: `/api/v1/admin/auth/me`

### Current Admin Account
- **Email**: bradturnbough80@gmail.com
- **Username**: brad
- **Password**: June172018!

## Common Issues & Quick Fixes

### Backend Not Responding
```bash
# Check and restart
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
pm2 restart cook-smart-backend
```

### Admin Login Issues
```bash
# Test admin authentication
node test-admin-email-login.js
```

### Mobile App API Issues
**Check**: `src/config/api.ts` - Must use production URL in releases

## File Structure Priority

### Most Important Files
1. `src/config/api.ts` - Mobile API configuration
2. `backend/.env` - Backend environment variables
3. `website/contexts/auth-context.tsx` - Authentication logic
4. `backend/src/controllers/AdminAuthController.ts` - Admin auth

### Configuration Files
- `backend/.env` - Backend secrets and config
- `website/.env.local` - Website environment
- `android/app/src/main/res/values/strings.xml` - Android config

## Deployment Process

### Backend (Manual)
1. SSH to EC2: `ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150`
2. Update code: `git pull origin fresh-project-migration`
3. Build: `npm run build`
4. Restart: `pm2 restart cook-smart-backend`

### Website (Automatic)
1. Push to GitHub: `git push origin fresh-project-migration`
2. Wait 5-10 minutes for AWS auto-deploy

### Mobile App
1. Build: `cd android && gradlew assembleRelease`
2. APK location: `android/app/build/outputs/apk/release/`

## Testing Scripts Available

- `test-admin-email-login.js` - Test admin login
- `test-admin-me-endpoint.js` - Test admin endpoints
- `backend/check-admin-setup.js` - Check admin database
- `backend/add-approved-email.js` - Add admin email
- `backend/reset-admin-password.js` - Reset admin password

## Budget Constraints

- **Emergency Budget**: $20/month
- **Priority**: Free tier and open-source solutions
- **Always check costs** before adding services

## Security Notes

- SSH key required: `~/.ssh/cook-smart-key.pem`
- Secrets in `.env` files (never commit)
- Admin emails must be pre-approved
- Two-factor authentication via email verification

## Recent Issues Resolved

### Admin Authentication (December 11, 2025)
**Problem**: Admin dashboard login failed
**Root Cause**: 
1. Backend expected username, frontend sent email
2. Wrong API endpoints called (regular vs admin)

**Solution**:
1. Modified `AdminAuthController.ts` to accept email or username
2. Updated `auth-context.tsx` to use admin endpoints for admin pages

## Code Quality Standards

### TypeScript
- Explicit type annotations required
- No `any` types unless necessary
- Interfaces for all object structures

### API Configuration
- Development: `http://192.168.12.196:3000`
- Production: `https://api.cooksmartapp.com`
- **CRITICAL**: Release builds must use production URL

### File Hygiene
- Delete test files after use (`test-*.js`)
- No temporary files in commits
- Clean repository structure

## Emergency Contacts

- **Support Email**: services.cooksmart@gmail.com
- **Discord**: https://discord.gg/7mAeMvjGVH
- **Repository**: https://github.com/tootallgames2020/cook-smart

## Quick Health Checks

```bash
# Backend health
curl https://api.cooksmartapp.com/health

# EC2 status
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Database connection
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com -U cooksmartadmin -d cooksmartdb -c "SELECT 1;"

# Admin authentication
node test-admin-email-login.js
```

## When Things Break

1. **Check backend health** first
2. **Verify EC2 is running** 
3. **Check PM2 processes**
4. **Review recent deployments**
5. **Check database connectivity**

## AI Assistant Guidelines

### When Helping with Code
1. **Always check** `DEVELOPER_GUIDE.md` first
2. **Follow** coding standards in `.kiro/steering/`
3. **Test changes** with provided scripts
4. **Verify** API configurations are correct
5. **Check** budget implications for new services

### When Troubleshooting
1. **Start with** health checks
2. **Use** existing testing scripts
3. **Check** recent commits for changes
4. **Refer to** `TROUBLESHOOTING_ADMIN_AUTH.md` for auth issues
5. **Follow** deployment commands exactly

### When Making Changes
1. **Test locally** first
2. **Use proper** git workflow
3. **Deploy backend** manually via SSH
4. **Website deploys** automatically
5. **Verify** changes work in production

---

**Last Updated**: December 11, 2025
**Purpose**: Essential context for AI assistants
**Audience**: Amazon Q, GitHub Copilot, future developers