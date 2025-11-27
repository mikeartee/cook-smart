# Admin Dashboard Requirements Document

## Introduction

The Admin Dashboard is a standalone web-based administrative interface for Cook Smart that provides comprehensive visibility into application health, user management, analytics, and system monitoring. This is a separate professional website (not part of the main Cook Smart mobile app) designed specifically for administrators to monitor the application, manage users, review feedback, track errors, and make data-driven decisions about the platform's growth and performance.

The dashboard is built as a modern React web application with a thoughtful, organized, and professional design using Material-UI components. It connects to the Cook Smart backend via REST APIs and provides a comprehensive suite of administrative tools.

## Glossary

- **Admin Dashboard**: The web-based administrative interface for Cook Smart
- **Admin User**: An authenticated user with administrative privileges
- **Dashboard System**: The complete admin dashboard application including frontend and backend
- **User Management Module**: The section of the dashboard for viewing and managing user accounts
- **Analytics Module**: The section displaying metrics, charts, and statistics
- **Feedback Module**: The section for viewing and managing user feedback
- **Error Monitoring Module**: The section for viewing application errors and system health
- **Authentication Service**: The backend service that validates admin credentials
- **Metrics Service**: The backend service that aggregates and provides analytics data
- **Real-time Updates**: Live data updates without page refresh
- **Content Moderation Module**: The section for reviewing and managing user-generated content
- **Points System**: The gamification system that rewards users for actions
- **Community Activity**: User interactions including shares, achievements, and milestones
- **Broadcast Notification**: A notification sent to all users or a specific user segment
- **Feature Flag**: A toggle that enables or disables specific features for testing or gradual rollout
- **Bulk Operation**: An action performed on multiple records simultaneously

## Requirements

### Requirement 1: Admin Authentication and Authorization

**User Story:** As an administrator, I want secure access to the admin dashboard with email verification, so that only pre-approved personnel can access sensitive application data.

#### Acceptance Criteria

1. THE Dashboard System SHALL maintain an approved admin emails list stored in the database
2. THE Dashboard System SHALL initialize with tootallgames2020@gmail.com as the super admin email
3. WHEN a new admin attempts to sign up, THE Dashboard System SHALL require email, username, and password
4. THE Dashboard System SHALL verify the email against the approved admin emails list before allowing registration
5. IF the email is not in the approved list, THEN THE Dashboard System SHALL deny registration with message "Email not authorized for admin access"
6. WHEN an approved admin completes registration, THE Dashboard System SHALL create an admin account and send a verification email
7. WHEN a registered admin logs in, THE Dashboard System SHALL require only username and password
8. THE Dashboard System SHALL create a secure JWT session token valid for 8 hours
9. THE Dashboard System SHALL automatically log out admin users after 8 hours of inactivity
10. THE Dashboard System SHALL provide a super admin-only section to manage approved admin emails
11. WHEN the super admin (tootallgames2020@gmail.com) accesses admin management, THE Dashboard System SHALL allow adding new admin emails to the approved list
12. WHEN the super admin (tootallgames2020@gmail.com) accesses admin management, THE Dashboard System SHALL allow removing admin emails from the approved list
13. THE Dashboard System SHALL allow the super admin to change their own email address in the approved list
14. WHEN the super admin changes their email, THE Dashboard System SHALL update the super admin flag to the new email

### Requirement 2: User Management Interface

**User Story:** As an administrator, I want to view and manage all user accounts, so that I can support users, handle issues, and maintain platform quality.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a paginated table of all users with columns for name, email, account type, join date, and status
2. THE Dashboard System SHALL provide search functionality that filters users by name or email within 500 milliseconds
3. THE Dashboard System SHALL provide filter options for account type (co-founder, premium, free) and account status (active, suspended)
4. WHEN an admin clicks on a user row, THE Dashboard System SHALL display a detailed user profile with account information, subscription status, activity history, ingredient count, and saved recipe count
5. THE Dashboard System SHALL provide an action to mark a user as co-founder, which updates the is_co_founder flag in the database
6. THE Dashboard System SHALL provide an action to suspend a user account, which prevents the user from logging in
7. THE Dashboard System SHALL provide an action to delete a user account with a confirmation dialog requiring the admin to type "DELETE" to proceed
8. THE Dashboard System SHALL load user data in pages of 50 users to maintain performance

