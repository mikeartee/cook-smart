# Admin Dashboard Design Document

## Overview

The Admin Dashboard is a standalone, professional React-based web application that provides a comprehensive administrative interface for Cook Smart. This is a separate website (not part of the main mobile app) designed specifically for administrators with a thoughtful, organized, and professional user interface.

The dashboard connects to the existing Node.js/Express backend via REST APIs and displays real-time metrics, user management tools, content moderation, community engagement analytics, feedback management, error monitoring, and system health indicators. It features a modern, intuitive design using Material-UI components with a well-organized navigation structure.

### Key Design Decisions

1. **Frontend Framework**: React 18 with TypeScript
   - Modern, component-based architecture
   - Strong typing for reliability
   - Large ecosystem and community support
   - Easy to deploy (static files)

2. **UI Library**: Material-UI (MUI) v5
   - Professional, polished components out of the box
   - Responsive design built-in
   - Comprehensive component library
   - Customizable theming

3. **State Management**: React Context + React Query
   - React Context for auth state
   - React Query for server state (caching, refetching)
   - No need for Redux (simpler architecture)

4. **Charts**: Recharts
   - React-native charts library
   - Responsive and customizable
   - Good documentation
   - Free and open-source

5. **Deployment**: Static hosting (Vercel, Netlify, or AWS S3 + CloudFront)
   - Free tier available
   - Automatic deployments from Git
   - CDN for fast global access
   - HTTPS by default

6. **Backend Integration**: Extend existing Express backend
   - Add admin-specific routes
   - Reuse existing database models
   - Add admin authentication middleware
   - No new infrastructure needed

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│         Admin Dashboard (React)         │
│  ┌───────────┐  ┌──────────────────┐  │
│  │   Auth    │  │   Dashboard      │  │
│  │  Context  │  │   Components     │  │
│  └───────────┘  └──────────────────┘  │
│  ┌───────────────────────────────────┐ │
│  │      React Query (API Layer)      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ HTTPS/REST
                    ▼
