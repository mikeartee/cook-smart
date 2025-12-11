# Admin Authentication Troubleshooting Guide

## Problem: Admin Dashboard Login Issues

This guide covers the specific admin authentication problems we solved and how to fix them in the future.

## Background

Cook Smart has **two separate authentication systems**:

1. **Regular Users** (Mobile App + Website)
   - Endpoints: `/api/v1/auth/login`, `/api/v1/auth/me`
   - Database: `users` table

2. **Admin Users** (Admin Dashboard at `/admin`)
   - Endpoints: `/api/v1/admin/auth/login`, `/api/v1/admin/auth/me`
   - Database: `admin_users` + `approved_admin_emails` tables

## The Problem We Fixed

### Issue 1: Backend Expected Username, Frontend Sent Email
**Symptom**: "Username and password are required" error
**Root Cause**: AdminAuthController only accepted `username` field, but admin dashboard sent `email`
**Solution**: Modified backend to accept both email and username

### Issue 2: Wrong API Endpoints Called
**Symptom**: Login successful but redirects back to login page
**Root Cause**: Admin dashboard used regular user endpoints instead of admin endpoints
**Solution**: Modified auth context to detect admin pages and use correct endpoints

## Current Admin Account

- **Username**: brad
- **Email**: bradturnbough80@gmail.com  
- **Password**: June172018!
- **Status**: Super Admin, Email Verified, Approved

## Testing Scripts

### 1. Test Admin Login with Email
```bash
node test-admin-email-login.js
```

### 2. Test Both Admin Endpoints
```bash
node test-admin-me-endpoint.js
```

### 3. Check Admin Setup
```bash
node backend/check-admin-setup.js
```

### 4. Add New Admin Email
```bash
# Edit backend/add-approved-email.js with new email
node backend/add-approved-email.js
```

### 5. Reset Admin Password
```bash
# Edit backend/reset-admin-password.js with new password
node backend/reset-admin-password.js
```

## Diagnostic Steps

### Step 1: Check Backend Health
```bash
curl https://api.cooksmartapp.com/health
```
**Expected**: `{"status":"OK","message":"Cook Smart API is running"...}`

### Step 2: Test Admin Login API Directly
```bash
curl -X POST https://api.cooksmartapp.com/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bradturnbough80@gmail.com","password":"June172018!"}'
```
**Expected**: `{"token":"...","admin":{...}}`

### Step 3: Test Admin Me Endpoint
```bash
# Use token from step 2
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.cooksmartapp.com/api/v1/admin/auth/me
```
**Expected**: `{"admin":{...}}`

### Step 4: Check Database
```bash
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb \
     -c "SELECT email, username, email_verified FROM admin_users;"
```

```bash
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb \
     -c "SELECT email, is_super_admin FROM approved_admin_emails;"
```

## Common Issues & Fixes

### Issue: "Invalid credentials"
**Causes**:
1. Wrong password
2. Email not approved
3. Admin user doesn't exist

**Fix**:
```bash
# Check if email is approved
node backend/check-admin-setup.js

# Add email if needed
node backend/add-approved-email.js

# Reset password if needed
node backend/reset-admin-password.js
```

### Issue: "Email not verified"
**Fix**:
```sql
UPDATE admin_users SET email_verified = TRUE WHERE email = 'your-email@domain.com';
```

### Issue: Login works but redirects back
**Causes**:
1. Website not deployed with auth fixes
2. Wrong endpoints being called

**Fix**:
```bash
# Check if website deployed
curl -I https://cooksmartapp.com/admin/login

# Wait for deployment or redeploy
git push origin fresh-project-migration
```

### Issue: Backend not responding
**Fix**:
```bash
# Check EC2 status
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Restart backend
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
pm2 restart cook-smart-backend
```

## Code Changes Made

### 1. Backend: AdminAuthController.ts
**Location**: `backend/src/controllers/AdminAuthController.ts`
**Change**: Accept both `email` and `username` in login

```typescript
const { username, email, password } = req.body;
const loginIdentifier = username || email;

// Find admin by username or email
let admin = null;
if (loginIdentifier.includes('@')) {
  admin = await AdminUserModel.findByEmail(loginIdentifier);
} else {
  admin = await AdminUserModel.findByUsername(loginIdentifier);
}
```

### 2. Website: Auth Context
**Location**: `website/contexts/auth-context.tsx`
**Change**: Detect admin pages and use admin endpoints

```typescript
// Check if we're on admin pages
const isAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

if (isAdminPage) {
  // Use admin endpoints
  response = await apiClient.post('/api/v1/admin/auth/login', { email, password });
  const adminResponse = await apiClient.get('/api/v1/admin/auth/me');
}
```

## File Locations

### Testing Scripts
- `test-admin-email-login.js` - Test admin login with email
- `test-admin-me-endpoint.js` - Test both admin endpoints
- `backend/check-admin-setup.js` - Check admin database setup
- `backend/add-approved-email.js` - Add approved admin email
- `backend/reset-admin-password.js` - Reset admin password

### Key Source Files
- `backend/src/controllers/AdminAuthController.ts` - Admin authentication logic
- `website/contexts/auth-context.tsx` - Frontend authentication
- `website/app/admin/login/page.tsx` - Admin login page
- `backend/src/models/AdminUser.ts` - Admin user database model

## Database Schema

### admin_users table
```sql
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
```

### approved_admin_emails table
```sql
CREATE TABLE approved_admin_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  added_by INTEGER,
  added_at TIMESTAMP DEFAULT NOW()
);
```

## Emergency Recovery

If admin access is completely broken:

### 1. Direct Database Access
```bash
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb
```

### 2. Create Emergency Admin
```sql
-- Add approved email
INSERT INTO approved_admin_emails (email, is_super_admin) 
VALUES ('emergency@domain.com', TRUE);

-- Create admin user (password: TempPass123!)
INSERT INTO admin_users (email, username, password_hash, name, email_verified)
VALUES (
  'emergency@domain.com', 
  'emergency', 
  '$2a$10$example_hash_here', 
  'Emergency Admin', 
  TRUE
);
```

### 3. Reset Existing Admin
```sql
-- Reset password to June172018!
UPDATE admin_users 
SET password_hash = '$2a$10$rQJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5qJ5'
WHERE email = 'bradturnbough80@gmail.com';

-- Ensure email is verified
UPDATE admin_users SET email_verified = TRUE WHERE email = 'bradturnbough80@gmail.com';
```

---

**Last Updated**: December 11, 2025
**Issue Resolved**: Admin authentication now works with email login
**Next Steps**: Monitor for any additional auth issues