### Requirement 3: Analytics Dashboard

**User Story:** As an administrator, I want to view key metrics and analytics, so that I can understand user behavior, track growth, and make informed business decisions.

#### Acceptance Criteria

1. THE Dashboard System SHALL display total user count with breakdown by account type (all time, this month, today)
2. THE Dashboard System SHALL display active user metrics including Daily Active Users (DAU) and Monthly Active Users (MAU)
3. THE Dashboard System SHALL display premium subscriber count and conversion rate from free to premium
4. THE Dashboard System SHALL display revenue metrics including Monthly Recurring Revenue (MRR) and total revenue
5. THE Dashboard System SHALL display feature usage statistics including total ingredients added, recipes searched, and recipes saved
6. THE Dashboard System SHALL display line charts showing user growth over the last 30 days
7. THE Dashboard System SHALL display bar charts showing feature usage trends over the last 30 days
8. THE Dashboard System SHALL refresh analytics data every 5 minutes automatically

### Requirement 4: Feedback Management

**User Story:** As an administrator, I want to view and manage user feedback, so that I can address issues, prioritize features, and improve the application based on user input.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a paginated list of all feedback submissions with user name, rating, category, date, and status
2. THE Dashboard System SHALL provide filter options for feedback category (Bug, Feature Request, General) and rating (1-5 stars)
3. THE Dashboard System SHALL provide filter options for feedback status (New, In Progress, Resolved, Ignored)
4. WHEN an admin clicks on a feedback item, THE Dashboard System SHALL display the full feedback details including user information and message
5. THE Dashboard System SHALL allow admins to update feedback status with a dropdown menu
6. THE Dashboard System SHALL allow admins to add internal notes to feedback items
7. THE Dashboard System SHALL provide an export function that downloads feedback data as CSV format
8. THE Dashboard System SHALL display feedback statistics including average rating and category distribution

### Requirement 5: Error Monitoring and System Health

**User Story:** As an administrator, I want to monitor application errors and system health, so that I can quickly identify and resolve issues before they impact users.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of recent errors with timestamp, severity, error message, and affected user count
2. THE Dashboard System SHALL provide filter options for error severity (Critical, High, Medium, Low)
3. THE Dashboard System SHALL display error frequency charts showing error trends over the last 7 days
4. WHEN an admin clicks on an error, THE Dashboard System SHALL display full error details including stack trace and context
5. THE Dashboard System SHALL display system health indicators including database status, API status, and server metrics
6. THE Dashboard System SHALL display uptime percentage for the last 30 days
7. THE Dashboard System SHALL display auto-repair history showing successful and failed repair attempts
8. THE Dashboard System SHALL highlight critical errors with red indicators and send browser notifications for new critical errors

### Requirement 6: Recipe Cache Management

**User Story:** As an administrator, I want to monitor and manage the recipe cache, so that I can optimize API usage, reduce costs, and ensure cache efficiency.

#### Acceptance Criteria

1. THE Dashboard System SHALL display cache statistics including total cached recipes, cache hit rate, and API calls saved
2. THE Dashboard System SHALL display storage usage for the recipe cache in megabytes
3. THE Dashboard System SHALL display a list of the top 20 most accessed recipes with access counts
4. THE Dashboard System SHALL provide an action to clear expired cache entries with a confirmation dialog
5. THE Dashboard System SHALL provide an emergency action to clear all cache with a confirmation dialog requiring admin password
6. WHEN cache is cleared, THE Dashboard System SHALL display a success message with the number of entries removed
7. THE Dashboard System SHALL display cache performance metrics including average lookup time and cache efficiency percentage

