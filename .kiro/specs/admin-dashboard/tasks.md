# Admin Dashboard Implementation Plan

## Phase 1: Backend Foundation & Authentication

- [x] 1. Set up database schema for admin system





  - Create admin_users table with email, username, password_hash, is_super_admin, email_verified fields
  - Create approved_admin_emails table with email, is_super_admin, added_by fields
  - Create admin_activity_logs table for login/logout tracking
  - Create admin_audit_logs table for action tracking
  - Add indexes for performance (email, username, created_at)
  - Insert initial super admin email (tootallgames2020@gmail.com) into approved_admin_emails










  - _Requirements: 1.2, 1.3, 1.14, 10.1, 10.2_



- [ ] 2. Implement admin authentication backend
  - [x] 2.1 Create AdminUser model (backend/src/models/AdminUser.ts)



    - Implement database queries (create, findByEmail, findByUsername, findById, update)
    - Add password hashing with bcrypt
    - Add email verification token generation
    - Add password reset token generation



    - _Requirements: 1.2, 1.6, 1.7_

  - [ ] 2.2 Create admin authentication routes (backend/src/routes/adminAuth.ts)
    - POST /api/admin/auth/signup - Check approved emails, create admin, send verification email





    - POST /api/admin/auth/verify-email - Verify email token and activate account
    - POST /api/admin/auth/login - Validate credentials, create JWT token, log activity


    - POST /api/admin/auth/logout - Invalidate session, log activity


    - GET /api/admin/auth/me - Return current admin user

    - POST /api/admin/auth/forgot-password - Generate reset token, send email


    - POST /api/admin/auth/reset-password - Validate token, update password


    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_








  - [ ] 2.3 Create admin authentication middleware (backend/src/middleware/adminAuth.ts)
    - Implement requireAdmin middleware (verify JWT, check admin status)



    - Implement requireSuperAdmin middleware (verify super admin status)


    - Add IP address and user agent logging
    - Add rate limiting for login attempts (5 per 15 minutes)
    - _Requirements: 1.3, 1.8, 10.6_

  - [ ] 2.4 Create admin activity logging service (backend/src/services/AdminActivityLogger.ts)
    - Log successful logins with IP and user agent



    - Log failed login attempts
    - Log logout events
    - Log signup attempts
    - _Requirements: 10.1, 10.2_

- [ ] 3. Implement admin management backend (super admin only)
  - [ ] 3.1 Create ApprovedAdminEmail model (backend/src/models/ApprovedAdminEmail.ts)
    - Implement database queries (getAll, add, remove, checkApproved)


    - _Requirements: 1.2, 1.11, 1.12_

  - [ ] 3.2 Create admin management routes (backend/src/routes/adminManagement.ts)
    - GET /api/admin/management/admins - List all admins
    - GET /api/admin/management/approved-emails - List approved emails
    - POST /api/admin/management/approved-emails - Add email to approved list
    - DELETE /api/admin/management/approved-emails/:email - Remove email from list
    - PATCH /api/admin/management/admins/:id/remove - Remove admin access


    - PATCH /api/admin/management/super-admin/change-email - Change super admin email
    - POST /api/admin/management/admins/:id/reset-password - Reset admin password
    - GET /api/admin/management/activity-log - View admin activity logs
    - All routes protected with requireSuperAdmin middleware
    - _Requirements: 1.10, 1.11, 1.12, 1.13, 1.14_




## Phase 2: Backend API Endpoints

- [ ] 4. Implement user management API
  - Create backend/src/routes/adminUsers.ts
  - GET /api/admin/users - Paginated user list with search and filters
  - GET /api/admin/users/:id - User details with stats, subscription, referrals
  - PATCH /api/admin/users/:id/co-founder - Mark user as co-founder
  - PATCH /api/admin/users/:id/suspend - Suspend/unsuspend user account


  - DELETE /api/admin/users/:id - Delete user account (requires "DELETE" confirmation)
  - Add audit logging for all user management actions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 5. Implement subscription management API
  - Create backend/src/routes/adminSubscriptions.ts
  - GET /api/admin/subscriptions - List all subscriptions with filters


  - GET /api/admin/subscriptions/overview - Subscription metrics (MRR, active, cancelled, trial)
  - POST /api/admin/subscriptions/grant - Grant subscription to user
  - PATCH /api/admin/subscriptions/:id/cancel - Cancel subscription with reason
  - PATCH /api/admin/subscriptions/:id/extend - Extend subscription duration
  - POST /api/admin/subscriptions/:id/refund - Process refund
  - GET /api/admin/subscriptions/billing-history - View all transactions
  - Add audit logging for all subscription actions
  - _Requirements: 2.4, 2.5_




- [ ] 6. Implement analytics API
  - Create backend/src/routes/adminAnalytics.ts
  - GET /api/admin/analytics/overview - All key metrics (users, revenue, subscriptions, engagement, referrals)
  - GET /api/admin/analytics/growth - User growth data over time
  - GET /api/admin/analytics/revenue-trends - Revenue trends by month
  - GET /api/admin/analytics/features - Feature usage statistics
  - GET /api/admin/analytics/cohorts - Cohort analysis data
  - GET /api/admin/analytics/export - Export analytics data as CSV/JSON
  - Implement caching for analytics data (5-minute cache)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 7. Implement feedback management API
  - Create backend/src/routes/adminFeedback.ts
  - GET /api/admin/feedback - Paginated feedback list with filters
  - GET /api/admin/feedback/:id - Feedback details
  - PATCH /api/admin/feedback/:id/status - Update feedback status
  - PATCH /api/admin/feedback/:id/notes - Add internal notes
  - GET /api/admin/feedback/export - Export feedback as CSV
  - Calculate feedback statistics (average rating, category distribution)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 8. Implement error monitoring API
  - Create backend/src/routes/adminErrors.ts
  - GET /api/admin/errors - List recent errors with filters
  - GET /api/admin/errors/:id - Error details with stack trace
  - GET /api/admin/errors/frequency - Error frequency chart data
  - Integrate with existing NotificationService for error tracking
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.8_