┌─────────────────────────────────────────┐
│      Express Backend (Existing)         │
│  ┌───────────────────────────────────┐ │
│  │    Admin Routes (/api/admin/*)    │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │   Admin Auth Middleware           │ │
│  └───────────────────────────────────┘ │
│  ┌───────────────────────────────────┐ │
│  │   Existing Models & Services      │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│       PostgreSQL Database (RDS)         │
└─────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── LoginPage
│       └── DashboardLayout
│           ├── Sidebar (with navigation sections)
│           │   ├── Dashboard
│           │   ├── Users & Subscriptions
│           │   │   ├── Users
│           │   │   ├── Subscriptions
│           │   │   └── Referrals
│           │   ├── Content & Moderation
│           │   │   ├── User Recipes
│           │   │   ├── Feedback
│           │   │   └── Errors
│           │   ├── Community & Engagement
│           │   │   ├── Points Management
│           │   │   ├── Community Activity
│           │   │   └── Notifications
│           │   ├── Analytics
│           │   │   ├── Recipe Analytics
│           │   │   ├── Shopping Analytics
│           │   │   └── Dietary Analytics
│           │   ├── System
│           │   │   ├── System Health
│           │   │   ├── Cache
│           │   │   ├── Costs
│           │   │   ├── API Usage
│           │   │   ├── Discord Integration
│           │   │   └── Audit Log
│           │   ├── Tools
│           │   │   ├── Bulk Operations
│           │   │   ├── Feature Flags
│           │   │   └── Content Management
│           │   └── Admin Management (Super Admin Only)
│           │       ├── Manage Admins
│           │       └── Approved Emails
│           ├── TopBar
│           └── Content
│               ├── OverviewPage (default)
│               ├── UsersPage
│               ├── SubscriptionsPage
│               ├── ReferralsPage
│               ├── ContentModerationPage
│               ├── FeedbackPage
│               ├── ErrorsPage
│               ├── PointsManagementPage
│               ├── CommunityActivityPage
│               ├── NotificationsManagementPage
│               ├── RecipeAnalyticsPage
│               ├── ShoppingAnalyticsPage
│               ├── DietaryAnalyticsPage
│               ├── SystemHealthPage
│               ├── CachePage
│               ├── CostsPage
│               ├── APIUsagePage
│               ├── DiscordManagementPage
│               ├── AuditLogPage
│               ├── BulkOperationsPage
│               ├── FeatureFlagsPage
│               ├── ContentManagementPage
│               └── AdminManagementPage (Super Admin Only)
```

## Components and Interfaces

### 1. Frontend Components

#### AuthProvider (Context)

**Location**: `admin-dashboard/src/contexts/AuthContext.tsx`

**Interface**:
```typescript
interface AuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AdminUser {
  id: number;
  email: string;
  username: string;
  name: string;
  is_super_admin: boolean;
  created_at: Date;
  last_login: Date;
}
```

#### DashboardLayout

**Location**: `admin-dashboard/src/components/layout/DashboardLayout.tsx`

**Features**:
- Sidebar navigation with icons
- Top bar with admin name and logout button
- Responsive drawer for mobile
- Breadcrumbs for navigation

#### OverviewPage

**Location**: `admin-dashboard/src/pages/OverviewPage.tsx`

**Features**:
- **System Health Section**:
  - Overall health status indicator (green/yellow/red)
  - Database connection status
  - API response times
  - Server CPU/Memory usage
  - Uptime percentage
  - Last deployment info
  
- **User Metrics Cards**:
  - Total users (all time)
  - New users today/this week/this month
  - Active users (DAU/WAU/MAU)
  - User retention rate
  - Churn rate
  
- **Revenue Metrics Cards**:
  - MRR (Monthly Recurring Revenue)
  - Total revenue (all time)
  - Revenue today/this week/this month
  - Average revenue per user (ARPU)
  - Lifetime value (LTV)
  
- **Subscription Metrics Cards**:
  - Total premium subscribers
  - Free tier users
  - Trial users
  - Conversion rate (free to premium)
  - Subscription cancellations this month
  
- **Engagement Metrics Cards**:
  - Total ingredients added
  - Total recipes searched
  - Total recipes saved
  - Average ingredients per user
  - Average recipes per user
  - Daily active rate
  
- **Referral Metrics Cards**:
  - Total referrals
  - Successful referrals (signed up)
  - Referral conversion rate
  - Top referrers
  
- **Charts**:
  - User growth chart (last 30/90 days)
  - Revenue trend chart
  - Feature usage chart
  - Error frequency chart
  - API usage chart
  
- **Recent Activity**:
  - Recent signups (last 10)
  - Recent errors (last 5 critical)
  - Recent feedback (last 5)
  - Recent subscriptions (last 10)
  
- **Quick Actions**:
  - View all users
  - View all errors
  - Export analytics
  - Clear cache

#### UsersPage

**Location**: `admin-dashboard/src/pages/UsersPage.tsx`

**Features**:
- Data table with pagination
- Search bar
- Filter chips (account type, status, subscription level)
- User detail modal with tabs:
  - Account Info (email, name, join date, last login)
  - Subscription Management (current plan, billing history, grant/cancel subscription)
  - Activity Stats (ingredients, recipes, searches, logins)
  - Referrals (referral code, referred users, referral earnings)
- Action buttons (mark co-founder, suspend, delete, manage subscription)

#### FeedbackPage

**Location**: `admin-dashboard/src/pages/FeedbackPage.tsx`

**Features**:
- Feedback list with filters
- Rating display (stars)
- Status dropdown
- Notes section
- Export to CSV button

#### ErrorsPage

**Location**: `admin-dashboard/src/pages/ErrorsPage.tsx`

**Features**:
- Error list with severity badges
- Error frequency chart
- Error detail modal with stack trace
- Filter by severity
- Auto-refresh toggle

#### CachePage

**Location**: `admin-dashboard/src/pages/CachePage.tsx`

**Features**:
- Cache statistics cards
- Popular recipes table
- Clear cache buttons
- Cache performance metrics

#### SubscriptionsPage

**Location**: `admin-dashboard/src/pages/SubscriptionsPage.tsx`

**Features**:
- **Subscription Overview**:
  - Total active subscriptions
  - Subscriptions by plan (monthly/annual)
  - Trial subscriptions
  - Cancelled subscriptions this month
  - Upcoming renewals
  
- **Subscription Management**:
  - Grant subscription to user (search by email)
  - Cancel subscription (with reason)
  - Extend trial period
  - Apply discount/promo code
  - Refund subscription
  
- **Subscription List**:
  - Data table with all subscriptions
  - Filter by status (active, cancelled, trial, expired)
  - Filter by plan type
  - Sort by start date, end date, revenue
  
- **Billing History**:
  - All transactions
  - Failed payments
  - Refunds
  - Revenue by month

#### SystemHealthPage

**Location**: `admin-dashboard/src/pages/SystemHealthPage.tsx`

**Features**:
- **Server Metrics**:
  - CPU usage (current, average, peak)
  - Memory usage (current, available, peak)
  - Disk usage
  - Network I/O
  - Process count
  
- **Database Metrics**:
  - Connection pool status
  - Active connections
  - Query performance (slow queries)
  - Database size
  - Table sizes
  - Index health
  
- **API Metrics**:
  - Request rate (requests per minute)
  - Average response time
  - Error rate
  - Endpoint performance breakdown
  - Rate limit status
  
- **External Services**:
  - Open Food Facts API status
  - TheMealDB API status
  - Edamam API status
  - Discord webhook status
  - Email service status (if applicable)
  
- **Cache Metrics**:
  - Recipe cache hit rate
  - Barcode cache hit rate
  - Cache memory usage
  - Cache eviction rate
  
- **Uptime Monitoring**:
  - Current uptime
  - Uptime percentage (24h, 7d, 30d)
  - Downtime incidents
  - Response time history

#### ReferralsPage

**Location**: `admin-dashboard/src/pages/ReferralsPage.tsx`

**Features**:
- **Referral Overview**:
  - Total referrals sent
  - Successful referrals (signed up)
  - Conversion rate
  - Total referral revenue
  
- **Top Referrers**:
  - Leaderboard of users by referrals
  - Referral earnings per user
  - Most active referrers this month
  
- **Referral Tracking**:
  - All referral codes
  - Usage per code
  - Referral source tracking
  - Referral funnel (sent → clicked → signed up → converted)
  
- **Referral Management**:
  - Create custom referral codes
  - Disable referral codes
  - Set referral rewards
  - Track referral payouts

#### AdminManagementPage (Super Admin Only)

**Location**: `admin-dashboard/src/pages/AdminManagementPage.tsx`

**Features**:
- **Current Admins**:
  - List of all registered admins
  - Show email, username, last login
  - Ability to remove admin access (except super admin)
  - Ability to reset admin password
  
- **Approved Emails**:
  - List of all approved admin emails
  - Add new email to approved list
  - Remove email from approved list
  - Mark email as super admin
  
- **Super Admin Settings**:
  - Change super admin email address
  - Transfer super admin privileges
  - Security settings
  
- **Admin Activity Log**:
  - Recent admin logins
  - Failed login attempts
  - Admin actions history

#### CostsPage

**Location**: `admin-dashboard/src/pages/CostsPage.tsx`

**Features**:
- Current month costs
- Budget remaining indicator ($20/month emergency budget)
- Cost breakdown pie chart (AWS, APIs, hosting, etc.)
- Cost trends line chart (last 6 months)
- Cost per user metric
- Cost per active user
- Cost projections (next month)
- Cost alerts (when exceeding budget)
- Service-specific costs:
  - AWS RDS (database)
  - AWS S3 (storage)
  - AWS EC2/ECS (compute)
  - API costs (if any)
  - Hosting costs
  - Email service costs

#### ContentModerationPage

**Location**: `admin-dashboard/src/pages/ContentModerationPage.tsx`

**Features**:
- **Public Recipes List**:
  - Data table with all public user recipes
  - Filter by status (approved, pending, flagged, hidden)
  - Search by title or author
  - Sort by creation date, views, favorites
  
- **Recipe Detail Modal**:
  - Full recipe information (ingredients, instructions, images)
  - Author information
  - View count and favorite count
  - Report history if flagged
  
- **Moderation Actions**:
  - Hide recipe button with reason input
  - Delete recipe button with confirmation
  - Flag for review button
  - Approve recipe button
  
- **Reported Content**:
  - List of reported recipes
  - Report reason and reporter info
  - Quick action buttons

#### PointsManagementPage

**Location**: `admin-dashboard/src/pages/PointsManagementPage.tsx`

**Features**:
- **Points Leaderboard**:
  - Top 100 users by points
  - User name, points, level
  - Filter by time period
  
- **Points Adjustment**:
  - Search user by name or email
  - Add/subtract points with reason
  - View adjustment history
  
- **Points Configuration**:
  - List of all point-earning actions
  - Edit point values
  - Create custom actions
  - Enable/disable actions
  
- **Level Statistics**:
  - User distribution across levels
  - Level progression chart
  - Average points per level
  
- **Bulk Points Award**:
  - Select multiple users
  - Award bonus points
  - Reason field for audit

#### CommunityActivityPage

**Location**: `admin-dashboard/src/pages/CommunityActivityPage.tsx`

**Features**:
- **Activity Feed**:
  - Recent community activities
  - Filter by type (share, achievement, milestone, contribution)
  - User information and timestamp
  
- **Most Active Users**:
  - Leaderboard of active users
  - Activity count over last 30 days
  - User profile links
  
- **Achievement Statistics**:
  - Most unlocked achievements
  - Achievement distribution chart
  - Unlock trends over time
  
- **Milestone Tracking**:
  - User progression through milestones
  - Milestone completion rates
  
- **Engagement Trends**:
  - Line chart showing engagement over time
  - Breakdown by activity type

#### NotificationsManagementPage

**Location**: `admin-dashboard/src/pages/NotificationsManagementPage.tsx`

**Features**:
- **Notification History**:
  - List of all sent notifications
  - Title, recipient count, delivery date
  - Delivery status indicators
  
- **Create Broadcast**:
  - Title and message inputs
  - Notification type selector
  - Preview function
  - Send to all users button
  
- **Create Targeted Notification**:
  - User segment selector
  - Filter by account type, subscription, activity level
  - Estimated recipient count
  - Preview and send
  
- **Notification Analytics**:
  - Delivery rate
  - Open rate
  - Click rate
  - Engagement trends

#### RecipeAnalyticsPage

**Location**: `admin-dashboard/src/pages/RecipeAnalyticsPage.tsx`

**Features**:
- **Popular Recipes**:
  - Most searched recipes
  - Search count over time
  - Recipe details on click
  
- **Popular Ingredients**:
  - Most used ingredients
  - Usage frequency
  - Category distribution
  
- **Search Trends**:
  - Recipe search trends chart
  - Trending searches
  - Search volume over time
  
- **Barcode Statistics**:
  - Total scans
  - Success rate
  - Failed lookups list
  - Barcode database coverage
  
- **API Usage Breakdown**:
  - Calls per API service
  - Cost per service
  - Response times

#### ShoppingAnalyticsPage

**Location**: `admin-dashboard/src/pages/ShoppingAnalyticsPage.tsx`

**Features**:
- **Common Items**:
  - Most added shopping list items
  - Frequency distribution
  
- **Completion Metrics**:
  - Shopping list completion rate
  - Average items per list
  - Completion trends
  
- **Engagement**:
  - Active users with shopping lists
  - List creation trends
  - Usage patterns

#### DietaryAnalyticsPage

**Location**: `admin-dashboard/src/pages/DietaryAnalyticsPage.tsx`

**Features**:
- **Dietary Restrictions**:
  - Most common restrictions
  - User count per restriction
  - Distribution chart
  
- **Allergy Distribution**:
  - Allergy types and prevalence
  - Pie chart visualization
  
- **Filter Usage**:
  - Most used dietary filters
  - Filter application frequency
  
- **Multiple Restrictions**:
  - Users with multiple restrictions
  - Average restrictions per user

#### DiscordManagementPage

**Location**: `admin-dashboard/src/pages/DiscordManagementPage.tsx`

**Features**:
- **Connection Status**:
  - Webhook connection indicator
  - Last check timestamp
  - Connection health
  
- **Configuration**:
  - Webhook URL input
  - Channel settings
  - Enable/disable toggle
  
- **Test Notifications**:
  - Send test message
  - View test results
  
- **Notification History**:
  - Recent Discord notifications
  - Success/failure status
  - Message content
  
- **Activity Logs**:
  - Total notifications sent
  - Success rate
  - Error logs

#### APIUsagePage

**Location**: `admin-dashboard/src/pages/APIUsagePage.tsx`

**Features**:
- **Usage Summary**:
  - API calls per service
  - Rate limit status
  - Remaining calls
  - Reset dates
  
- **Response Times**:
  - Average response time per service
  - P95 and P99 percentiles
  - Performance trends
  
- **Failure Tracking**:
  - Failure rate per service
  - Total failures
  - Error types
  
- **Cost Analysis**:
  - Cost per API call
  - Total API costs
  - Cost trends
  
- **Usage Trends**:
  - API usage over time
  - Service comparison chart

#### BulkOperationsPage

**Location**: `admin-dashboard/src/pages/BulkOperationsPage.tsx`

**Features**:
- **User Selection**:
  - Search and filter users
  - Multi-select checkbox
  - Selected count indicator
  
- **Bulk Actions**:
  - Suspend users
  - Grant subscriptions
  - Send notifications
  - Adjust points
  - Export data
  
- **Confirmation Dialog**:
  - Show affected user count
  - Require reason input
  - Preview changes
  
- **Progress Tracking**:
  - Progress bar during execution
  - Success/failure count
  - Error details
  
- **Operation History**:
  - Recent bulk operations
  - Admin who performed
  - Results summary

#### FeatureFlagsPage

**Location**: `admin-dashboard/src/pages/FeatureFlagsPage.tsx`

**Features**:
- **Feature Flags List**:
  - All feature flags
  - Enable/disable toggle
  - Affected user count
  - Description
  
- **User Segments**:
  - Create test segments
  - Define criteria
  - View segment size
  
- **Adoption Metrics**:
  - Feature adoption rates
  - Active users per feature
  - Usage trends
  
- **Gradual Rollout**:
  - Percentage slider (10%, 25%, 50%, 100%)
  - Affected user preview
  - Rollout schedule

#### ContentManagementPage

**Location**: `admin-dashboard/src/pages/ContentManagementPage.tsx`

**Features**:
- **Featured Recipes**:
  - Select recipes to feature
  - Reorder featured list
  - Set feature duration
  
- **Promotional Banners**:
  - Create/edit banners
  - Set display dates
  - Active/inactive toggle
  - Preview banner
  
- **Announcements**:
  - Create app announcements
  - Priority levels
  - Publish/unpublish
  
- **Legal Content**:
  - Edit terms of service
  - Edit privacy policy
  - Version history
  
- **FAQ Management**:
  - Add/edit FAQ items
  - Organize by category
  - Reorder questions
  
- **Content Preview**:
  - Preview before publishing
  - Mobile/desktop view toggle

### 2. Backend Routes

#### Admin Authentication Routes

**Base Path**: `/api/admin/auth`

```typescript
POST   /api/admin/auth/signup
  Body: { email: string, username: string, password: string }
  Response: { message: string } // "Registration successful. Please check your email for verification."
  Errors: 
    - 403: "Email not authorized for admin access"
    - 409: "Username or email already exists"

POST   /api/admin/auth/verify-email
  Body: { token: string }
  Response: { message: string } // "Email verified successfully"

POST   /api/admin/auth/login
  Body: { username: string, password: string }
  Response: { token: string, admin: AdminUser }
  Errors:
    - 401: "Invalid credentials"
    - 403: "Email not verified"

POST   /api/admin/auth/logout
  Response: { message: string }

GET    /api/admin/auth/me
  Response: { admin: AdminUser }

POST   /api/admin/auth/forgot-password
  Body: { email: string }
  Response: { message: string }

POST   /api/admin/auth/reset-password
  Body: { token: string, newPassword: string }
  Response: { message: string }
```

#### Admin Management Routes (Super Admin Only)

**Base Path**: `/api/admin/management`

```typescript
GET    /api/admin/management/admins
  Response: { admins: AdminUser[] }

GET    /api/admin/management/approved-emails
  Response: { emails: Array<{ email: string, is_super_admin: boolean, added_at: Date }> }

POST   /api/admin/management/approved-emails
  Body: { email: string, is_super_admin?: boolean }
  Response: { message: string, email: string }

DELETE /api/admin/management/approved-emails/:email
  Response: { message: string }

PATCH  /api/admin/management/admins/:id/remove
  Response: { message: string }

PATCH  /api/admin/management/super-admin/change-email
  Body: { newEmail: string, password: string }
  Response: { message: string, admin: AdminUser }

POST   /api/admin/management/admins/:id/reset-password
  Body: { newPassword: string }
  Response: { message: string }

GET    /api/admin/management/activity-log
  Query: { page: number, limit: number }
  Response: { 
    logs: Array<{
      admin_id: number,
      admin_email: string,
      action: string,
      timestamp: Date,
      ip_address: string,
      success: boolean
    }>,
    total: number
  }
```

#### User Management Routes

**Base Path**: `/api/admin/users`

```typescript
GET    /api/admin/users
  Query: { page: number, limit: number, search?: string, type?: string, status?: string, subscription?: string }
  Response: { users: User[], total: number, page: number, pages: number }

GET    /api/admin/users/:id
  Response: { 
    user: User, 
    stats: UserStats,
    subscription: Subscription | null,
    referrals: Referral[]
  }

PATCH  /api/admin/users/:id/co-founder
  Body: { is_co_founder: boolean }
  Response: { user: User }

PATCH  /api/admin/users/:id/suspend
  Body: { suspended: boolean, reason?: string }
  Response: { user: User }

DELETE /api/admin/users/:id
  Body: { confirmation: string } // Must be "DELETE"
  Response: { message: string }
```

#### Subscription Management Routes

**Base Path**: `/api/admin/subscriptions`

```typescript
GET    /api/admin/subscriptions
  Query: { page: number, limit: number, status?: string, plan?: string }
  Response: { subscriptions: Subscription[], total: number, page: number, pages: number }

GET    /api/admin/subscriptions/overview
  Response: {
    totalActive: number,
    totalCancelled: number,
    totalTrial: number,
    byPlan: { monthly: number, annual: number },
    upcomingRenewals: number,
    mrr: number
  }

POST   /api/admin/subscriptions/grant
  Body: { 
    userId: number, 
    plan: string, // 'monthly' | 'annual' | 'lifetime'
    duration?: number, // months (optional, for custom durations)
    reason: string 
  }
  Response: { subscription: Subscription }

PATCH  /api/admin/subscriptions/:id/cancel
  Body: { reason: string, refund?: boolean }
  Response: { subscription: Subscription }

PATCH  /api/admin/subscriptions/:id/extend
  Body: { months: number, reason: string }
  Response: { subscription: Subscription }

POST   /api/admin/subscriptions/:id/refund
  Body: { amount: number, reason: string }
  Response: { refund: Refund }

GET    /api/admin/subscriptions/billing-history
  Query: { page: number, limit: number, userId?: number }
  Response: { transactions: Transaction[], total: number }
```

#### Referral Management Routes

**Base Path**: `/api/admin/referrals`

```typescript
GET    /api/admin/referrals/overview
  Response: {
    totalReferrals: number,
    successfulReferrals: number,
    conversionRate: number,
    totalRevenue: number
  }

GET    /api/admin/referrals/top-referrers
  Query: { limit: number }
  Response: { referrers: Array<{ user: User, referralCount: number, revenue: number }> }

GET    /api/admin/referrals/codes
  Query: { page: number, limit: number }
  Response: { codes: ReferralCode[], total: number }

POST   /api/admin/referrals/codes
  Body: { code: string, userId?: number, reward?: number }
  Response: { code: ReferralCode }

PATCH  /api/admin/referrals/codes/:code/disable
  Response: { code: ReferralCode }
```

#### Analytics Routes

**Base Path**: `/api/admin/analytics`

```typescript
GET    /api/admin/analytics/overview
  Response: {
    users: {
      total: number,
      newToday: number,
      newThisWeek: number,
      newThisMonth: number,
      activeDaily: number,
      activeWeekly: number,
      activeMonthly: number,
      retentionRate: number,
      churnRate: number
    },
    revenue: {
      mrr: number,
      totalRevenue: number,
      revenueToday: number,
      revenueThisWeek: number,
      revenueThisMonth: number,
      arpu: number, // Average Revenue Per User
      ltv: number // Lifetime Value
    },
    subscriptions: {
      totalPremium: number,
      totalFree: number,
      totalTrial: number,
      conversionRate: number,
      cancellationsThisMonth: number
    },
    engagement: {
      ingredientsAdded: number,
      recipesSearched: number,
      recipesSaved: number,
      barcodesScanned: number,
      avgIngredientsPerUser: number,
      avgRecipesPerUser: number,
      dailyActiveRate: number
    },
    referrals: {
      totalReferrals: number,
      successfulReferrals: number,
      conversionRate: number,
      topReferrers: Array<{ userId: number, name: string, count: number }>
    }
  }

GET    /api/admin/analytics/growth
  Query: { days: number } // 30, 90, 180, 365
  Response: { 
    data: Array<{ 
      date: string, 
      totalUsers: number,
      newUsers: number,
      activeUsers: number,
      premiumUsers: number
    }> 
  }

GET    /api/admin/analytics/revenue-trends
  Query: { months: number }
  Response: {
    data: Array<{
      month: string,
      revenue: number,
      subscriptions: number,
      arpu: number
    }>
  }

GET    /api/admin/analytics/features
  Response: {
    ingredientsAdded: number,
    recipesSearched: number,
    recipesSaved: number,
    barcodesScanned: number,
    feedbackSubmitted: number,
    trends: Array<{ date: string, ingredients: number, recipes: number, scans: number }>
  }

GET    /api/admin/analytics/cohorts
  Query: { cohortType: 'weekly' | 'monthly' }
  Response: {
    cohorts: Array<{
      cohort: string, // e.g., "2024-W01" or "2024-01"
      users: number,
      retention: Array<{ period: number, percentage: number }>
    }>
  }

GET    /api/admin/analytics/export
  Query: { format: 'csv' | 'json', type: 'users' | 'revenue' | 'engagement' }
  Response: File download
```

#### Feedback Routes

**Base Path**: `/api/admin/feedback`

```typescript
GET    /api/admin/feedback
  Query: { page: number, limit: number, category?: string, rating?: number, status?: string }
  Response: { feedback: Feedback[], total: number, page: number, pages: number }

GET    /api/admin/feedback/:id
  Response: { feedback: Feedback }

PATCH  /api/admin/feedback/:id/status
  Body: { status: string }
  Response: { feedback: Feedback }

PATCH  /api/admin/feedback/:id/notes
  Body: { notes: string }
  Response: { feedback: Feedback }

GET    /api/admin/feedback/export
  Response: CSV file download
```

#### Error Monitoring Routes

**Base Path**: `/api/admin/errors`

```typescript
GET    /api/admin/errors
  Query: { page: number, limit: number, severity?: string }
  Response: { errors: Error[], total: number }

GET    /api/admin/errors/:id
  Response: { error: Error }

GET    /api/admin/errors/frequency
  Query: { days: number }
  Response: { data: Array<{ date: string, count: number }> }
```

#### Cache Management Routes

**Base Path**: `/api/admin/cache`

```typescript
GET    /api/admin/cache/stats
  Response: {
    totalRecipes: number,
    hitRate: number,
    apiCallsSaved: number,
    storageUsed: number
  }

GET    /api/admin/cache/popular
  Response: { recipes: Array<{ id: number, title: string, accessCount: number }> }

DELETE /api/admin/cache/expired
  Response: { message: string, removed: number }

DELETE /api/admin/cache/all
  Body: { password: string }
  Response: { message: string, removed: number }
```

#### System Health Routes

**Base Path**: `/api/admin/health`

```typescript
GET    /api/admin/health/overview
  Response: {
    status: 'healthy' | 'degraded' | 'down',
    uptime: number, // seconds
    uptimePercentage: { day: number, week: number, month: number }
  }

GET    /api/admin/health/server
  Response: {
    cpu: { current: number, average: number, peak: number },
    memory: { used: number, total: number, percentage: number },
    disk: { used: number, total: number, percentage: number },
    processes: number
  }

GET    /api/admin/health/database
  Response: {
    status: 'connected' | 'disconnected',
    connections: { active: number, idle: number, max: number },
    queryPerformance: { average: number, slow: number },
    size: number, // MB
    tables: Array<{ name: string, size: number, rows: number }>
  }

GET    /api/admin/health/api
  Response: {
    requestRate: number, // requests per minute
    averageResponseTime: number, // ms
    errorRate: number, // percentage
    endpoints: Array<{ path: string, avgTime: number, errorRate: number }>
  }

GET    /api/admin/health/external-services
  Response: {
    services: Array<{
      name: string,
      status: 'up' | 'down' | 'degraded',
      responseTime: number,
      lastChecked: Date
    }>
  }

GET    /api/admin/health/cache
  Response: {
    recipeCache: { hitRate: number, size: number, evictions: number },
    barcodeCache: { hitRate: number, size: number, evictions: number }
  }
```

#### Cost Monitoring Routes

**Base Path**: `/api/admin/costs`

```typescript
GET    /api/admin/costs/current
  Response: {
    currentMonth: number,
    breakdown: Array<{ service: string, cost: number, percentage: number }>,
    budget: number,
    remaining: number,
    percentUsed: number
  }

GET    /api/admin/costs/trends
  Query: { months: number }
  Response: { data: Array<{ month: string, cost: number, users: number, costPerUser: number }> }

GET    /api/admin/costs/per-user
  Response: { 
    costPerUser: number,
    costPerActiveUser: number,
    trend: 'increasing' | 'decreasing' | 'stable'
  }

GET    /api/admin/costs/projections
  Response: {
    nextMonth: number,
    confidence: number, // percentage
    factors: Array<{ name: string, impact: number }>
  }

GET    /api/admin/costs/alerts
  Response: {
    alerts: Array<{
      type: 'warning' | 'critical',
      message: string,
      threshold: number,
      current: number
    }>
  }
```

#### Content Moderation Routes

**Base Path**: `/api/admin/content`

```typescript
GET    /api/admin/content/recipes
  Query: { page: number, limit: number, status?: string, search?: string }
  Response: { recipes: UserRecipe[], total: number, page: number, pages: number }

GET    /api/admin/content/recipes/:id
  Response: { recipe: UserRecipe, author: User, reports: Report[] }

PATCH  /api/admin/content/recipes/:id/hide
  Body: { reason: string }
  Response: { recipe: UserRecipe }

DELETE /api/admin/content/recipes/:id
  Body: { confirmation: string } // Must be "DELETE"
  Response: { message: string }

PATCH  /api/admin/content/recipes/:id/flag
  Body: { reason: string }
  Response: { recipe: UserRecipe }

PATCH  /api/admin/content/recipes/:id/approve
  Response: { recipe: UserRecipe }

GET    /api/admin/content/reports
  Query: { page: number, limit: number, status?: string }
  Response: { reports: Report[], total: number }
```

#### Points Management Routes

**Base Path**: `/api/admin/points`

```typescript
GET    /api/admin/points/leaderboard
  Query: { limit: number }
  Response: { users: Array<{ user: User, points: number, level: number }> }

POST   /api/admin/points/adjust
  Body: { userId: number, points: number, reason: string, action: 'add' | 'subtract' }
  Response: { success: boolean, newTotal: number }

GET    /api/admin/points/transactions/:userId
  Query: { page: number, limit: number }
  Response: { transactions: PointTransaction[], total: number }

PATCH  /api/admin/points/actions/:action
  Body: { points: number }
  Response: { action: PointAction }

POST   /api/admin/points/actions
  Body: { name: string, description: string, points: number }
  Response: { action: PointAction }

GET    /api/admin/points/levels
  Response: { levels: Array<{ level: number, minPoints: number, userCount: number }> }

POST   /api/admin/points/bulk-award
  Body: { userIds: number[], points: number, reason: string }
  Response: { success: boolean, affectedUsers: number }
```

#### Community Activity Routes

**Base Path**: `/api/admin/community`

```typescript
GET    /api/admin/community/activities
  Query: { page: number, limit: number, type?: string }
  Response: { activities: Activity[], total: number }

GET    /api/admin/community/active-users
  Query: { days: number, limit: number }
  Response: { users: Array<{ user: User, activityCount: number }> }

GET    /api/admin/community/achievements
  Response: { 
    achievements: Array<{ name: string, unlockCount: number }>,
    total: number
  }

GET    /api/admin/community/milestones
  Response: {
    milestones: Array<{ name: string, userCount: number }>
  }

GET    /api/admin/community/engagement
  Query: { days: number }
  Response: {
    data: Array<{ date: string, shares: number, achievements: number, contributions: number }>
  }
```

#### Notifications Management Routes

**Base Path**: `/api/admin/notifications`

```typescript
GET    /api/admin/notifications
  Query: { page: number, limit: number }
  Response: { notifications: Notification[], total: number }

POST   /api/admin/notifications/broadcast
  Body: { title: string, message: string, type: string }
  Response: { notification: Notification, recipientCount: number }

POST   /api/admin/notifications/targeted
  Body: { 
    title: string, 
    message: string, 
    type: string,
    segment: { accountType?: string, subscriptionStatus?: string, activityLevel?: string }
  }
  Response: { notification: Notification, recipientCount: number }

GET    /api/admin/notifications/:id/stats
  Response: {
    sent: number,
    delivered: number,
    opened: number,
    clicked: number,
    openRate: number,
    clickRate: number
  }

POST   /api/admin/notifications/preview
  Body: { title: string, message: string, type: string }
  Response: { preview: string }
```

#### Recipe & Ingredient Analytics Routes

**Base Path**: `/api/admin/analytics/recipes`

```typescript
GET    /api/admin/analytics/recipes/popular
  Query: { days: number, limit: number }
  Response: { recipes: Array<{ title: string, searchCount: number }> }

GET    /api/admin/analytics/ingredients/popular
  Query: { limit: number }
  Response: { ingredients: Array<{ name: string, usageCount: number }> }

GET    /api/admin/analytics/recipes/trends
  Query: { days: number }
  Response: { data: Array<{ date: string, searches: number }> }

GET    /api/admin/analytics/barcodes
  Response: {
    totalScans: number,
    successRate: number,
    failedLookups: Array<{ barcode: string, frequency: number }>
  }

GET    /api/admin/analytics/api-usage
  Response: {
    breakdown: Array<{ service: string, calls: number, percentage: number }>
  }

GET    /api/admin/analytics/ingredients/categories
  Response: {
    categories: Array<{ category: string, count: number, percentage: number }>
  }
```

#### Shopping List Analytics Routes

**Base Path**: `/api/admin/analytics/shopping`

```typescript
GET    /api/admin/analytics/shopping/items
  Query: { limit: number }
  Response: { items: Array<{ item: string, frequency: number }> }

GET    /api/admin/analytics/shopping/completion
  Response: { completionRate: number, avgItemsPerList: number }

GET    /api/admin/analytics/shopping/trends
  Query: { days: number }
  Response: { data: Array<{ date: string, listsCreated: number }> }

GET    /api/admin/analytics/shopping/engagement
  Response: { activeUsers: number, totalLists: number }
```

#### Dietary Analytics Routes

**Base Path**: `/api/admin/analytics/dietary`

```typescript
GET    /api/admin/analytics/dietary/restrictions
  Response: { restrictions: Array<{ name: string, userCount: number }> }

GET    /api/admin/analytics/dietary/allergies
  Response: { allergies: Array<{ name: string, userCount: number, percentage: number }> }

GET    /api/admin/analytics/dietary/filters
  Response: { filters: Array<{ filter: string, usageCount: number }> }

GET    /api/admin/analytics/dietary/multiple
  Response: { usersWithMultiple: number, avgRestrictionsPerUser: number }
```

#### Discord Integration Routes

**Base Path**: `/api/admin/discord`

```typescript
GET    /api/admin/discord/status
  Response: { connected: boolean, lastCheck: Date, webhookUrl: string }

POST   /api/admin/discord/test
  Body: { message: string }
  Response: { success: boolean, message: string }

PATCH  /api/admin/discord/config
  Body: { webhookUrl: string, enabled: boolean, channels: object }
  Response: { config: DiscordConfig }

GET    /api/admin/discord/history
  Query: { page: number, limit: number }
  Response: { notifications: Array<{ timestamp: Date, message: string, success: boolean }> }

GET    /api/admin/discord/activity
  Response: { 
    totalSent: number,
    successRate: number,
    lastSent: Date
  }

PATCH  /api/admin/discord/toggle
  Body: { enabled: boolean }
  Response: { enabled: boolean }
```

#### API Usage & Rate Limiting Routes

**Base Path**: `/api/admin/api-usage`

```typescript
GET    /api/admin/api-usage/summary
  Query: { month?: string }
  Response: {
    services: Array<{
      name: string,
      calls: number,
      remaining: number,
      limit: number,
      resetDate: Date
    }>
  }

GET    /api/admin/api-usage/response-times
  Response: {
    services: Array<{ name: string, avgResponseTime: number, p95: number, p99: number }>
  }

GET    /api/admin/api-usage/failures
  Query: { days: number }
  Response: {
    services: Array<{ name: string, failureRate: number, totalFailures: number }>
  }

GET    /api/admin/api-usage/costs
  Response: {
    services: Array<{ name: string, costPerCall: number, totalCost: number }>
  }

GET    /api/admin/api-usage/trends
  Query: { days: number }
  Response: {
    data: Array<{ date: string, calls: object }>
  }
```

#### Bulk Operations Routes

**Base Path**: `/api/admin/bulk`

```typescript
POST   /api/admin/bulk/users/suspend
  Body: { userIds: number[], reason: string }
  Response: { success: number, failed: number, errors: Array<{ userId: number, error: string }> }

POST   /api/admin/bulk/subscriptions/grant
  Body: { userIds: number[], plan: string, duration: number, reason: string }
  Response: { success: number, failed: number, errors: Array<{ userId: number, error: string }> }

POST   /api/admin/bulk/notifications/send
  Body: { userIds: number[], title: string, message: string, type: string }
  Response: { success: number, failed: number }

POST   /api/admin/bulk/points/adjust
  Body: { userIds: number[], points: number, reason: string, action: 'add' | 'subtract' }
  Response: { success: number, failed: number, totalPointsAdjusted: number }

GET    /api/admin/bulk/export
  Query: { type: 'users' | 'subscriptions' | 'feedback', format: 'csv' | 'json', filters: object }
  Response: File download
```

#### Feature Flags Routes

**Base Path**: `/api/admin/features`

```typescript
GET    /api/admin/features/flags
  Response: { flags: Array<{ name: string, enabled: boolean, affectedUsers: number, description: string }> }

PATCH  /api/admin/features/flags/:name
  Body: { enabled: boolean }
  Response: { flag: FeatureFlag }

POST   /api/admin/features/segments
  Body: { name: string, criteria: object }
  Response: { segment: UserSegment, userCount: number }

GET    /api/admin/features/adoption
  Query: { featureName: string }
  Response: { adoptionRate: number, activeUsers: number, totalUsers: number }

PATCH  /api/admin/features/rollout/:name
  Body: { percentage: number }
  Response: { flag: FeatureFlag, affectedUsers: number }
```

#### Content Management Routes

**Base Path**: `/api/admin/cms`

```typescript
GET    /api/admin/cms/featured-recipes
  Response: { recipes: Array<{ id: number, title: string, featured: boolean }> }

POST   /api/admin/cms/featured-recipes
  Body: { recipeIds: number[] }
  Response: { success: boolean, count: number }

GET    /api/admin/cms/banners
  Response: { banners: Array<{ id: number, title: string, message: string, active: boolean, startDate: Date, endDate: Date }> }

POST   /api/admin/cms/banners
  Body: { title: string, message: string, startDate: Date, endDate: Date }
  Response: { banner: Banner }

PATCH  /api/admin/cms/banners/:id
  Body: { title?: string, message?: string, active?: boolean }
  Response: { banner: Banner }

DELETE /api/admin/cms/banners/:id
  Response: { success: boolean }

GET    /api/admin/cms/announcements
  Response: { announcements: Array<{ id: number, title: string, content: string, active: boolean }> }

POST   /api/admin/cms/announcements
  Body: { title: string, content: string, priority: string }
  Response: { announcement: Announcement }

PATCH  /api/admin/cms/content/:type
  Body: { content: string }
  Response: { success: boolean }
  // Types: 'terms', 'privacy', 'faq'

GET    /api/admin/cms/content/:type
  Response: { content: string, lastUpdated: Date }

POST   /api/admin/cms/preview
  Body: { type: string, content: object }
  Response: { preview: string }
```

### 3. Backend Middleware

#### Admin Authentication Middleware

**Location**: `backend/src/middleware/adminAuth.ts`

**Implementation**:
```typescript
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication error' });
  }
};
```

### 4. Database Models

#### Admin Users Model

**Location**: `backend/src/models/AdminUser.ts`

**Schema**:
```typescript
interface AdminUser {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  name: string;
  is_super_admin: boolean;
  email_verified: boolean;
  verification_token: string | null;
  reset_token: string | null;
  reset_token_expires: Date | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}
```

**SQL**:
```sql
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  is_super_admin BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expires TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Insert super admin email
INSERT INTO approved_admin_emails (email, is_super_admin) 
VALUES ('tootallgames2020@gmail.com', TRUE);
```

#### Approved Admin Emails Model

**Location**: `backend/src/models/ApprovedAdminEmail.ts`

**Schema**:
```typescript
interface ApprovedAdminEmail {
  id: number;
  email: string;
  is_super_admin: boolean;
  added_by: number | null; // admin_id who added this email
  added_at: Date;
}
```

**SQL**:
```sql
CREATE TABLE approved_admin_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_super_admin BOOLEAN DEFAULT FALSE,
  added_by INTEGER REFERENCES admin_users(id),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approved_admin_emails_email ON approved_admin_emails(email);
```

#### Admin Activity Log Model

**Location**: `backend/src/models/AdminActivityLog.ts`

**Schema**:
```typescript
interface AdminActivityLog {
  id: number;
  admin_id: number;
  action: string; // 'login', 'logout', 'failed_login', 'signup', etc.
  ip_address: string;
  user_agent: string;
  success: boolean;
  details: object | null;
  created_at: Date;
}
```

**SQL**:
```sql
CREATE TABLE admin_activity_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES admin_users(id),
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX idx_admin_activity_logs_action ON admin_activity_logs(action);
```

#### Admin Audit Log Model

**Location**: `backend/src/models/AdminAuditLog.ts`

**Schema**:
```typescript
interface AdminAuditLog {
  id: number;
  admin_id: number;
  action_type: string; // 'user_update', 'user_delete', 'cache_clear', 'subscription_grant', etc.
  resource_type: string; // 'user', 'feedback', 'cache', 'subscription', etc.
  resource_id: number | null;
  details: object; // JSON field with action details
  created_at: Date;
}
```

**SQL**:
```sql
CREATE TABLE admin_audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  action_type VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX idx_admin_audit_logs_resource ON admin_audit_logs(resource_type, resource_id);
```

## Data Flow

### Authentication Flow

```
1. Admin enters credentials on LoginPage
2. Frontend calls POST /api/admin/auth/login
3. Backend validates credentials and checks is_admin flag
4. Backend creates JWT token with admin claims
5. Frontend stores token in localStorage
6. Frontend redirects to OverviewPage
7. All subsequent API calls include token in Authorization header
```

### User Management Flow

```
1. Admin navigates to UsersPage
2. Frontend calls GET /api/admin/users with pagination
3. Backend queries users table with filters
4. Frontend displays users in data table
5. Admin clicks on user row
6. Frontend calls GET /api/admin/users/:id
7. Backend returns user details and stats
8. Frontend displays user detail modal
9. Admin performs action (e.g., mark co-founder)
10. Frontend calls PATCH /api/admin/users/:id/co-founder
11. Backend updates user and logs action to audit log
12. Frontend refreshes user list
```

### Real-time Updates Flow

```
1. Frontend sets up React Query with refetchInterval: 300000 (5 minutes)
2. React Query automatically refetches analytics data every 5 minutes
3. For critical errors, backend could push via WebSocket (future enhancement)
4. Frontend displays browser notification for new critical errors
```

## Error Handling

### Frontend Error Handling

- **Network Errors**: Display toast notification with retry button
- **Authentication Errors**: Redirect to login page
- **Authorization Errors**: Display "Access Denied" message
- **Validation Errors**: Display inline error messages on forms
- **Server Errors**: Display generic error message and log to console

### Backend Error Handling

- **Invalid Credentials**: Return 401 with error message
- **Missing Admin Privileges**: Return 403 with error message
- **Resource Not Found**: Return 404 with error message
- **Validation Errors**: Return 400 with detailed error messages
- **Server Errors**: Return 500 and log error to Discord

## Security Considerations

### Authentication & Authorization

- **JWT Tokens**: Short-lived (8 hours), stored in localStorage
- **Admin Flag**: Checked on every admin route
- **Password Hashing**: bcrypt with salt rounds (existing implementation)
- **HTTPS Only**: All communications encrypted

### CSRF Protection

- **SameSite Cookies**: Set to 'strict' for session cookies
- **CSRF Tokens**: Include in state-changing requests
- **Origin Validation**: Check Origin header on backend

### Rate Limiting

- **Login Attempts**: Max 5 attempts per 15 minutes per IP
- **API Calls**: Max 100 requests per minute per admin user
- **Export Functions**: Max 10 exports per hour per admin

### Audit Logging

- **All Admin Actions**: Logged to admin_audit_logs table
- **Sensitive Actions**: Require password confirmation (e.g., delete user, clear all cache)
- **Log Retention**: 90 days before automatic deletion

## Performance Optimization

### Frontend Performance

- **Code Splitting**: Lazy load pages with React.lazy()
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large data tables (react-window)
- **Image Optimization**: Compress and lazy load images
- **Bundle Size**: Keep under 500KB gzipped

### Backend Performance

- **Database Indexing**: Index frequently queried columns
- **Query Optimization**: Use EXPLAIN to optimize slow queries
- **Caching**: Cache analytics data for 5 minutes (Redis or in-memory)
- **Pagination**: Limit results to 50 per page
- **Connection Pooling**: Reuse database connections

### API Response Times

- **Target**: < 200ms for most endpoints
- **Analytics**: < 500ms (acceptable for complex queries)
- **Exports**: < 2 seconds for CSV generation

## Testing Strategy

### Frontend Testing

- **Unit Tests**: Jest + React Testing Library
  - Test individual components
  - Test custom hooks
  - Test utility functions

- **Integration Tests**: Test component interactions
  - Test form submissions
  - Test navigation
  - Test API integration with MSW (Mock Service Worker)

- **E2E Tests**: Cypress (optional)
  - Test critical user flows
  - Test authentication
  - Test user management

### Backend Testing

- **Unit Tests**: Jest
  - Test middleware functions
  - Test route handlers
  - Test service functions

- **Integration Tests**: Supertest
  - Test API endpoints
  - Test authentication
  - Test authorization

- **Database Tests**: Test with test database
  - Test queries
  - Test transactions
  - Test constraints

## Deployment Strategy

### Frontend Deployment

**Option 1: Vercel (Recommended)**
- Free tier available
- Automatic deployments from Git
- CDN included
- Custom domain support
- HTTPS by default

**Option 2: Netlify**
- Similar to Vercel
- Free tier available
- Good for static sites

**Option 3: AWS S3 + CloudFront**
- More control
- Slightly more complex setup
- Fits within free tier

### Backend Deployment

- **No Changes Needed**: Admin routes added to existing Express backend
- **Environment Variables**: Add ADMIN_JWT_SECRET
- **Database Migration**: Run migration to create admin_audit_logs table

### Deployment Steps

1. Build React app: `npm run build`
2. Deploy build folder to hosting service
3. Update backend with admin routes
4. Run database migration
5. Set environment variables
6. Test admin login
7. Monitor for errors

## Cost Analysis

### Development Costs

- **Frontend**: $0 (React, MUI, Recharts all free)
- **Backend**: $0 (extend existing Express backend)
- **Database**: $0 (use existing PostgreSQL)

### Operational Costs

- **Hosting**: $0 (Vercel/Netlify free tier)
- **CDN**: $0 (included with hosting)
- **Database**: $0 (existing RDS instance)
- **Bandwidth**: Negligible (admin-only traffic)

### Total Cost

**$0/month** - Completely free using existing infrastructure and free tiers

## Technology Stack Summary

### Frontend
- React 18 + TypeScript
- Material-UI (MUI) v5
- React Query (TanStack Query)
- Recharts
- React Router v6
- Axios

### Backend
- Node.js + Express (existing)
- PostgreSQL (existing)
- JWT for authentication
- bcrypt for password hashing

### Deployment
- Vercel/Netlify (frontend)
- Existing backend infrastructure

### Development Tools
- Vite (build tool)
- ESLint + Prettier
- Jest + React Testing Library

## Future Enhancements

### Phase 2 Features

1. **WebSocket Integration**: Real-time updates for critical events
2. **Advanced Analytics**: Cohort analysis, retention metrics
3. **User Impersonation**: View app as specific user (for support)
4. **Bulk Actions**: Bulk user operations
5. **Custom Reports**: Generate custom analytics reports
6. **Email Notifications**: Alert admins via email for critical events
7. **Mobile App**: React Native admin app for on-the-go monitoring
8. **Role-Based Access**: Different admin levels (super admin, support, analyst)

### Performance Enhancements

1. **Redis Caching**: Cache analytics data
2. **GraphQL**: More efficient data fetching
3. **Server-Side Rendering**: Faster initial load
4. **Progressive Web App**: Offline support

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Set up React project with TypeScript
- Configure Material-UI
- Create authentication system
- Build dashboard layout
- Add admin routes to backend

### Phase 2: User Management (Week 1)
- Build UsersPage with data table
- Implement search and filters
- Add user detail modal
- Implement user actions (co-founder, suspend, delete)

### Phase 3: Analytics (Week 2)
- Build OverviewPage with metrics
- Implement charts with Recharts
- Add analytics API endpoints
- Implement auto-refresh

### Phase 4: Feedback & Errors (Week 2)
- Build FeedbackPage
- Build ErrorsPage
- Implement filtering and status updates
- Add CSV export

### Phase 5: Cache & Costs (Week 3)
- Build CachePage
- Build CostsPage
- Implement cache management
- Add cost tracking

### Phase 6: Polish & Deploy (Week 3)
- Add audit logging
- Implement security measures
- Write tests
- Deploy to production
- Documentation

## Success Metrics

- **Load Time**: < 2 seconds for initial dashboard load
- **API Response Time**: < 200ms for most endpoints
- **Uptime**: 99.9% availability
- **User Satisfaction**: Positive feedback from admin users
- **Bug Rate**: < 1 critical bug per month
- **Adoption**: All admin tasks performed through dashboard (no direct database access)