### Requirement 7: Real-time Updates and Notifications

**User Story:** As an administrator, I want real-time updates on critical events, so that I can respond quickly to issues without constantly refreshing the page.

#### Acceptance Criteria

1. THE Dashboard System SHALL automatically refresh analytics data every 5 minutes without requiring page reload
2. WHEN a new critical error occurs, THE Dashboard System SHALL display a browser notification to the admin
3. WHEN new feedback is submitted, THE Dashboard System SHALL update the feedback count badge in real-time
4. THE Dashboard System SHALL display a connection status indicator showing whether real-time updates are active
5. IF the connection to the backend is lost, THEN THE Dashboard System SHALL display a warning message and attempt to reconnect every 30 seconds

### Requirement 8: Responsive Design and Performance

**User Story:** As an administrator, I want the dashboard to be fast and accessible on different devices, so that I can monitor the application from anywhere.

#### Acceptance Criteria

1. THE Dashboard System SHALL load the initial dashboard view within 2 seconds on a standard broadband connection
2. THE Dashboard System SHALL be responsive and functional on desktop screens with minimum width of 1024 pixels
3. THE Dashboard System SHALL be responsive and functional on tablet screens with minimum width of 768 pixels
4. THE Dashboard System SHALL use lazy loading for large data tables to maintain performance
5. THE Dashboard System SHALL cache static assets for 24 hours to reduce load times
6. THE Dashboard System SHALL display loading indicators for all asynchronous operations that take longer than 500 milliseconds

### Requirement 9: Cost Monitoring and Budget Tracking

**User Story:** As an administrator, I want to monitor service costs and budget usage, so that I can stay within the $20/month emergency budget and plan for scaling.

#### Acceptance Criteria

1. THE Dashboard System SHALL display current month costs with breakdown by service (AWS, APIs, etc.)
2. THE Dashboard System SHALL display remaining budget from the $20/month emergency allocation
3. THE Dashboard System SHALL display cost trends over the last 6 months with a line chart
4. THE Dashboard System SHALL display cost per user metric to understand unit economics
5. WHEN costs exceed 80% of the monthly budget, THE Dashboard System SHALL display a warning indicator
6. WHEN costs exceed 100% of the monthly budget, THE Dashboard System SHALL display a critical alert
7. THE Dashboard System SHALL provide cost projections for the next month based on current usage trends

### Requirement 10: Security and Audit Logging

**User Story:** As an administrator, I want all admin actions to be logged, so that there is accountability and a record of changes made to the system.

#### Acceptance Criteria

1. THE Dashboard System SHALL log all admin actions including user management, status changes, and cache operations
2. THE Dashboard System SHALL store audit logs with timestamp, admin user, action type, and affected resource
3. THE Dashboard System SHALL display an audit log viewer showing the last 100 admin actions
4. THE Dashboard System SHALL provide filter options for audit logs by admin user, action type, and date range
5. THE Dashboard System SHALL retain audit logs for 90 days before automatic deletion
6. THE Dashboard System SHALL use HTTPS for all communications between frontend and backend
7. THE Dashboard System SHALL implement CSRF protection for all state-changing operations

### Requirement 11: User-Generated Content Moderation

**User Story:** As an administrator, I want to review and moderate user-generated recipes, so that I can maintain content quality and remove inappropriate material.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a paginated list of all public user recipes with title, author, creation date, and status
2. THE Dashboard System SHALL provide filter options for recipe status (approved, pending, flagged, hidden)
3. WHEN an admin clicks on a recipe, THE Dashboard System SHALL display full recipe details including ingredients, instructions, and images
4. THE Dashboard System SHALL provide an action to hide a recipe from public view with a reason field
5. THE Dashboard System SHALL provide an action to delete a recipe with a confirmation dialog
6. THE Dashboard System SHALL provide an action to flag a recipe for review
7. THE Dashboard System SHALL display a list of reported recipes with report reason and reporter information
8. THE Dashboard System SHALL allow admins to approve flagged recipes or take action
9. THE Dashboard System SHALL track moderation actions in the audit log