- [ ] 9. Implement system health API
  - Create backend/src/routes/adminHealth.ts
  - GET /api/admin/health/overview - Overall system health status
  - GET /api/admin/health/server - Server metrics (CPU, memory, disk)
  - GET /api/admin/health/database - Database metrics (connections, performance, size)
  - GET /api/admin/health/api - API metrics (request rate, response time, error rate)
  - GET /api/admin/health/external-services - External service status checks
  - GET /api/admin/health/cache - Cache performance metrics
  - Implement system metrics collection service


  - _Requirements: 5.5, 5.6, 5.7_

- [ ] 10. Implement cache management API
  - Create backend/src/routes/adminCache.ts
  - GET /api/admin/cache/stats - Cache statistics (hit rate, size, API calls saved)
  - GET /api/admin/cache/popular - Most accessed recipes
  - DELETE /api/admin/cache/expired - Clear expired cache entries
  - DELETE /api/admin/cache/all - Clear all cache (requires password confirmation)
  - Add audit logging for cache operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 11. Implement cost monitoring API
  - Create backend/src/routes/adminCosts.ts
  - GET /api/admin/costs/current - Current month costs with breakdown
  - GET /api/admin/costs/trends - Cost trends over time
  - GET /api/admin/costs/per-user - Cost per user metrics
  - GET /api/admin/costs/projections - Cost projections for next month
  - GET /api/admin/costs/alerts - Budget alerts and warnings
  - Implement cost tracking service (manual entry or AWS API integration)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 12. Implement referral management API
  - Create backend/src/routes/adminReferrals.ts
  - GET /api/admin/referrals/overview - Referral metrics overview
  - GET /api/admin/referrals/top-referrers - Top referrers leaderboard
  - GET /api/admin/referrals/codes - All referral codes
  - POST /api/admin/referrals/codes - Create custom referral code
  - PATCH /api/admin/referrals/codes/:code/disable - Disable referral code
  - _Requirements: 3.5_

- [ ] 13. Implement content moderation API
  - Create backend/src/routes/adminContent.ts
  - GET /api/admin/content/recipes - List all public user recipes with filters
  - GET /api/admin/content/recipes/:id - Get recipe details with reports
  - PATCH /api/admin/content/recipes/:id/hide - Hide recipe from public view
  - DELETE /api/admin/content/recipes/:id - Delete recipe
  - PATCH /api/admin/content/recipes/:id/flag - Flag recipe for review
  - PATCH /api/admin/content/recipes/:id/approve - Approve flagged recipe
  - GET /api/admin/content/reports - List reported content
  - Add audit logging for all moderation actions
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [ ] 14. Implement points management API
  - Create backend/src/routes/adminPoints.ts
  - GET /api/admin/points/leaderboard - Get top users by points
  - POST /api/admin/points/adjust - Manually add/subtract points
  - GET /api/admin/points/transactions/:userId - Get user's points history
  - PATCH /api/admin/points/actions/:action - Modify point values
  - POST /api/admin/points/actions - Create custom point-earning actions
  - GET /api/admin/points/levels - Get level distribution statistics
  - POST /api/admin/points/bulk-award - Award bonus points to multiple users
  - Add audit logging for all points adjustments
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [ ] 15. Implement community activity API
  - Create backend/src/routes/adminCommunity.ts
  - GET /api/admin/community/activities - Get recent community activities
  - GET /api/admin/community/active-users - Get most active users
  - GET /api/admin/community/achievements - Get achievement statistics
  - GET /api/admin/community/milestones - Get milestone tracking data
  - GET /api/admin/community/engagement - Get engagement trends
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 16. Implement notifications management API
  - Create backend/src/routes/adminNotifications.ts
  - GET /api/admin/notifications - List all sent notifications
  - POST /api/admin/notifications/broadcast - Create broadcast notification
  - POST /api/admin/notifications/targeted - Create targeted notification
  - GET /api/admin/notifications/:id/stats - Get notification delivery stats
  - POST /api/admin/notifications/preview - Preview notification before sending
  - Implement user segmentation logic
  - Track notification engagement metrics
  - Add audit logging for notification sends
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ] 17. Implement recipe and ingredient analytics API
  - Create backend/src/routes/adminAnalyticsRecipes.ts
  - GET /api/admin/analytics/recipes/popular - Most searched recipes
  - GET /api/admin/analytics/ingredients/popular - Most used ingredients
  - GET /api/admin/analytics/recipes/trends - Recipe search trends
  - GET /api/admin/analytics/barcodes - Barcode scan statistics
  - GET /api/admin/analytics/api-usage - Recipe API usage breakdown
  - GET /api/admin/analytics/ingredients/categories - Ingredient category distribution
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 18. Implement shopping list analytics API
  - Create backend/src/routes/adminAnalyticsShopping.ts
  - GET /api/admin/analytics/shopping/items - Most common shopping list items
  - GET /api/admin/analytics/shopping/completion - Shopping list completion metrics
  - GET /api/admin/analytics/shopping/trends - Shopping list creation trends
  - GET /api/admin/analytics/shopping/engagement - Shopping list engagement metrics
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 19. Implement dietary analytics API
  - Create backend/src/routes/adminAnalyticsDietary.ts
  - GET /api/admin/analytics/dietary/restrictions - Common dietary restrictions
  - GET /api/admin/analytics/dietary/allergies - Allergy distribution
  - GET /api/admin/analytics/dietary/filters - Dietary filter usage
  - GET /api/admin/analytics/dietary/multiple - Users with multiple restrictions
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 20. Implement Discord integration API
  - Create backend/src/routes/adminDiscord.ts
  - GET /api/admin/discord/status - Get Discord connection status
  - POST /api/admin/discord/test - Send test Discord notification
  - PATCH /api/admin/discord/config - Update Discord configuration
  - GET /api/admin/discord/history - Get Discord notification history
  - GET /api/admin/discord/activity - Get Discord activity statistics
  - PATCH /api/admin/discord/toggle - Enable/disable Discord notifications
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6_

