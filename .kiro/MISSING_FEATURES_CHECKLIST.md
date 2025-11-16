# Missing Features & TODO Checklist

## 🔔 Discord Notifications System

### Status: NOT STARTED
### Priority: HIGH (for production monitoring)

### 1. Error Monitoring Channel
**Purpose:** Real-time error tracking and auto-repair notifications

**Features Needed:**
- [ ] Set up Discord webhook for errors channel
- [ ] Create error notification service
- [ ] Hook into backend error handler
- [ ] Send error details (timestamp, error message, stack trace, user impact)
- [ ] Auto-repair script integration
  - [ ] Detect common errors
  - [ ] Attempt automatic fixes
  - [ ] Report repair status to Discord
  - [ ] Notify when system is healthy again
- [ ] Error severity levels (Critical, High, Medium, Low)
- [ ] Throttling to prevent spam (max 1 per minute per error type)

**Discord Message Format:**
```
🚨 ERROR DETECTED
Time: [timestamp]
Severity: [level]
Error: [message]
Affected: [user count/feature]
Status: Attempting auto-repair...

✅ REPAIRED
Time: [timestamp]
Fix Applied: [description]
Status: System healthy
```

### 2. User Feedback Channel
**Purpose:** Collect and track user feedback from testers and production users

**Features Needed:**
- [ ] Set up Discord webhook for feedback channel
- [ ] Create feedback form in app
  - [ ] Add "Send Feedback" button in app settings/menu
  - [ ] Feedback form with text input
  - [ ] Optional: Rating (1-5 stars)
  - [ ] Optional: Category (Bug, Feature Request, General)
  - [ ] Optional: Screenshot attachment
- [ ] Backend endpoint: POST /api/v1/feedback
- [ ] Send to Discord with user info
- [ ] Store feedback in database for admin dashboard

**Discord Message Format:**
```
💬 NEW FEEDBACK
User: [name] ([email])
Time: [timestamp]
Rating: ⭐⭐⭐⭐⭐
Category: [Bug/Feature/General]
Message: [feedback text]
```

### 3. User Activity Channel
**Purpose:** Track key user actions and business metrics

**Features Needed:**
- [ ] Set up Discord webhook for activity channel
- [ ] Hook into user registration
  - [ ] Send notification on new signup
  - [ ] Include: name, email, timestamp, referral code (if used)
- [ ] Hook into purchase events
  - [ ] Send notification on subscription purchase
  - [ ] Include: name, email, plan, amount, timestamp
- [ ] Hook into referral events
  - [ ] Send notification when user refers someone
  - [ ] Send notification when referred user signs up
  - [ ] Include: referrer name, referee name, timestamp, referral code
- [ ] Daily summary (optional)
  - [ ] Total new users today
  - [ ] Total purchases today
  - [ ] Total referrals today

**Discord Message Format:**
```
👤 NEW USER SIGNUP
Name: [name]
Email: [email]
Time: [timestamp]
Referred by: [referrer name] (Code: [code]) OR "Direct signup"

💰 NEW PURCHASE
User: [name] ([email])
Plan: [Premium Monthly/Annual]
Amount: $[amount]
Time: [timestamp]

🎁 NEW REFERRAL
Referrer: [name] ([email])
Referee: [name] ([email])
Code: [code]
Time: [timestamp]
Status: Signup complete ✅
```

---

## 👨‍💼 Admin Dashboard

### Status: NOT STARTED
### Priority: MEDIUM (needed before scaling)

### Core Features Needed:

#### 1. User Management
- [ ] View all users (paginated table)
- [ ] Search users by name/email
- [ ] Filter by: co-founder, premium, free, date joined
- [ ] User details view
  - [ ] Account info
  - [ ] Subscription status
  - [ ] Activity history
  - [ ] Ingredients count
  - [ ] Saved recipes count
- [ ] Actions:
  - [ ] Mark as co-founder
  - [ ] Grant/revoke premium access
  - [ ] Ban/suspend user
  - [ ] Reset password
  - [ ] Delete account

#### 2. Analytics Dashboard
- [ ] Total users (all time, this month, today)
- [ ] Active users (DAU, MAU)
- [ ] Premium subscribers count
- [ ] Revenue metrics
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] Total revenue
  - [ ] Average revenue per user
- [ ] Referral metrics
  - [ ] Total referrals
  - [ ] Conversion rate
  - [ ] Top referrers
- [ ] Feature usage stats
  - [ ] Ingredients added
  - [ ] Recipes searched
  - [ ] Recipes saved
- [ ] Charts and graphs (last 30 days)