### Requirement 12: Points and Gamification Management

**User Story:** As an administrator, I want to manage the points system and gamification features, so that I can reward users appropriately and adjust the system as needed.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a points leaderboard showing top 100 users by total points
2. THE Dashboard System SHALL provide an action to manually add points to a user account with a reason field
3. THE Dashboard System SHALL provide an action to manually subtract points from a user account with a reason field
4. THE Dashboard System SHALL display a user's complete points transaction history with action type and timestamp
5. THE Dashboard System SHALL allow admins to modify point values for existing actions
6. THE Dashboard System SHALL allow admins to create custom point-earning actions with name, description, and point value
7. THE Dashboard System SHALL display level progression statistics showing user distribution across levels
8. THE Dashboard System SHALL provide an action to award bonus points to multiple users for events or promotions
9. THE Dashboard System SHALL track all points adjustments in the audit log

### Requirement 13: Community Activity Monitoring

**User Story:** As an administrator, I want to monitor community activities and engagement, so that I can understand user behavior and identify highly engaged users.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a feed of recent community activities including recipe shares, achievements, and milestones
2. THE Dashboard System SHALL provide filter options for activity type (share, achievement, milestone, contribution)
3. THE Dashboard System SHALL display a list of most active users with activity count over the last 30 days
4. THE Dashboard System SHALL display achievement unlock statistics showing most common achievements
5. THE Dashboard System SHALL display milestone tracking showing user progression
6. THE Dashboard System SHALL display contribution impact metrics showing community contributions
7. THE Dashboard System SHALL display community engagement trends over time with a line chart

### Requirement 14: Notifications Management

**User Story:** As an administrator, I want to create and manage system notifications, so that I can communicate important information to users.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of all sent notifications with title, recipient count, and delivery date
2. THE Dashboard System SHALL provide an action to create a broadcast notification to all users
3. THE Dashboard System SHALL provide an action to create a targeted notification to a specific user segment
4. THE Dashboard System SHALL allow admins to select user segments by account type, subscription status, or activity level
5. THE Dashboard System SHALL display notification delivery status showing sent, delivered, and opened counts
6. THE Dashboard System SHALL display notification engagement metrics including open rate and click rate
7. THE Dashboard System SHALL provide a preview function to test notifications before sending
8. THE Dashboard System SHALL track notification sends in the audit log

### Requirement 15: Recipe and Ingredient Analytics

**User Story:** As an administrator, I want to view analytics about recipes and ingredients, so that I can understand user preferences and improve the recipe database.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of most searched recipes with search count over the last 30 days
2. THE Dashboard System SHALL display a list of most popular ingredients with usage count
3. THE Dashboard System SHALL display recipe search trends over time with a line chart
4. THE Dashboard System SHALL display barcode scan statistics including total scans and success rate
5. THE Dashboard System SHALL display a list of failed barcode lookups with barcode number and frequency
6. THE Dashboard System SHALL display recipe API usage breakdown showing calls per API service
7. THE Dashboard System SHALL display ingredient category distribution with a pie chart

### Requirement 16: Shopping List Analytics

**User Story:** As an administrator, I want to view shopping list analytics, so that I can understand how users utilize the shopping feature.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of most common shopping list items with frequency count
2. THE Dashboard System SHALL display shopping list completion rate as a percentage
3. THE Dashboard System SHALL display average items per shopping list metric
4. THE Dashboard System SHALL display shopping list creation trends over time with a line chart
5. THE Dashboard System SHALL display shopping list engagement metrics including active users with shopping lists

### Requirement 17: Dietary Restrictions Analytics