- [ ] 21. Implement API usage and rate limiting API
  - Create backend/src/routes/adminApiUsage.ts
  - GET /api/admin/api-usage/summary - Get API usage summary
  - GET /api/admin/api-usage/response-times - Get API response time metrics
  - GET /api/admin/api-usage/failures - Get API failure statistics
  - GET /api/admin/api-usage/costs - Get API cost breakdown
  - GET /api/admin/api-usage/trends - Get API usage trends
  - Implement rate limit monitoring
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

- [ ] 22. Implement bulk operations API
  - Create backend/src/routes/adminBulk.ts
  - POST /api/admin/bulk/users/suspend - Bulk suspend users
  - POST /api/admin/bulk/subscriptions/grant - Bulk grant subscriptions
  - POST /api/admin/bulk/notifications/send - Bulk send notifications
  - POST /api/admin/bulk/points/adjust - Bulk adjust points
  - GET /api/admin/bulk/export - Export data in bulk
  - Implement progress tracking for bulk operations
  - Add comprehensive error handling
  - Add audit logging for all bulk operations
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [ ] 23. Implement feature flags API
  - Create backend/src/routes/adminFeatures.ts
  - GET /api/admin/features/flags - List all feature flags
  - PATCH /api/admin/features/flags/:name - Enable/disable feature flag
  - POST /api/admin/features/segments - Create user segment for A/B testing
  - GET /api/admin/features/adoption - Get feature adoption metrics
  - PATCH /api/admin/features/rollout/:name - Set gradual rollout percentage
  - Add audit logging for feature flag changes
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

- [ ] 24. Implement content management API
  - Create backend/src/routes/adminCMS.ts
  - GET /api/admin/cms/featured-recipes - Get featured recipes
  - POST /api/admin/cms/featured-recipes - Set featured recipes
  - GET /api/admin/cms/banners - List promotional banners
  - POST /api/admin/cms/banners - Create promotional banner
  - PATCH /api/admin/cms/banners/:id - Update banner
  - DELETE /api/admin/cms/banners/:id - Delete banner
  - GET /api/admin/cms/announcements - List announcements
  - POST /api/admin/cms/announcements - Create announcement
  - PATCH /api/admin/cms/content/:type - Update legal content (terms, privacy, FAQ)
  - GET /api/admin/cms/content/:type - Get legal content
  - POST /api/admin/cms/preview - Preview content before publishing
  - Add audit logging for all content changes
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8_

## Phase 3: Frontend Setup & Authentication

- [ ] 13. Initialize React admin dashboard project
  - Create new React project with Vite and TypeScript
  - Install dependencies (Material-UI, React Router, React Query, Recharts, Axios)
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - Configure environment variables (.env for API URL)
  - Set up folder structure (pages, components, contexts, services, utils)
  - _Requirements: 8.1, 8.2_

- [ ] 14. Implement authentication frontend
  - [ ] 14.1 Create AuthContext (admin-dashboard/src/contexts/AuthContext.tsx)
    - Implement login, signup, logout functions
    - Store JWT token in localStorage
    - Implement token refresh logic
    - Track super admin status
    - _Requirements: 1.7, 1.8, 1.9_

  - [ ] 14.2 Create LoginPage (admin-dashboard/src/pages/LoginPage.tsx)
    - Username and password input fields
    - Remember me checkbox
    - Forgot password link
    - Sign up link
    - Error message display
    - Loading state
    - _Requirements: 1.7_

  - [ ] 14.3 Create SignupPage (admin-dashboard/src/pages/SignupPage.tsx)
    - Email, username, and password input fields
    - Password strength indicator
    - Terms and conditions checkbox
    - Submit button
    - Email verification message after signup
    - Error handling for unauthorized emails
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ] 14.4 Create EmailVerificationPage (admin-dashboard/src/pages/EmailVerificationPage.tsx)
    - Verify email token from URL
    - Success/error message display
    - Redirect to login after verification
    - _Requirements: 1.6_

  - [ ] 14.5 Create ForgotPasswordPage and ResetPasswordPage
    - Email input for password reset request
    - New password input with confirmation
    - Token validation
    - Success/error messages
    - _Requirements: 1.7_

