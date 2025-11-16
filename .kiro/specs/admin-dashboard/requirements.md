# Admin Dashboard Requirements Document

## Introduction

The Admin Dashboard is a web-based administrative interface for Cook Smart that provides comprehensive visibility into application health, user management, analytics, and system monitoring. The dashboard enables administrators to monitor the application, manage users, review feedback, track errors, and make data-driven decisions about the platform's growth and performance.

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