**User Story:** As an administrator, I want to view dietary restriction analytics, so that I can understand user dietary needs and improve filtering.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of most common dietary restrictions with user count
2. THE Dashboard System SHALL display allergy distribution among users with a pie chart
3. THE Dashboard System SHALL display dietary filter usage statistics showing filter application frequency
4. THE Dashboard System SHALL display users with multiple dietary restrictions count

### Requirement 18: Discord Integration Management

**User Story:** As an administrator, I want to manage Discord integration settings, so that I can monitor and configure Discord notifications.

#### Acceptance Criteria

1. THE Dashboard System SHALL display Discord webhook connection status
2. THE Dashboard System SHALL provide an action to test Discord notifications with a sample message
3. THE Dashboard System SHALL allow admins to configure Discord channel settings
4. THE Dashboard System SHALL display Discord notification history with timestamp and message content
5. THE Dashboard System SHALL display Discord bot activity logs showing successful and failed notifications
6. THE Dashboard System SHALL provide an action to enable or disable Discord notifications

### Requirement 19: API Usage and Rate Limiting

**User Story:** As an administrator, I want to monitor API usage and rate limits, so that I can optimize API calls and avoid service disruptions.

#### Acceptance Criteria

1. THE Dashboard System SHALL display total API calls per service (Open Food Facts, TheMealDB, Edamam) for the current month
2. THE Dashboard System SHALL display rate limit status for each API service showing remaining calls
3. THE Dashboard System SHALL display average API response times per service
4. THE Dashboard System SHALL display API failure rate per service as a percentage
5. THE Dashboard System SHALL display cost per API call for paid services
6. THE Dashboard System SHALL display API usage trends over time with a line chart
7. WHEN an API approaches its rate limit, THE Dashboard System SHALL display a warning indicator

### Requirement 20: Bulk Operations

**User Story:** As an administrator, I want to perform bulk operations on multiple records, so that I can efficiently manage large datasets.

#### Acceptance Criteria

1. THE Dashboard System SHALL provide an action to suspend multiple user accounts simultaneously with a reason field
2. THE Dashboard System SHALL provide an action to grant subscriptions to multiple users simultaneously
3. THE Dashboard System SHALL provide an action to send email notifications to multiple users simultaneously
4. THE Dashboard System SHALL provide an action to adjust points for multiple users simultaneously
5. THE Dashboard System SHALL display a confirmation dialog showing the number of affected records before executing bulk operations
6. THE Dashboard System SHALL display progress indicators during bulk operation execution
7. THE Dashboard System SHALL display a summary report after bulk operation completion showing success and failure counts
8. THE Dashboard System SHALL track all bulk operations in the audit log

### Requirement 21: Feature Flags and A/B Testing

**User Story:** As an administrator, I want to manage feature flags and A/B tests, so that I can safely roll out new features and test variations.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a list of all feature flags with name, status, and affected user count
2. THE Dashboard System SHALL provide an action to enable or disable a feature flag
3. THE Dashboard System SHALL allow admins to create user segments for A/B testing based on account type or registration date
4. THE Dashboard System SHALL display feature adoption rates showing percentage of users using enabled features
5. THE Dashboard System SHALL allow admins to gradually roll out features by percentage (10%, 25%, 50%, 100%)
6. THE Dashboard System SHALL track feature flag changes in the audit log

### Requirement 22: Content Management

**User Story:** As an administrator, I want to manage app content and announcements, so that I can keep users informed and promote features.

#### Acceptance Criteria

1. THE Dashboard System SHALL allow admins to create and edit featured recipe collections
2. THE Dashboard System SHALL allow admins to create promotional banners with title, message, and display duration
3. THE Dashboard System SHALL allow admins to create app announcements visible to all users
4. THE Dashboard System SHALL allow admins to update terms of service content
5. THE Dashboard System SHALL allow admins to update privacy policy content
6. THE Dashboard System SHALL allow admins to manage FAQ content with questions and answers
7. THE Dashboard System SHALL provide a preview function for all content before publishing
8. THE Dashboard System SHALL track content changes in the audit log