- [ ] 15. Create dashboard layout
  - [ ] 15.1 Create DashboardLayout component (admin-dashboard/src/components/layout/DashboardLayout.tsx)
    - Responsive sidebar with navigation
    - Top bar with admin name and logout button
    - Breadcrumbs for navigation
    - Mobile drawer for sidebar
    - _Requirements: 8.2, 8.3_

  - [ ] 15.2 Create Sidebar component with navigation sections
    - Dashboard section
    - Users & Subscriptions section (Users, Subscriptions, Referrals)
    - Content & Feedback section (Feedback, Errors)
    - System section (System Health, Cache, Costs, Audit Log)
    - Admin Management section (visible only to super admin)
    - Icons for each menu item
    - Active state highlighting
    - _Requirements: 1.10_

  - [ ] 15.3 Create TopBar component
    - Admin name display
    - Logout button
    - Notifications icon (for critical errors)
    - Connection status indicator
    - _Requirements: 7.4_

## Phase 4: Frontend Pages - Overview & Users

- [ ] 16. Create OverviewPage (dashboard home)
  - [ ] 16.1 Create metric cards components
    - System health status card
    - User metrics cards (total, new, active, retention, churn)
    - Revenue metrics cards (MRR, total, ARPU, LTV)
    - Subscription metrics cards (premium, free, trial, conversion)
    - Engagement metrics cards (ingredients, recipes, scans)
    - Referral metrics cards
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 16.2 Create charts components
    - User growth line chart (Recharts)
    - Revenue trend line chart
    - Feature usage bar chart
    - Error frequency chart
    - _Requirements: 3.6, 3.7_

  - [ ] 16.3 Create recent activity components
    - Recent signups list
    - Recent errors list
    - Recent feedback list
    - Recent subscriptions list
    - _Requirements: 3.7_

  - [ ] 16.4 Implement auto-refresh for overview data
    - Set up React Query with 5-minute refetch interval
    - Add manual refresh button
    - Show last updated timestamp
    - _Requirements: 3.8, 7.1_

- [ ] 17. Create UsersPage
  - [ ] 17.1 Create users data table
    - Paginated table with Material-UI DataGrid
    - Columns: name, email, account type, subscription, join date, status
    - Row click to open user detail modal
    - Loading and empty states
    - _Requirements: 2.1, 2.8_

  - [ ] 17.2 Implement search and filters
    - Search bar for name/email
    - Filter chips for account type (co-founder, premium, free)
    - Filter chips for status (active, suspended)
    - Filter chips for subscription level
    - Clear filters button
    - _Requirements: 2.2, 2.3_

  - [ ] 17.3 Create user detail modal
    - Tabbed interface (Account Info, Subscription, Activity, Referrals)
    - Account Info tab: email, name, join date, last login
    - Subscription tab: current plan, billing history, grant/cancel actions
    - Activity tab: ingredients count, recipes count, searches, logins
    - Referrals tab: referral code, referred users, earnings
    - _Requirements: 2.4_

  - [ ] 17.4 Implement user actions
    - Mark as co-founder button with confirmation
    - Suspend/unsuspend button with reason input
    - Delete user button with "DELETE" confirmation
    - Manage subscription button
    - All actions with success/error notifications
    - _Requirements: 2.5, 2.6, 2.7_

## Phase 5: Frontend Pages - Subscriptions & Referrals

- [ ] 18. Create SubscriptionsPage
  - [ ] 18.1 Create subscription overview cards
    - Total active subscriptions
    - Subscriptions by plan (monthly/annual)
    - Trial subscriptions
    - Cancelled this month
    - Upcoming renewals
    - MRR
    - _Requirements: 3.3_

  - [ ] 18.2 Create subscription management section
    - Grant subscription form (search user, select plan, set duration)
    - Cancel subscription form (select subscription, enter reason, refund option)
    - Extend trial form
    - Apply discount form
    - _Requirements: 2.5_

  - [ ] 18.3 Create subscriptions data table
    - Columns: user, plan, status, start date, end date, revenue
    - Filter by status (active, cancelled, trial, expired)
    - Filter by plan type
    - Sort by date and revenue
    - _Requirements: 2.1_

  - [ ] 18.4 Create billing history section
    - All transactions table
    - Failed payments list
    - Refunds list
    - Revenue by month chart
    - _Requirements: 2.4_

- [ ] 19. Create ReferralsPage
  - [ ] 19.1 Create referral overview cards
    - Total referrals sent
    - Successful referrals
    - Conversion rate
    - Total referral revenue
    - _Requirements: 3.5_

  - [ ] 19.2 Create top referrers leaderboard
    - Table with user name, referral count, earnings
    - Filter by time period (this month, all time)
    - _Requirements: 3.5_

  - [ ] 19.3 Create referral tracking section
    - All referral codes table
    - Usage per code
    - Referral source tracking
    - Referral funnel visualization
    - _Requirements: 3.5_

  - [ ] 19.4 Create referral management section
    - Create custom referral code form
    - Disable referral code action
    - Set referral rewards form
    - Track referral payouts
    - _Requirements: 3.5_

## Phase 6: Frontend Pages - Feedback & Errors

- [ ] 20. Create FeedbackPage
  - [ ] 20.1 Create feedback statistics cards
    - Total feedback count
    - Average rating
    - Category distribution pie chart
    - Status distribution
    - _Requirements: 4.8_

  - [ ] 20.2 Create feedback list
    - Data table with user, rating, category, date, status
    - Star rating display
    - Filter by category (Bug, Feature Request, General)
    - Filter by rating (1-5 stars)
    - Filter by status (New, In Progress, Resolved, Ignored)
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 20.3 Create feedback detail modal
    - Full feedback message
    - User information
    - Status dropdown to update
    - Internal notes section
    - Timestamp and metadata
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ] 20.4 Implement export functionality
    - Export to CSV button
    - Include filters in export
    - Download file with timestamp
    - _Requirements: 4.7_