#### 3. Recipe Cache Management
- [ ] Cache statistics
  - [ ] Total cached recipes
  - [ ] Cache hit rate
  - [ ] API calls saved
  - [ ] Storage used
- [ ] Popular recipes list (most accessed)
- [ ] Actions:
  - [ ] Clear expired cache
  - [ ] Clear all cache (emergency)
  - [ ] View cache details
  - [ ] Export cache stats

#### 4. Feedback Management
- [ ] View all feedback (paginated)
- [ ] Filter by: category, rating, date
- [ ] Mark as: Read, In Progress, Resolved, Ignored
- [ ] Respond to feedback (optional)
- [ ] Export feedback to CSV

#### 5. Error Monitoring
- [ ] Recent errors list
- [ ] Error frequency chart
- [ ] Error details view
- [ ] Auto-repair history
- [ ] Manual repair actions

#### 6. System Health
- [ ] Database status
- [ ] API status (Spoonacular, etc.)
- [ ] Server metrics (CPU, memory, disk)
- [ ] Uptime monitoring
- [ ] Cost tracking
  - [ ] Current month costs
  - [ ] Budget remaining ($20/month)
  - [ ] Cost breakdown by service

#### 7. Content Management
- [ ] Manage co-founder list
- [ ] Update welcome message
- [ ] Manage BETA status
- [ ] Feature flags (enable/disable features)

### Technology Stack for Admin Dashboard:
- **Option 1:** React web app (separate from mobile)
- **Option 2:** React Native admin screens (in-app for admins)
- **Backend:** Express routes with admin authentication
- **Database:** PostgreSQL (same as main app)

---

## 📊 Priority Order

### Phase 1 (Before Firebase Deployment):
1. ✅ Ingredient management (DONE)
2. 🚧 Recipe screens (IN PROGRESS - backend done)
3. ⏳ Test music feature (PENDING - DB access)

### Phase 2 (After Initial Deployment):
1. Discord notifications (all 3 channels)
2. Admin dashboard (basic version)
3. Feedback form in app

### Phase 3 (Scaling Phase):
1. Advanced admin analytics
2. Auto-repair system
3. Cost monitoring dashboard

---

## 🎯 Recommendation for Tonight/Tomorrow

**For Firebase Deployment:**
1. Complete recipe screens (2-3 hours)
2. Test music feature (15 min)
3. Deploy to Firebase
4. Add Discord notifications after deployment (can be done live)
5. Build admin dashboard next week

**This gets you:**
- ✅ Full MVP app live
- ✅ Users can test all features
- ✅ You can monitor via Discord
- ✅ Admin dashboard can be built while app is live

Sound good?


---

## 📱 Barcode Scanner Feature

### Status: ✅ COMPLETE (Core Implementation)

### Priority: MEDIUM (nice-to-have for MVP, essential for v1.0)

**Purpose:** Scan product barcodes to quickly add ingredients to inventory

**Features Completed:**

- [x] Research barcode scanning libraries for React Native (no Expo)
  - [x] Selected react-native-vision-camera (modern, performant)
  - [x] Selected vision-camera-code-scanner (native barcode detection)
  - [x] Verified compatibility with React Native 0.82.1
- [x] Implement camera permissions
  - [x] iOS: Updated Info.plist
  - [x] Android: Updated AndroidManifest.xml
  - [x] Runtime permission handling with user-friendly messages
- [x] Create barcode scanner screen
  - [x] Full-screen camera view with overlay
  - [x] Scan indicator/crosshair
  - [x] Manual entry fallback
  - [x] Haptic feedback on successful scan
- [x] Integrate with Open Food Facts API (FREE)
  - [x] Lookup product by barcode
  - [x] Parse product name, brand, category
  - [x] Handle "not found" cases
  - [x] Smart caching (5+ scans = never expires)
- [x] Add to ingredient inventory
  - [x] Auto-fill ingredient name from scan
  - [x] Allow user to edit before saving
  - [x] Set default quantity/unit
- [x] Add "Scan Barcode" button to AddIngredientScreen

**Cost:** $0 (Open Food Facts API is free)

**User Flow:**
1. User taps "Scan Barcode" on Add Ingredient screen
2. Camera opens with scanning overlay
3. User points camera at barcode
4. App scans and looks up product
5. Product info pre-fills the form
6. User confirms and saves ingredient

**Next Steps:**
- [ ] Test on real iOS device (requires `pod install`)
- [ ] Test on real Android device
- [ ] Write unit tests (optional but recommended)
- [ ] Add in-app tutorial for first-time users

**Documentation:** See `.kiro/specs/barcode-scanner/IMPLEMENTATION_COMPLETE.md`

