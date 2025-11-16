# Cook Smart - Deployment Strategy

## 🎯 Strategy: Admin Dashboard First, Then Deploy

**Reasoning:** You need full visibility and control before opening to testers.

---

## Phase 1: Complete Admin Dashboard (CURRENT)

### Status: 20% Complete (6/30 tasks)

**What's Done:**
- ✅ Backend authentication system
- ✅ Super admin controls (your email pre-approved)
- ✅ Activity logging
- ✅ Database schema ready

**What's Needed Before Deployment:**

### Critical for Deployment (Must Have):
1. **User Management API** - View/manage all users
2. **Analytics API** - See user counts, activity, engagement
3. **Error Monitoring API** - Track app errors in real-time
4. **Feedback Management API** - View user feedback
5. **Admin Dashboard Frontend** - React web app to access all features

### Nice to Have (Can Add Later):
- Subscription management
- System health monitoring
- Cache management
- Cost tracking
- Referral management

**Estimated Time:** 2-3 more sessions to get critical features ready

---

## Phase 2: Pre-Deployment Prep (NEXT)

### Backend Preparation

**1. Environment Configuration**
```bash
# Create production .env
cp backend/.env backend/.env.production
```

**Required Variables:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/cook_smart
JWT_SECRET=<generate-secure-secret>
ADMIN_JWT_SECRET=<generate-secure-secret>
SPOONACULAR_API_KEY=<your-key>
THEMEALDB_API_KEY=<your-key>
EDAMAM_APP_ID=<your-id>
EDAMAM_APP_KEY=<your-key>
DISCORD_WEBHOOK_ERRORS=<your-webhook>
DISCORD_WEBHOOK_FEEDBACK=<your-webhook>
DISCORD_WEBHOOK_ACTIVITY=<your-webhook>
```

**2. Database Setup**
- Set up production PostgreSQL (AWS RDS or similar)
- Run all migrations in order
- Verify your email is in approved_admin_emails table

**3. Backend Deployment Options**

**Option A: AWS EC2 (Recommended)**
- Cost: ~$10-15/month (t3.micro)
- Full control
- Easy to scale

**Option B: Heroku**
- Cost: $7/month (Eco dyno)
- Easiest setup
- Good for testing

**Option C: AWS ECS (Docker)**
- Cost: ~$15/month
- More scalable
- Requires Docker knowledge

### Frontend (Mobile App) Preparation

**1. Update API URLs**
Create environment config:
```typescript
// src/config/environment.ts
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.12.196:3000'
  : 'https://your-production-api.com';
```

**2. Build Configuration**
- Update app version
- Set release signing keys
- Configure app icons
- Set app name and bundle ID

**3. Build APK**
```bash
cd android
./gradlew assembleRelease
```

### Admin Dashboard Preparation

**1. Create React App**
```bash
npx create-react-app admin-dashboard --template typescript
cd admin-dashboard
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom react-query axios recharts
```

**2. Deploy Admin Dashboard**
- Vercel (free, easiest)
- Netlify (free)
- AWS S3 + CloudFront

---

## Phase 3: Deployment Day

### Pre-Flight Checklist

**Backend:**
- [ ] All migrations run successfully
- [ ] Your email in approved_admin_emails
- [ ] Environment variables set
- [ ] Server running and accessible
- [ ] Health check endpoint working
- [ ] Discord webhooks tested

**Admin Dashboard:**
- [ ] Can login with your email
- [ ] Can see user list
- [ ] Can see analytics
- [ ] Can see errors
- [ ] Can see feedback

**Mobile App:**
- [ ] APK built successfully
- [ ] API URLs point to production
- [ ] Test on your device first
- [ ] All core features work

### Deployment Steps

**1. Deploy Backend** (1-2 hours)
```bash
# Example: Heroku
heroku create cook-smart-api
git push heroku main
heroku run npm run migrate
```

**2. Deploy Admin Dashboard** (30 minutes)
```bash
# Example: Vercel
cd admin-dashboard
vercel deploy --prod
```

**3. Test Everything** (1 hour)
- Login to admin dashboard
- Create test user in mobile app
- Verify user appears in dashboard
- Test all core features
- Check Discord notifications

**4. Distribute to Testers** (30 minutes)
- Share APK via Firebase App Distribution
- Or share APK file directly
- Send instructions

---

## Phase 4: Monitoring (Post-Deployment)

### Day 1 Monitoring

**Via Admin Dashboard:**
- User signups
- Active users
- Error rates
- Feedback submissions

**Via Discord:**
- Real-time error notifications
- User activity alerts
- Feedback submissions

### Week 1 Goals

- [ ] 5+ active testers
- [ ] All core features tested
- [ ] Bug list created
- [ ] Feedback collected
- [ ] No critical errors

---

## Timeline Estimate

### To Deployment:

**Admin Dashboard Completion:**
- Critical APIs: 1-2 sessions (8-12 hours)
- Frontend React app: 1-2 sessions (8-12 hours)
- Testing & polish: 1 session (4 hours)
- **Total: 3-5 sessions**

**Deployment Prep:**
- Backend setup: 2-3 hours
- Database setup: 1-2 hours
- Admin dashboard deploy: 1 hour
- Mobile app build: 1 hour
- **Total: 5-7 hours**

**Grand Total: 4-6 sessions + 1 deployment day**

---

## Cost Breakdown (Monthly)

### Before Deployment: $0

### After Deployment:
- AWS RDS (PostgreSQL): $10-15
- AWS EC2 (Backend): $5-10
- Admin Dashboard: $0 (Vercel free tier)
- Firebase App Distribution: $0
- APIs: $0 (free tiers)
- **Total: $15-25/month**

### If Over Budget:
- Use Heroku Postgres (free tier)
- Use Heroku backend (Eco $7/month)
- **Total: $7/month**

---

## Rollback Plan

If issues arise:

**1. Backend Issues:**
- Keep old version running
- Switch DNS back
- Fix and redeploy

**2. Mobile App Issues:**
- Share previous APK version
- Fix bugs
- Rebuild and redistribute

**3. Admin Dashboard Issues:**
- Revert Vercel deployment
- Fix and redeploy

---

## Success Criteria

### Ready for Testers When:
- ✅ Admin dashboard shows real-time data
- ✅ You can see all users
- ✅ You can see all errors
- ✅ You can see all feedback
- ✅ Discord notifications working
- ✅ Mobile app connects to production backend
- ✅ All core features work

---

## Next Steps (Tonight/Tomorrow)

**Option 1: Continue Admin Dashboard**
- Build critical APIs (user management, analytics, errors, feedback)
- This gets you closer to deployment

**Option 2: Prep Deployment Infrastructure**
- Set up AWS/Heroku accounts
- Configure database
- Set up domain (if needed)
- This makes deployment day smoother

**Option 3: Both (Recommended)**
- Continue admin dashboard development
- Prep deployment in parallel
- Be ready to deploy when dashboard is done

---

**Current Status:** Code is production-ready. Admin dashboard is 20% complete. Estimated 3-5 more sessions until deployment-ready.

**Recommendation:** Focus next sessions on completing admin dashboard critical features, then deploy everything at once with full monitoring in place.