- [ ] 21. Create ErrorsPage
  - [ ] 21.1 Create error statistics cards
    - Total errors count
    - Critical errors count
    - Error rate percentage
    - Most common error type
    - _Requirements: 5.1_

  - [ ] 21.2 Create error frequency chart
    - Line chart showing errors over last 7 days
    - Breakdown by severity
    - _Requirements: 5.3_

  - [ ] 21.3 Create errors list
    - Data table with timestamp, severity, message, affected users
    - Severity badges (Critical=red, High=orange, Medium=yellow, Low=gray)
    - Filter by severity
    - Sort by date
    - _Requirements: 5.1, 5.2_

  - [ ] 21.4 Create error detail modal
    - Full error message
    - Stack trace display
    - Context information
    - Affected user count
    - Auto-repair status
    - _Requirements: 5.4, 5.7_

  - [ ] 21.5 Implement real-time error notifications
    - Browser notification for new critical errors
    - Badge count on errors menu item
    - Auto-refresh toggle
    - _Requirements: 5.8, 7.2_

## Phase 7: Frontend Pages - System & Admin

- [ ] 22. Create SystemHealthPage
  - [ ] 22.1 Create overall health status section
    - Health status indicator (green/yellow/red)
    - Uptime percentage cards (24h, 7d, 30d)
    - Last deployment info
    - _Requirements: 5.5, 5.6_

  - [ ] 22.2 Create server metrics section
    - CPU usage gauge chart
    - Memory usage gauge chart
    - Disk usage gauge chart
    - Process count
    - Network I/O
    - _Requirements: 5.5_

  - [ ] 22.3 Create database metrics section
    - Connection pool status
    - Active connections count
    - Query performance (slow queries list)
    - Database size
    - Table sizes table
    - _Requirements: 5.5_

  - [ ] 22.4 Create API metrics section
    - Request rate chart
    - Average response time
    - Error rate percentage
    - Endpoint performance breakdown table
    - _Requirements: 5.5_

  - [ ] 22.5 Create external services status section
    - Service status cards (Open Food Facts, TheMealDB, Edamam, Discord)
    - Response time for each service
    - Last checked timestamp
    - _Requirements: 5.5_

  - [ ] 22.6 Create cache metrics section
    - Recipe cache hit rate
    - Barcode cache hit rate
    - Cache memory usage
    - Cache eviction rate
    - _Requirements: 6.7_

- [ ] 23. Create CachePage
  - [ ] 23.1 Create cache statistics cards
    - Total cached recipes
    - Cache hit rate percentage
    - API calls saved count
    - Storage used (MB)
    - _Requirements: 6.1, 6.2_

  - [ ] 23.2 Create popular recipes table
    - Top 20 most accessed recipes
    - Recipe title, access count, last accessed
    - _Requirements: 6.3_

  - [ ] 23.3 Create cache management actions
    - Clear expired cache button with confirmation
    - Clear all cache button with password confirmation
    - Success/error notifications
    - Show number of entries removed
    - _Requirements: 6.4, 6.5, 6.6_

  - [ ] 23.4 Create cache performance metrics
    - Average lookup time
    - Cache efficiency percentage
    - Performance trend chart
    - _Requirements: 6.7_

- [ ] 24. Create CostsPage
  - [ ] 24.1 Create current costs section
    - Current month total cost
    - Budget remaining indicator (with warning colors)
    - Percentage used progress bar
    - Cost breakdown pie chart
    - _Requirements: 9.1, 9.2, 9.5, 9.6_

  - [ ] 24.2 Create cost trends chart
    - Line chart showing costs over last 6 months
    - Include user count overlay
    - Cost per user trend line
    - _Requirements: 9.3, 9.4_

  - [ ] 24.3 Create service breakdown section
    - Table with service name, cost, percentage
    - AWS RDS, S3, EC2/ECS, APIs, hosting, email
    - _Requirements: 9.1_

  - [ ] 24.4 Create cost projections section
    - Next month projection
    - Confidence percentage
    - Factors impacting cost
    - _Requirements: 9.7_

  - [ ] 24.5 Create cost alerts section
    - Warning alerts (>80% budget)
    - Critical alerts (>100% budget)
    - Alert history
    - _Requirements: 9.5, 9.6_

- [ ] 25. Create AuditLogPage
  - [ ] 25.1 Create audit log table
    - Columns: timestamp, admin, action type, resource, details
    - Paginated (50 per page)
    - _Requirements: 10.3_

  - [ ] 25.2 Implement filters
    - Filter by admin user
    - Filter by action type
    - Filter by date range
    - _Requirements: 10.4_

  - [ ] 25.3 Create audit log detail modal
    - Full action details
    - Before/after values (if applicable)
    - IP address and user agent
    - _Requirements: 10.2_

- [ ] 26. Create AdminManagementPage (super admin only)
  - [ ] 26.1 Create current admins section
    - List of all registered admins
    - Show email, username, last login
    - Remove admin button (except super admin)
    - Reset password button
    - _Requirements: 1.10, 1.11_

  - [ ] 26.2 Create approved emails section
    - List of approved admin emails
    - Add new email form
    - Remove email button
    - Mark as super admin checkbox
    - _Requirements: 1.11, 1.12_

  - [ ] 26.3 Create super admin settings section
    - Change super admin email form (requires password)
    - Transfer super admin privileges option
    - Security settings
    - _Requirements: 1.13, 1.14_

  - [ ] 26.4 Create admin activity log section
    - Recent admin logins
    - Failed login attempts
    - Admin actions history
    - _Requirements: 10.1, 10.2_

