# Deploy Social & Advanced Features 🚀

Quick guide to deploy the new social and advanced recipe features.

## 📋 Pre-Deployment Checklist

- [ ] Backend code committed to git
- [ ] Frontend code committed to git
- [ ] Database backup created
- [ ] Server access confirmed

## 🗄️ Step 1: Run Database Migrations

### Local Testing (Optional)
```bash
cd backend
node run-social-migrations.js
```

### Production Deployment
```bash
# SSH into server
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24

# Navigate to backend
cd /home/ubuntu/cook-smart/backend

# Pull latest code
git pull origin fresh-project-migration

# Run migrations
node run-social-migrations.js
```

## 🔧 Step 2: Deploy Backend

```bash
# Still on server
cd /home/ubuntu/cook-smart/backend

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Restart server
pm2 restart cook-smart-backend

# Check status
pm2 status
pm2 logs cook-smart-backend --lines 50
```

## 📱 Step 3: Build & Test Frontend

### Test Locally First
```bash
# On local machine
cd c:\Users\toota\Documents\Projects\cook-smart

# Install dependencies (if needed)
npm install

# Run on Android
npm run android
```

### Build APK (When Ready)
```bash
cd android
cmd /c gradlew.bat assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## ✅ Step 4: Verify Deployment

### Test Backend APIs
```bash
# Health check
curl https://api.cooksmartapp.com/health

# Test social endpoints (requires auth token)
curl https://api.cooksmartapp.com/api/v1/social/trending

# Test advanced recipe endpoints
curl https://api.cooksmartapp.com/api/v1/advanced-recipes/seasonal/current/recipes
```

### Test Frontend Features
1. Open app
2. Navigate to recipe detail
3. Test like button
4. Test comment section
5. Test share button
6. Test step-by-step cooking mode
7. Check trending recipes
8. Check seasonal recipes
9. Check community feed

## 🎯 New Features to Test

### Social Features
- [ ] Follow/unfollow users
- [ ] Like recipes
- [ ] Comment on recipes
- [ ] Share recipes
- [ ] View community feed
- [ ] View trending recipes

### Advanced Features
- [ ] Step-by-step cooking mode
- [ ] Cooking timers
- [ ] Seasonal recipes
- [ ] Recipe tags and filters
- [ ] Nutrition information

## 🐛 Troubleshooting

### Migration Fails
```bash
# Check database connection
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>

# Check if tables exist
\dt

# Manually run migration if needed
\i migrations/017_create_social_features.sql
\i migrations/018_create_advanced_recipe_features.sql
```

### Backend Errors
```bash
# Check logs
pm2 logs cook-smart-backend --lines 100

# Check process status
pm2 status

# Restart if needed
pm2 restart cook-smart-backend
```

### Frontend Issues
```bash
# Clear cache
npm start -- --reset-cache

# Rebuild
cd android
cmd /c gradlew.bat clean
cmd /c gradlew.bat assembleRelease
```

## 📊 Database Tables Created

```sql
-- Social Features
user_follows
recipe_comments
recipe_likes
recipe_shares
user_activity_feed
trending_recipes

-- Advanced Features
recipe_nutrition
recipe_timers
cooking_sessions
recipe_tags
seasonal_recipes
```

## 🔐 Security Notes

- All social endpoints require authentication
- User can only delete their own comments
- Follow relationships prevent self-following
- Activity feed only shows followed users + self

## 📈 Monitoring

### Key Metrics to Watch
- Number of likes per recipe
- Comment activity
- Share counts
- Trending recipe changes
- Cooking session completions
- Seasonal recipe views

### Database Queries
```sql
-- Most liked recipes
SELECT recipe_id, COUNT(*) as likes 
FROM recipe_likes 
GROUP BY recipe_id 
ORDER BY likes DESC 
LIMIT 10;

-- Most active users
SELECT user_id, COUNT(*) as activities 
FROM user_activity_feed 
GROUP BY user_id 
ORDER BY activities DESC 
LIMIT 10;

-- Trending recipes
SELECT * FROM trending_recipes 
ORDER BY score DESC 
LIMIT 20;
```

## 🎊 Success Criteria

- [ ] All migrations run successfully
- [ ] Backend starts without errors
- [ ] All API endpoints respond
- [ ] Frontend builds successfully
- [ ] Social features work in app
- [ ] Step-by-step mode works
- [ ] No console errors
- [ ] Database queries perform well

## 📞 Support

If issues occur:
1. Check logs: `pm2 logs cook-smart-backend`
2. Check database: `psql` connection
3. Verify environment variables
4. Review error messages
5. Rollback if needed

## 🔄 Rollback Plan

If deployment fails:
```bash
# On server
cd /home/ubuntu/cook-smart/backend

# Checkout previous commit
git log --oneline -10
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build
pm2 restart cook-smart-backend
```

## 🎉 Post-Deployment

1. Announce new features to beta users
2. Monitor error logs for 24 hours
3. Collect user feedback
4. Track engagement metrics
5. Plan next iteration

---

**Estimated Deployment Time:** 15-30 minutes  
**Downtime:** ~2 minutes (during PM2 restart)  
**Risk Level:** Low (additive features, no breaking changes)
