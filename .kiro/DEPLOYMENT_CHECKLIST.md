# Cook Smart - Deployment Checklist

## Pre-Deployment Checklist

### ✅ Code Ready
- [x] All features implemented
- [x] Admin system complete
- [x] API configuration created
- [x] Docker configuration ready
- [x] All tests passing
- [x] Zero TypeScript errors
- [x] Documentation complete

### ✅ Database Ready
- [x] All migrations created
- [x] Super admin email added to migration
- [ ] Production database created
- [ ] Migrations run on production

### ✅ Environment Variables
- [ ] JWT_SECRET generated
- [ ] ADMIN_JWT_SECRET generated
- [ ] DATABASE_URL configured
- [ ] Discord webhooks configured
- [ ] API keys configured (TheMealDB, Edamam)

### ✅ AWS Setup
- [ ] AWS account configured
- [ ] App Runner service created
- [ ] RDS instance created
- [ ] S3 bucket created (for admin dashboard)
- [ ] CloudFront distribution created

### ✅ Firebase Setup
- [ ] Firebase project created
- [ ] Android app added
- [ ] google-services.json downloaded
- [ ] App Distribution enabled

---

## Deployment Steps

### Step 1: Deploy Backend (30-60 minutes)

**1.1 Create Production Database**
```bash
# Connect to AWS RDS
psql -h your-rds-endpoint.rds.amazonaws.com -U your-username -d postgres

# Create database
CREATE DATABASE cook_smart;

# Exit
\q
```

**1.2 Run Migrations**
```bash
# Set DATABASE_URL
set DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/cook_smart

# Run migrations
cd backend
node run-migrations.js
```

**1.3 Verify Super Admin Email**
```bash
# Connect to database
psql -h your-rds-endpoint.rds.amazonaws.com -U your-username -d cook_smart

# Check approved emails
SELECT * FROM approved_admin_emails;

# Should see: tootallgames2020@gmail.com with is_super_admin = true
```

**1.4 Deploy to AWS App Runner**
- Push code to GitHub
- Create App Runner service
- Configure environment variables
- Deploy!

**1.5 Test Backend**
```bash
# Health check
curl https://your-app-runner-url.awsapprunner.com/health

# Test admin signup
curl -X POST https://your-app-runner-url.awsapprunner.com/api/v1/admin/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"tootallgames2020@gmail.com","username":"admin","password":"YourPassword123!","name":"Admin"}'

# Test admin login
curl -X POST https://your-app-runner-url.awsapprunner.com/api/v1/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword123!"}'
```

### Step 2: Build & Distribute Mobile App (15-30 minutes)

**2.1 Update Production API URL**
```typescript
// src/config/api.ts
export const API_BASE_URL = isDevelopment
  ? 'http://192.168.12.196:3000'
  : 'https://YOUR-ACTUAL-APP-RUNNER-URL.awsapprunner.com'; // UPDATE THIS!
```

**2.2 Update App Version**
```gradle
// android/app/build.gradle
versionCode 1
versionName "1.0.0"
```

**2.3 Build APK**
```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
cd ..
```

**2.4 Upload to Firebase**
```bash
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk \
  --app YOUR_FIREBASE_APP_ID \
  --groups "beta-testers" \
  --release-notes "Cook Smart v1.0.0 - Initial beta release"
```

**2.5 Invite Testers**
- Add tester emails in Firebase Console
- Testers receive email with download link
- Testers install and test!

### Step 3: Deploy Admin Dashboard (Optional - 1 hour)

**3.1 Admin Dashboard**
```bash
# Admin dashboard is integrated into website
# Deploys automatically with website deployment
# Access at: https://cooksmartapp.com/admin
```

**3.3 Configure CloudFront**
- Create distribution
- Point to S3 bucket
- Enable HTTPS

**3.4 Test Admin Dashboard**
- Go to CloudFront URL
- Login with your admin credentials
- Verify all features work

---

## Post-Deployment Verification

### Backend Verification
- [ ] Health endpoint responds
- [ ] Admin signup works
- [ ] Admin login works
- [ ] User registration works
- [ ] User login works
- [ ] Ingredients API works
- [ ] Recipes API works
- [ ] Barcode API works
- [ ] Feedback API works
- [ ] Discord notifications working