## Phase 8: Frontend Pages - New Features

- [ ] 27. Create ContentModerationPage
  - [ ] 27.1 Create public recipes data table
    - Paginated table with recipe title, author, creation date, status
    - Filter by status (approved, pending, flagged, hidden)
    - Search by title or author
    - Sort by date, views, favorites
    - _Requirements: 11.1, 11.2_

  - [ ] 27.2 Create recipe detail modal
    - Display full recipe details (ingredients, instructions, images)
    - Show author information
    - Display view count and favorite count
    - Show report history if flagged
    - _Requirements: 11.3_

  - [ ] 27.3 Implement moderation actions
    - Hide recipe button with reason input
    - Delete recipe button with confirmation
    - Flag for review button
    - Approve recipe button
    - Success/error notifications
    - _Requirements: 11.4, 11.5, 11.6, 11.8_

  - [ ] 27.4 Create reported content section
    - List of reported recipes
    - Report reason and reporter info
    - Quick action buttons
    - _Requirements: 11.7_

- [ ] 28. Create PointsManagementPage
  - [ ] 28.1 Create points leaderboard
    - Top 100 users by points
    - Display user name, points, level
    - Filter by time period
    - _Requirements: 12.1_

  - [ ] 28.2 Create points adjustment section
    - Search user by name or email
    - Add/subtract points form with reason
    - View adjustment history
    - _Requirements: 12.2, 12.3, 12.4_

  - [ ] 28.3 Create points configuration section
    - List of all point-earning actions
    - Edit point values
    - Create custom actions form
    - Enable/disable actions toggle
    - _Requirements: 12.5, 12.6_

  - [ ] 28.4 Create level statistics section
    - User distribution across levels chart
    - Level progression visualization
    - Average points per level
    - _Requirements: 12.7_

  - [ ] 28.5 Create bulk points award section
    - Multi-select users
    - Award bonus points form
    - Reason field for audit
    - _Requirements: 12.8_

- [ ] 29. Create CommunityActivityPage
  - [ ] 29.1 Create activity feed
    - Recent community activities list
    - Filter by type (share, achievement, milestone, contribution)
    - User information and timestamp
    - _Requirements: 13.1, 13.2_

  - [ ] 29.2 Create most active users section
    - Leaderboard of active users
    - Activity count over last 30 days
    - User profile links
    - _Requirements: 13.3_

  - [ ] 29.3 Create achievement statistics section
    - Most unlocked achievements
    - Achievement distribution chart
    - Unlock trends over time
    - _Requirements: 13.4_

  - [ ] 29.4 Create milestone tracking section
    - User progression through milestones
    - Milestone completion rates
    - _Requirements: 13.5_

  - [ ] 29.5 Create engagement trends chart
    - Line chart showing engagement over time
    - Breakdown by activity type
    - _Requirements: 13.7_

- [ ] 30. Create NotificationsManagementPage
  - [ ] 30.1 Create notification history section
    - List of all sent notifications
    - Title, recipient count, delivery date
    - Delivery status indicators
    - _Requirements: 14.1_

  - [ ] 30.2 Create broadcast notification form
    - Title and message inputs
    - Notification type selector
    - Preview function
    - Send to all users button
    - _Requirements: 14.2, 14.7_

  - [ ] 30.3 Create targeted notification form
    - User segment selector
    - Filter by account type, subscription, activity level
    - Estimated recipient count display
    - Preview and send
    - _Requirements: 14.3, 14.4_

  - [ ] 30.4 Create notification analytics section
    - Delivery rate metrics
    - Open rate metrics
    - Click rate metrics
    - Engagement trends chart
    - _Requirements: 14.5, 14.6_

- [ ] 31. Create RecipeAnalyticsPage
  - [ ] 31.1 Create popular recipes section
    - Most searched recipes list
    - Search count over time
    - Recipe details on click
    - _Requirements: 15.1_

  - [ ] 31.2 Create popular ingredients section
    - Most used ingredients list
    - Usage frequency
    - Category distribution pie chart
    - _Requirements: 15.2, 15.7_

  - [ ] 31.3 Create search trends chart
    - Recipe search trends line chart
    - Trending searches list
    - Search volume over time
    - _Requirements: 15.3_

  - [ ] 31.4 Create barcode statistics section
    - Total scans metric
    - Success rate metric
    - Failed lookups list
    - Barcode database coverage
    - _Requirements: 15.4_

  - [ ] 31.5 Create API usage breakdown section
    - Calls per API service
    - Cost per service
    - Response times
    - _Requirements: 15.6_

- [ ] 32. Create ShoppingAnalyticsPage
  - [ ] 32.1 Create common items section
    - Most added shopping list items
    - Frequency distribution chart
    - _Requirements: 16.1_

  - [ ] 32.2 Create completion metrics section
    - Shopping list completion rate
    - Average items per list
    - Completion trends chart
    - _Requirements: 16.2, 16.3_

  - [ ] 32.3 Create engagement section
    - Active users with shopping lists
    - List creation trends
    - Usage patterns
    - _Requirements: 16.4, 16.5_

