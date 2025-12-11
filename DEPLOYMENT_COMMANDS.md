# Cook Smart - Deployment Commands Reference

## Quick Deployment Commands

### Backend Deployment (Manual)
```bash
# 1. SSH into EC2
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150

# 2. Navigate and update
cd /home/ubuntu/cook-smart/backend/backend
git pull origin fresh-project-migration
npm install
npm run build
pm2 restart cook-smart-backend

# 3. Verify deployment
pm2 status
pm2 logs cook-smart-backend --lines 10
curl http://localhost:3000/health

# 4. Exit
exit
```

### Website Deployment (Auto)
```bash
# 1. Make changes in website/
# 2. Commit and push (triggers auto-deploy)
git add website/
git commit -m "Website: description of changes"
git push origin fresh-project-migration

# 3. Wait 5-10 minutes for AWS deployment
# 4. Verify
curl -I https://cooksmartapp.com
```

### Mobile App Build
```bash
# 1. Ensure API config is correct
# Check src/config/api.ts for production URL

# 2. Build release APK
cd android
gradlew clean
gradlew assembleRelease --no-daemon

# 3. APK location
# android/app/build/outputs/apk/release/app-release.apk

# 4. Test APK connects to production
# Install and verify it uses https://api.cooksmartapp.com
```

## Health Check Commands

### Backend Health
```bash
# Production API
curl https://api.cooksmartapp.com/health

# Local development
curl http://localhost:3000/health

# Direct EC2 (if SSH accessible)
curl http://34.203.8.150:3000/health
```

### Database Health
```bash
# Test connection
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb -c "SELECT 1;"

# Check admin users
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb \
     -c "SELECT COUNT(*) FROM admin_users;"
```

### EC2 Status
```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1 \
  --query "Reservations[0].Instances[0].State.Name" --output text

# Check PM2 processes remotely
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 "pm2 status"
```

## Emergency Recovery Commands

### Restart Backend
```bash
# If backend is unresponsive
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 20
```

### Restart EC2 Instance
```bash
# If EC2 is unresponsive
aws ec2 reboot-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1

# Wait for restart
sleep 60
aws ec2 describe-instances --instance-ids i-05e0746da4f5f9da0 --region us-east-1 \
  --query "Reservations[0].Instances[0].State.Name" --output text
```

### Force Website Redeploy
```bash
# Trigger redeploy by pushing empty commit
git commit --allow-empty -m "Force redeploy"
git push origin fresh-project-migration
```

## Testing Commands

### Test Admin Authentication
```bash
# Test admin login
node test-admin-email-login.js

# Test admin endpoints
node test-admin-me-endpoint.js

# Check admin setup
node backend/check-admin-setup.js
```

### Test Mobile API Connection
```bash
# Test from mobile app perspective
curl -H "User-Agent: CookSmart/1.0" https://api.cooksmartapp.com/health

# Test specific endpoints
curl https://api.cooksmartapp.com/api/v1/test
```

## Build Commands

### Backend Build
```bash
cd backend
npm install
npm run build
npm start  # Test locally
```

### Website Build
```bash
cd website
npm install
npm run build
npm run start  # Test production build locally
```

### Mobile App Build
```bash
# Development
npm install
npm start

# Release build
cd android
gradlew assembleRelease --no-daemon

# Debug build
gradlew assembleDebug
```

## Database Commands

### Admin User Management
```bash
# Check admin users
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb \
     -c "SELECT id, email, username, email_verified FROM admin_users;"

# Check approved emails
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb \
     -c "SELECT email, is_super_admin FROM approved_admin_emails;"
```

### Database Backup
```bash
# Create backup
pg_dump -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
        -U cooksmartadmin -d cooksmartdb > backup_$(date +%Y%m%d).sql

# Restore backup (if needed)
psql -h cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com \
     -U cooksmartadmin -d cooksmartdb < backup_20251211.sql
```

## Monitoring Commands

### Check Logs
```bash
# Backend logs
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "pm2 logs cook-smart-backend --lines 50"

# System logs
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "sudo journalctl -u pm2-ubuntu --lines 20"
```

### Check Resource Usage
```bash
# EC2 resource usage
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "top -bn1 | head -20"

# Disk usage
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "df -h"

# Memory usage
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "free -h"
```

### Check AWS Costs
```bash
# Current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-12-01,End=2025-12-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

## Git Commands

### Standard Workflow
```bash
# Check status
git status

# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to main branch
git push origin fresh-project-migration

# Check recent commits
git log --oneline -10
```

### Emergency Rollback
```bash
# See recent commits
git log --oneline -5

# Rollback to previous commit
git reset --hard HEAD~1
git push --force origin fresh-project-migration

# Or rollback to specific commit
git reset --hard COMMIT_HASH
git push --force origin fresh-project-migration
```

## Environment Variables

### Backend (.env)
```bash
# View current environment (on EC2)
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "cd /home/ubuntu/cook-smart/backend/backend && head -10 .env"

# Update environment variable
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "cd /home/ubuntu/cook-smart/backend/backend && sed -i 's/OLD_VALUE/NEW_VALUE/' .env"

# Restart after env change
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 \
  "pm2 restart cook-smart-backend"
```

### Website (.env.local)
```bash
# Website env is in repository (website/.env.local)
# Changes deploy automatically with git push
```

## SSL Certificate

### Check SSL Status
```bash
# Check certificate expiry
openssl s_client -connect api.cooksmartapp.com:443 -servername api.cooksmartapp.com 2>/dev/null | \
  openssl x509 -noout -dates

# Check website SSL
openssl s_client -connect cooksmartapp.com:443 -servername cooksmartapp.com 2>/dev/null | \
  openssl x509 -noout -dates
```

## DNS Commands

### Check DNS Resolution
```bash
# Check API domain
nslookup api.cooksmartapp.com

# Check website domain
nslookup cooksmartapp.com

# Check from different DNS servers
nslookup api.cooksmartapp.com 8.8.8.8
```

## Performance Testing

### Load Testing
```bash
# Simple load test
for i in {1..10}; do
  curl -w "%{time_total}\n" -o /dev/null -s https://api.cooksmartapp.com/health
done

# Concurrent requests
seq 1 10 | xargs -n1 -P10 -I{} curl -s https://api.cooksmartapp.com/health
```

### Response Time Testing
```bash
# Test API response times
curl -w "Total: %{time_total}s\n" -o /dev/null -s https://api.cooksmartapp.com/health

# Test admin login performance
time node test-admin-email-login.js
```

---

**Last Updated**: December 11, 2025
**Purpose**: Quick reference for all deployment and maintenance commands
**Usage**: Copy-paste commands for common operations