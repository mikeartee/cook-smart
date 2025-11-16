# Recipe API Migration - Deployment Checklist

## Pre-Deployment

### 1. Register for Edamam API
- [ ] Go to https://developer.edamam.com/
- [ ] Create account and verify email
- [ ] Create application (Recipe Search API - Developer plan)
- [ ] Copy Application ID and Application Key
- [ ] Save credentials securely

### 2. Update Environment Variables
- [ ] Add `EDAMAM_APP_ID` to backend/.env
- [ ] Add `EDAMAM_APP_KEY` to backend/.env
- [ ] Remove `SPOONACULAR_API_KEY` from backend/.env (optional)
- [ ] Update .env.example file
- [ ] Verify no extra spaces in credentials

### 3. Database Migration
- [ ] Run `create_api_usage_logs_table.sql` migration
- [ ] Verify table created: `api_usage_logs`
- [ ] Check indexes created successfully
- [ ] Test database connection

### 4. Code Review
- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] No console errors in development
- [ ] Provider fallback logic tested
- [ ] Caching working correctly

### 5. Local Testing
- [ ] Test Edamam API with real credentials
- [ ] Test TheMealDB fallback
- [ ] Test cache hit/miss scenarios
- [ ] Test error handling
- [ ] Test frontend displays correctly
- [ ] Verify beta labels show
- [ ] Check provider attribution

## Deployment Steps

### 1. Backend Deployment

#### Update Environment Variables (Production)
```bash
# AWS Systems Manager Parameter Store or similar
aws ssm put-parameter \
  --name "/cook-smart/prod/EDAMAM_APP_ID" \
  --value "your_app_id" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/cook-smart/prod/EDAMAM_APP_KEY" \
  --value "your_app_key" \
  --type "SecureString"
```

#### Run Database Migration
```bash
# Connect to production database
psql -h your-rds-endpoint.amazonaws.com \
  -U your_db_user \
  -d cooksmartdb \
  -f backend/src/migrations/create_api_usage_logs_table.sql
```

#### Deploy Backend Code
```bash
# Build backend
cd backend
npm run build

# Deploy to EC2/ECS
# (Your specific deployment process)
```

#### Verify Backend
```bash
# Test health endpoint
curl https://your-api-url.com/health

# Test recipe search
curl "https://your-api-url.com/api/v1/recipes/search?ingredients=chicken" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Frontend Deployment

#### Build Frontend
```bash
# For Android
cd android
./gradlew assembleRelease

# For iOS
cd ios
xcodebuild -workspace CookSmart.xcworkspace \
  -scheme CookSmart \
  -configuration Release
```

#### Deploy to App Stores
- [ ] Upload to Google Play Console (Android)
- [ ] Upload to App Store Connect (iOS)
- [ ] Update release notes mentioning improved recipe search
- [ ] Submit for review

### 3. Monitoring Setup

#### CloudWatch Alarms (if using AWS)
```bash
# Create alarm for API errors
aws cloudwatch put-metric-alarm \
  --alarm-name recipe-api-errors \
  --alarm-description "Alert when recipe API errors exceed threshold" \
  --metric-name Errors \
  --namespace CookSmart/RecipeAPI \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

#### Log Monitoring
- [ ] Set up log aggregation (CloudWatch Logs, Datadog, etc.)
- [ ] Create dashboard for API usage
- [ ] Set up alerts for rate limit warnings
- [ ] Monitor cache hit rate

## Post-Deployment

### 1. Immediate Verification (First Hour)

- [ ] Check backend logs for errors
- [ ] Verify Edamam API calls working
- [ ] Confirm TheMealDB fallback available
- [ ] Test recipe search from mobile app
- [ ] Check API usage statistics endpoint
- [ ] Verify caching is working

### 2. First Day Monitoring

- [ ] Monitor API call count (should be < 333/day)
- [ ] Check cache hit rate (target: 60%+)
- [ ] Review error logs
- [ ] Check user feedback
- [ ] Verify no performance degradation
- [ ] Monitor response times

### 3. First Week Monitoring

- [ ] Daily API usage trends
- [ ] Cache effectiveness
- [ ] Error rate analysis
- [ ] User engagement with recipes
- [ ] Performance metrics
- [ ] Cost analysis (should be $0)

## Rollback Plan

### If Issues Occur

#### Option 1: Revert to Spoonacular (Emergency)
```bash
# Restore old service file
cp backend/src/services/deprecated/spoonacularService.ts \
   backend/src/services/spoonacularService.ts

# Update routes to use spoonacularService
# Redeploy backend
```

#### Option 2: Disable Edamam, Use TheMealDB Only
```bash
# Remove Edamam credentials from environment
# System will automatically fall back to TheMealDB
```

#### Option 3: Use Cache Only
```bash
# Disable all external APIs temporarily
# System will serve from cache
```

## Success Metrics

### Week 1 Targets
- [ ] API calls < 300/day (within free tier)
- [ ] Cache hit rate > 50%
- [ ] Error rate < 1%
- [ ] Average response time < 2s
- [ ] Zero downtime
- [ ] User satisfaction maintained

### Month 1 Targets
- [ ] API calls < 333/day consistently
- [ ] Cache hit rate > 60%
- [ ] Error rate < 0.5%
- [ ] Cost remains $0
- [ ] User engagement with recipes increases

## Troubleshooting

### High API Usage
**If approaching 333 calls/day:**
- Check cache hit rate
- Increase cache duration
- Optimize search patterns
- Consider upgrading Edamam tier

### TheMealDB Fallback Activating Frequently
**If seeing too many fallbacks:**
- Verify Edamam credentials correct
- Check rate limit not exceeded
- Review error logs for API issues
- Consider increasing Edamam tier

### Cache Not Working
**If cache hit rate < 30%:**
- Verify database connection
- Check cache table exists
- Review cache expiration settings
- Analyze search patterns

### Performance Issues
**If response times > 3s:**
- Check database query performance
- Review API timeout settings
- Analyze network latency
- Consider adding CDN

## Documentation Updates

- [ ] Update README.md with new API setup
- [ ] Update API documentation
- [ ] Update developer onboarding guide
- [ ] Create runbook for operations team
- [ ] Document monitoring procedures

## Communication

### Internal Team
- [ ] Notify team of deployment
- [ ] Share monitoring dashboard
- [ ] Provide troubleshooting guide
- [ ] Schedule post-deployment review

### Users (if needed)
- [ ] Announce improved recipe search
- [ ] Highlight new features (nutrition data)
- [ ] Gather feedback
- [ ] Monitor support tickets

## Sign-Off

- [ ] Technical Lead Approval
- [ ] QA Testing Complete
- [ ] Security Review Complete
- [ ] Documentation Updated
- [ ] Monitoring Configured
- [ ] Rollback Plan Tested

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Verified By:** _____________

## Notes

_Add any deployment-specific notes here_