- [ ] 33. Create DietaryAnalyticsPage
  - [ ] 33.1 Create dietary restrictions section
    - Most common restrictions list
    - User count per restriction
    - Distribution chart
    - _Requirements: 17.1_

  - [ ] 33.2 Create allergy distribution section
    - Allergy types and prevalence
    - Pie chart visualization
    - _Requirements: 17.2_

  - [ ] 33.3 Create filter usage section
    - Most used dietary filters
    - Filter application frequency
    - _Requirements: 17.3_

  - [ ] 33.4 Create multiple restrictions section
    - Users with multiple restrictions count
    - Average restrictions per user
    - _Requirements: 17.4_

- [ ] 34. Create DiscordManagementPage
  - [ ] 34.1 Create connection status section
    - Webhook connection indicator
    - Last check timestamp
    - Connection health status
    - _Requirements: 18.1_

  - [ ] 34.2 Create configuration section
    - Webhook URL input
    - Channel settings
    - Enable/disable toggle
    - _Requirements: 18.3, 18.6_

  - [ ] 34.3 Create test notifications section
    - Send test message form
    - View test results
    - _Requirements: 18.2_

  - [ ] 34.4 Create notification history section
    - Recent Discord notifications
    - Success/failure status
    - Message content
    - _Requirements: 18.4_

  - [ ] 34.5 Create activity logs section
    - Total notifications sent
    - Success rate
    - Error logs
    - _Requirements: 18.5_

- [ ] 35. Create APIUsagePage
  - [ ] 35.1 Create usage summary section
    - API calls per service
    - Rate limit status
    - Remaining calls
    - Reset dates
    - _Requirements: 19.1, 19.2_

  - [ ] 35.2 Create response times section
    - Average response time per service
    - P95 and P99 percentiles
    - Performance trends chart
    - _Requirements: 19.3_

  - [ ] 35.3 Create failure tracking section
    - Failure rate per service
    - Total failures
    - Error types
    - _Requirements: 19.4_

  - [ ] 35.4 Create cost analysis section
    - Cost per API call
    - Total API costs
    - Cost trends chart
    - _Requirements: 19.5_

  - [ ] 35.5 Create usage trends chart
    - API usage over time
    - Service comparison chart
    - _Requirements: 19.6_

- [ ] 36. Create BulkOperationsPage
  - [ ] 36.1 Create user selection section
    - Search and filter users
    - Multi-select checkbox
    - Selected count indicator
    - _Requirements: 20.5_

  - [ ] 36.2 Create bulk actions section
    - Suspend users action
    - Grant subscriptions action
    - Send notifications action
    - Adjust points action
    - Export data action
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [ ] 36.3 Create confirmation dialog
    - Show affected user count
    - Require reason input
    - Preview changes
    - _Requirements: 20.5_

  - [ ] 36.4 Create progress tracking section
    - Progress bar during execution
    - Success/failure count
    - Error details
    - _Requirements: 20.6, 20.7_

  - [ ] 36.5 Create operation history section
    - Recent bulk operations
    - Admin who performed
    - Results summary
    - _Requirements: 20.8_

- [ ] 37. Create FeatureFlagsPage
  - [ ] 37.1 Create feature flags list
    - All feature flags table
    - Enable/disable toggle
    - Affected user count
    - Description
    - _Requirements: 21.1, 21.2_

  - [ ] 37.2 Create user segments section
    - Create test segments form
    - Define criteria
    - View segment size
    - _Requirements: 21.3_

  - [ ] 37.3 Create adoption metrics section
    - Feature adoption rates
    - Active users per feature
    - Usage trends chart
    - _Requirements: 21.4_

  - [ ] 37.4 Create gradual rollout section
    - Percentage slider (10%, 25%, 50%, 100%)
    - Affected user preview
    - Rollout schedule
    - _Requirements: 21.5_

- [ ] 38. Create ContentManagementPage
  - [ ] 38.1 Create featured recipes section
    - Select recipes to feature
    - Reorder featured list
    - Set feature duration
    - _Requirements: 22.1_

  - [ ] 38.2 Create promotional banners section
    - Create/edit banners form
    - Set display dates
    - Active/inactive toggle
    - Preview banner
    - _Requirements: 22.2_

  - [ ] 38.3 Create announcements section
    - Create app announcements form
    - Priority levels
    - Publish/unpublish toggle
    - _Requirements: 22.3_

  - [ ] 38.4 Create legal content section
    - Edit terms of service
    - Edit privacy policy
    - Version history
    - _Requirements: 22.4, 22.5_

  - [ ] 38.5 Create FAQ management section
    - Add/edit FAQ items
    - Organize by category
    - Reorder questions
    - _Requirements: 22.6_

  - [ ] 38.6 Create content preview section
    - Preview before publishing
    - Mobile/desktop view toggle
    - _Requirements: 22.7_

- [ ] 39. Update navigation and routing
  - Add new pages to sidebar navigation
  - Organize into logical sections (Content & Moderation, Community & Engagement, Analytics, Tools)
  - Update routing configuration
  - Add icons for new menu items
  - Implement active state highlighting
  - _Requirements: All new requirements_

## Phase 9: Testing & Deployment

