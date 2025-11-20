# Deploy Points Tables to Production

## What This Fixes
1. **Points not showing in app** - Creates the database tables needed to store and display user points
2. **Privacy & Security tab** - Now properly navigates to the full Privacy & Security screen (no longer shows "Coming Soon")

## Option 1: Deploy via EC2 Server (Recommended)

### Step 1: Upload files to EC2
```bash
# From your local machine, upload the migration files
scp backend/migrations/create-points-tables.sql ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/migrations/
scp backend/migrations/run-create-points-tables.js ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/migrations/
```

### Step 2: SSH into EC2 and run migration
```bash
# SSH into your server
ssh ubuntu@3.237.38.24

# Navigate to backend directory
cd /home/ubuntu/cook-smart/backend

# Run the migration
node migrations/run-create-points-tables.js

# Restart the backend to ensure everything is fresh
pm2 restart cook-smart-backend
```

## Option 2: Manual SQL Execution

If you have direct database access (pgAdmin, DBeaver, etc.), you can run this SQL directly:

```sql
-- Create points system tables

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  user_id VARCHAR(255) PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Points Transactions Table
CREATE TABLE IF NOT EXISTS points_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  date_created TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_date ON points_transactions(date_created DESC);

-- Insert initial points for existing users (0 points, level 0)
INSERT INTO user_points (user_id, total_points, level, last_updated)
SELECT id, 0, 0, NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_points)
ON CONFLICT (user_id) DO NOTHING;

-- Verify tables created
SELECT 'user_points table created' as status, COUNT(*) as user_count FROM user_points;
SELECT 'points_transactions table created' as status, COUNT(*) as transaction_count FROM points_transactions;
```

## What Changed in the App

### 1. ProfileScreenNew.tsx
- ✅ Added points fetching from backend API
- ✅ Displays real points and level (not hardcoded 0)
- ✅ Privacy & Security button now navigates to actual screen

### 2. MainTabNavigator.tsx
- ✅ Added PrivacySecurityScreen to navigation stack
- ✅ Route name: 'PrivacySecurity'

### 3. PrivacySecurityScreen.tsx
- ✅ Already fully implemented with:
  - Privacy settings (data sharing, analytics, notifications, location)
  - Data management (export data, data policy)
  - Security (change password, 2FA)
  - Legal (privacy policy, terms of service)
  - Account deletion

## Testing After Deployment

1. **Build new APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Install on device and test**:
   - Open Profile screen
   - Check if points display (should show 0 initially)
   - Tap "Privacy & Security" - should open full screen (not "Coming Soon")
   - Navigate through all Privacy & Security options

3. **Test points system**:
   - Points will accumulate as users:
     - View recipes (1 point)
     - Favorite recipes (5 points)
     - Rate recipes (10 points)
     - Write reviews (15 points)
     - Complete shopping items (3 points)
     - Daily login (2 points)

## Points Level System

- Level 0: Beginner (0-99 points) 🥄
- Level 1: Home Cook (100-499 points) 👨‍🍳
- Level 2: Chef (500-1,999 points) 👩‍🍳
- Level 3: Master Chef (2,000-4,999 points) 🔥
- Level 4: Culinary Expert (5,000-9,999 points) ⭐
- Level 5: Kitchen Legend (10,000+ points) 👑

## Troubleshooting

### Points still showing 0
- Check backend logs: `pm2 logs cook-smart-backend`
- Verify tables exist: Run `SELECT COUNT(*) FROM user_points;` in database
- Check API endpoint: `curl http://3.237.38.24:3000/api/v1/points` (with auth token)

### Privacy & Security not opening
- Clear app cache and reinstall APK
- Check navigation logs in Metro bundler

### Database connection issues
- Verify RDS security group allows EC2 access
- Check DATABASE_URL in backend/.env
- Test connection: `node -e "require('./src/config/database').query('SELECT NOW()')"`