### Mobile App Verification
- [ ] APK installs successfully
- [ ] User can register
- [ ] User can login
- [ ] Can add ingredients
- [ ] Can search recipes
- [ ] Can scan barcodes
- [ ] Can submit feedback
- [ ] All navigation works

### Admin Dashboard Verification
- [ ] Can access dashboard
- [ ] Can login as admin
- [ ] Can see user list
- [ ] Can manage admins
- [ ] Can view activity logs

---

## Monitoring Setup

### CloudWatch Alarms
- [ ] Set up error rate alarm
- [ ] Set up response time alarm
- [ ] Set up database connection alarm
- [ ] Set up cost alarm

### Discord Notifications
- [ ] Verify error notifications working
- [ ] Verify feedback notifications working
- [ ] Verify activity notifications working

### Cost Monitoring
- [ ] Check AWS Cost Explorer
- [ ] Verify within budget ($20/month)
- [ ] Set up budget alerts

---

## Rollback Plan

### If Backend Fails:
1. Check CloudWatch logs
2. Verify environment variables
3. Check database connection
4. Rollback to previous version if needed

### If Mobile App Fails:
1. Share previous APK version
2. Fix issues
3. Build new APK
4. Redistribute

### If Database Fails:
1. Check RDS status
2. Verify connection string
3. Check security groups
4. Restore from backup if needed

---

## Success Criteria

### Backend:
- ✅ All endpoints responding
- ✅ Response time < 500ms
- ✅ Error rate < 1%
- ✅ Database connections stable

### Mobile App:
- ✅ APK installs successfully
- ✅ All features working
- ✅ No crashes
- ✅ Good performance

### Admin Dashboard:
- ✅ Can login
- ✅ Can manage users
- ✅ Can view analytics
- ✅ All features working

### Monitoring:
- ✅ CloudWatch logging working
- ✅ Discord notifications working
- ✅ Cost within budget
- ✅ No critical errors

---

## Timeline

### Day 1: Backend Deployment
- Morning: Deploy backend to AWS (1-2 hours)
- Afternoon: Test all endpoints (1 hour)
- Evening: Monitor for issues

### Day 2: Mobile App Distribution
- Morning: Build and test APK (1 hour)
- Afternoon: Distribute to testers (30 min)
- Evening: Collect initial feedback

### Day 3: Monitoring & Fixes
- Monitor usage
- Fix any issues
- Collect feedback
- Plan improvements

---

## Support Resources

### Documentation:
- `.kiro/AWS_DEPLOYMENT_GUIDE.md` - Complete AWS guide
- `.kiro/FIREBASE_APP_DISTRIBUTION_SETUP.md` - Firebase guide
- `.kiro/ADMIN_SYSTEM_COMPLETE.md` - Admin system docs

### Testing:
- `backend/test-admin-complete.js` - Admin system tests
- `backend/test-discord-notifications.js` - Discord tests

### Monitoring:
- AWS CloudWatch - Logs and metrics
- Discord - Real-time notifications
- Firebase - App distribution analytics

---

## Emergency Contacts

### AWS Support:
- Console: https://console.aws.amazon.com
- Support: https://console.aws.amazon.com/support

### Firebase Support:
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs

### Your Resources:
- Backend: AWS App Runner
- Database: AWS RDS
- Admin Dashboard: S3 + CloudFront
- Mobile App: Firebase App Distribution

---

## Final Checklist

Before going live:
- [ ] All tests passing
- [ ] All endpoints working
- [ ] Database migrations complete
- [ ] Environment variables set
- [ ] Monitoring configured
- [ ] Backup plan ready
- [ ] Rollback plan ready
- [ ] Support resources documented

**You're ready to deploy!** 🚀

---

## Quick Commands Reference

### Backend:
```bash
# Test locally
npm run dev

# Run tests
node test-admin-complete.js

# Build Docker
docker build -t cook-smart-backend .

# Run Docker
docker run -p 3000:3000 cook-smart-backend
```

### Mobile App:
```bash
# Build APK
cd android && .\gradlew assembleRelease && cd ..

# Upload to Firebase
firebase appdistribution:distribute android\app\build\outputs\apk\release\app-release.apk --app YOUR_APP_ID --groups "beta-testers"
```

### Database:
```bash
# Run migrations
node run-migrations.js

# Connect to database
psql -h your-rds-endpoint -U username -d cook_smart
```

**Good luck with your deployment!** 🎉