- [ ] 40. Write backend tests for new features
  - [ ] 40.1 Test content moderation endpoints
    - Test recipe listing with filters
    - Test recipe hiding and deletion
    - Test flagging and approval
    - Test report handling
    - _Requirements: 11.1-11.9_

  - [ ] 40.2 Test points management endpoints
    - Test points adjustment
    - Test leaderboard retrieval
    - Test custom action creation
    - Test bulk points award
    - _Requirements: 12.1-12.9_

  - [ ] 40.3 Test community activity endpoints
    - Test activity feed retrieval
    - Test active users tracking
    - Test achievement statistics
    - Test engagement metrics
    - _Requirements: 13.1-13.7_

  - [ ] 40.4 Test notifications endpoints
    - Test broadcast notifications
    - Test targeted notifications
    - Test user segmentation
    - Test notification analytics
    - _Requirements: 14.1-14.8_

  - [ ] 40.5 Test analytics endpoints
    - Test recipe analytics
    - Test shopping analytics
    - Test dietary analytics
    - Test API usage tracking
    - _Requirements: 15.1-19.7_

  - [ ] 40.6 Test bulk operations endpoints
    - Test bulk user operations
    - Test bulk subscription grants
    - Test bulk notifications
    - Test bulk points adjustments
    - _Requirements: 20.1-20.8_

  - [ ] 40.7 Test feature flags endpoints
    - Test flag enable/disable
    - Test user segmentation
    - Test adoption tracking
    - Test gradual rollout
    - _Requirements: 21.1-21.6_

  - [ ] 40.8 Test content management endpoints
    - Test featured recipes management
    - Test banner creation and updates
    - Test announcements
    - Test legal content updates
    - _Requirements: 22.1-22.8_

- [ ] 41. Write backend tests (original features)
  - [ ] 27.1 Test admin authentication
    - Test signup with approved email
    - Test signup with unapproved email
    - Test email verification
    - Test login with valid credentials
    - Test login with invalid credentials
    - Test password reset flow
    - Test JWT token validation
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ] 27.2 Test admin management (super admin)
    - Test adding approved email
    - Test removing approved email
    - Test changing super admin email
    - Test removing admin access
    - Test resetting admin password
    - _Requirements: 1.11, 1.12, 1.13_

  - [ ] 27.3 Test user management endpoints
    - Test user list with pagination
    - Test user search and filters
    - Test user detail retrieval
    - Test marking user as co-founder
    - Test suspending user
    - Test deleting user
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ] 41.4 Test subscription management endpoints
    - Test granting subscription
    - Test cancelling subscription
    - Test extending subscription
    - Test processing refund
    - _Requirements: 2.5_

  - [ ] 41.5 Test analytics endpoints
    - Test overview metrics calculation
    - Test growth data aggregation
    - Test revenue trends
    - Test feature usage stats
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 42. Write frontend tests for new features
  - [ ] 42.1 Test content moderation components
    - Test recipe table and filters
    - Test moderation actions
    - Test report handling
    - _Requirements: 11.1-11.9_

  - [ ] 42.2 Test points management components
    - Test leaderboard display
    - Test points adjustment forms
    - Test bulk award functionality
    - _Requirements: 12.1-12.9_

  - [ ] 42.3 Test community and notifications pages
    - Test activity feed
    - Test notification creation
    - Test user segmentation
    - _Requirements: 13.1-14.8_

  - [ ] 42.4 Test analytics pages
    - Test recipe analytics display
    - Test shopping analytics
    - Test dietary analytics
    - Test API usage display
    - _Requirements: 15.1-19.7_

  - [ ] 42.5 Test bulk operations and feature flags
    - Test bulk operation forms
    - Test progress tracking
    - Test feature flag toggles
    - _Requirements: 20.1-21.6_

  - [ ] 42.6 Test content management
    - Test featured recipes management
    - Test banner creation
    - Test content editing
    - _Requirements: 22.1-22.8_

- [ ] 43. Write frontend tests (original features)
  - [ ] 43.1 Test authentication components
    - Test LoginPage form submission
    - Test SignupPage validation
    - Test EmailVerificationPage token handling
    - Test password reset flow
    - _Requirements: 1.7_

  - [ ] 43.2 Test dashboard pages
    - Test OverviewPage data display
    - Test UsersPage table and filters
    - Test SubscriptionsPage management
    - Test FeedbackPage filtering
    - Test ErrorsPage display
    - _Requirements: 2.1, 3.1, 4.1, 5.1_

  - [ ] 43.3 Test admin management (super admin)
    - Test approved emails management
    - Test admin removal
    - Test super admin email change
    - _Requirements: 1.11, 1.12, 1.13_

- [ ] 44. Deploy admin dashboard
  - [ ] 44.1 Prepare backend for deployment
    - Run database migrations for admin tables
    - Run migrations for new features (content moderation, points, notifications, etc.)
    - Set environment variables (JWT_SECRET, ADMIN_JWT_SECRET)
    - Test all admin endpoints
    - _Requirements: 1.2, 11.1-22.8_

  - [ ] 44.2 Build and deploy frontend
    - Build React app for production
    - Deploy to Vercel/Netlify
    - Configure environment variables (API_URL)
    - Set up custom domain (optional)
    - Test deployed application
    - _Requirements: 8.1, 8.2_

  - [ ] 44.3 Security hardening
    - Enable HTTPS
    - Configure CORS properly
    - Set up rate limiting
    - Enable CSRF protection
    - Test security measures
    - _Requirements: 10.6, 10.7_

- [ ] 45. Documentation and handoff
  - Create comprehensive admin dashboard user guide
  - Document all API endpoints (original + new features)
  - Document complete database schema
  - Create troubleshooting guide
  - Document deployment process
  - Create video walkthrough for super admin features
  - Document new features (content moderation, points, notifications, etc.)
  - Create quick reference guide for common tasks
  - _Requirements: All_
