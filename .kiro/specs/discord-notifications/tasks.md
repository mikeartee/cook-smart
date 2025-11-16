# Discord Notifications System - Implementation Tasks

## Task Execution Instructions

- Execute tasks in sequential order (dependencies are built in)
- Test each component before moving to the next task
- Mark task complete only after successful testing
- Focus on MINIMAL implementations - avoid over-engineering
- Each task builds on previous tasks - do not skip ahead

---

## 1. Discord Server Setup

Set up Discord server and webhook URLs for the notification system.

- [ ] 1.1 Create Discord server and channels
  - Create new Discord server named "Cook Smart Monitoring"
  - Create #errors channel for error notifications
  - Create #feedback channel for user feedback
  - Create #activity channel for user activity
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 1.2 Generate webhook URLs
  - Go to each channel settings → Integrations → Webhooks
  - Create webhook for #errors channel
  - Create webhook for #feedback channel
  - Create webhook for #activity channel
  - Copy webhook URLs for environment configuration
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 1.3 Test webhook URLs
  - Use curl or Postman to send test message to each webhook
  - Verify messages appear in correct Discord channels
  - Verify embed formatting works correctly
  - _Requirements: 4.4, 5.1_

---

## 2. Backend Core Services

Build the core notification services and utilities.

- [ ] 2.1 Create NotificationService
  - Create `backend/src/services/NotificationService.ts`
  - Implement `sendErrorNotification()` method
  - Implement `sendFeedbackNotification()` method
  - Implement `sendActivityNotification()` method
  - Implement `sendHealthSummary()` method
  - Add private methods for embed formatting
  - Add private method for sending to webhook with retry logic
  - Handle webhook failures gracefully (log but don't throw)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2.2 Create ThrottleManager
  - Create `backend/src/services/ThrottleManager.ts`
  - Implement `shouldSendNotification()` method
  - Implement `recordNotification()` method
  - Implement `getThrottledCount()` method
  - Implement `sendThrottledSummary()` method
  - Use in-memory Map for throttle tracking
  - Implement cleanup job to clear old entries every hour
  - _Requirements: 1.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.3 Create AutoRepairSystem
  - Create `backend/src/services/AutoRepairSystem.ts`
  - Define `AutoRepairStrategy` interface
  - Implement `DatabaseConnectionRepair` strategy
  - Implement `attemptRepair()` method that tries all strategies
  - Send repair status notification after attempt
  - _Requirements: 1.3, 1.4_

- [ ] 2.4 Add environment variables
  - Add `DISCORD_ERROR_WEBHOOK` to `.env`
  - Add `DISCORD_FEEDBACK_WEBHOOK` to `.env`
  - Add `DISCORD_ACTIVITY_WEBHOOK` to `.env`
  - Add validation for webhook URLs on server startup
  - Log warning if webhooks not configured
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

---

## 3. Error Monitoring

Implement error catching and notification system.

- [ ] 3.1 Create ErrorMiddleware
  - Create `backend/src/middleware/errorMiddleware.ts`
  - Implement error handler that catches all route errors
  - Classify error severity based on error type and status code
  - Extract context (user ID, endpoint, request info)
  - Call NotificationService.sendErrorNotification()
  - Return appropriate error response to client
  - Never expose internal error details to client
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3.2 Add ErrorMiddleware to Express app
  - Import errorMiddleware in `backend/src/server.ts`
  - Add as last middleware (after all routes)
  - Test that errors are caught and notifications sent
  - _Requirements: 1.1, 6.1_

- [ ] 3.3 Integrate ThrottleManager with error notifications
  - Check throttle before sending error notification
  - Record notification after sending
  - Send throttled summary every 5 minutes
  - Never throttle Critical severity errors
  - _Requirements: 1.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 3.4 Integrate AutoRepairSystem with error notifications
  - Attempt auto-repair for common errors
  - Send repair status notification
  - Update error notification with repair result
  - _Requirements: 1.3, 1.4_

---

## 4. Database Models

Create database tables for feedback and notification logs.

- [ ] 4.1 Create feedback table migration
  - Create `backend/src/migrations/create_feedback_table.sql`
  - Define feedback table schema with all fields
  - Add indexes for user_id, status, created_at
  - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 4.2 Create notification_logs table migration
  - Create `backend/src/migrations/create_notification_logs_table.sql`
  - Define notification_logs table schema
  - Add indexes for type, sent_at
  - Add function to auto-delete logs older than 30 days
  - _Requirements: 10.4_

- [ ] 4.3 Create Feedback model
  - Create `backend/src/models/Feedback.ts`
  - Implement `create()` method
  - Implement `findByUserId()` method
  - Implement `findByStatus()` method
  - Implement `updateStatus()` method
  - _Requirements: 2.4, 7.1, 7.2, 7.3_

- [ ] 4.4 Create NotificationLog model
  - Create `backend/src/models/NotificationLog.ts`
  - Implement `create()` method
  - Implement `findRecent()` method
  - Implement `getStats()` method
  - _Requirements: 10.4_

- [ ] 4.5 Run database migrations
  - Execute feedback table migration
  - Execute notification_logs table migration
  - Verify tables created successfully
  - Test model methods
  - _Requirements: 2.4, 10.4_

---

## 5. Feedback System

Implement user feedback collection and notification.

- [ ] 5.1 Create FeedbackController
  - Create `backend/src/controllers/FeedbackController.ts`
  - Implement POST handler for feedback submission
  - Validate request body (rating, category, message)
  - Store feedback in database using Feedback model
  - Send notification to Discord asynchronously
  - Return success response immediately
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5.2 Create feedback routes
  - Create `backend/src/routes/feedback.ts`
  - Add POST /api/v1/feedback route
  - Add authentication middleware
  - Connect to FeedbackController
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 5.3 Add feedback routes to Express app
  - Import feedback routes in `backend/src/server.ts`
  - Mount at /api/v1/feedback
  - Test feedback submission with Postman
  - Verify Discord notification sent
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## 6. Activity Tracking

Implement user activity tracking and notifications.

- [ ] 6.1 Create ActivityTracker service
  - Create `backend/src/services/ActivityTracker.ts`
  - Implement `trackSignup()` method
  - Implement `trackPurchase()` method
  - Implement `trackReferral()` method
  - Send notifications asynchronously (don't block main flow)
  - Handle notification failures gracefully
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 6.2 Integrate with user registration
  - Import ActivityTracker in `backend/src/routes/authRoutes.ts`
  - Call `trackSignup()` after successful registration
  - Pass user info and referral code if applicable
  - Test signup notification
  - _Requirements: 3.1, 3.4_

- [ ] 6.3 Integrate with purchase system (placeholder)
  - Add TODO comment for purchase tracking integration
  - Document where to call `trackPurchase()` when payment system added
  - _Requirements: 3.2, 3.5_

- [ ] 6.4 Integrate with referral system (placeholder)
  - Add TODO comment for referral tracking integration
  - Document where to call `trackReferral()` when referral system added
  - _Requirements: 3.3, 3.5_

---

## 7. Frontend Feedback Form

Create in-app feedback form for users.

- [ ] 7.1 Create FeedbackModal component
  - Create `src/components/FeedbackModal.tsx`
  - Add text input for feedback message
  - Add optional rating selector (1-5 stars)
  - Add optional category selector (Bug, Feature, General)
  - Add Submit and Cancel buttons
  - Validate that message is not empty
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7.2 Create feedback service
  - Create `src/services/feedbackService.ts`
  - Implement `submitFeedback()` method calling POST /api/v1/feedback
  - Add JWT token to Authorization header
  - Handle errors with user-friendly messages
  - _Requirements: 7.4, 7.5_

- [ ] 7.3 Add feedback button to settings/menu
  - Add "Send Feedback" button to app settings or menu
  - Open FeedbackModal when button tapped
  - _Requirements: 7.1, 7.2_

- [ ] 7.4 Implement feedback submission
  - Connect FeedbackModal to feedbackService
  - Show loading indicator during submission
  - Show success message after submission
  - Close modal on success
  - Show error message on failure
  - _Requirements: 7.4, 7.5_

- [ ] 7.5 Test feedback flow end-to-end
  - Open app and navigate to feedback
  - Fill out feedback form
  - Submit feedback
  - Verify success message shown
  - Verify Discord notification received
  - Verify feedback stored in database
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

---

## 8. Health Monitoring

Implement system health monitoring and daily summaries.

- [ ] 8.1 Create HealthMonitor service
  - Create `backend/src/services/HealthMonitor.ts`
  - Implement `getHealthStats()` method
  - Collect error count, error rate, uptime
  - Check database connection status
  - Check external API status (TheMealDB, Edamam)
  - Get API usage statistics
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.2 Implement daily health summary
  - Add cron job to send health summary at midnight UTC
  - Use node-cron or similar library
  - Call HealthMonitor.getHealthStats()
  - Send summary via NotificationService.sendHealthSummary()
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 8.3 Implement recovery notifications
  - Track system error state
  - When error rate drops below threshold, send recovery notification
  - Include time to recovery and actions taken
  - _Requirements: 9.3_

- [ ] 8.4 Implement high error rate alerts
  - Monitor error rate in real-time
  - When error rate exceeds 5%, send alert notification
  - Include affected endpoints and error types
  - _Requirements: 9.5_

---

## 9. Testing

Test all notification types and edge cases.

- [ ] 9.1 Write unit tests for NotificationService
  - Test embed formatting for each notification type
  - Test webhook URL validation
  - Test retry logic
  - Test failure handling
  - _Requirements: All_

- [ ] 9.2 Write unit tests for ThrottleManager
  - Test throttling rules for each notification type
  - Test throttled summary generation
  - Test memory cleanup
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.3 Write unit tests for ErrorMiddleware
  - Test severity classification
  - Test context extraction
  - Test error response formatting
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9.4 Test error notifications end-to-end
  - Trigger various error types in the app
  - Verify Discord notifications sent with correct severity
  - Verify throttling works correctly
  - Verify auto-repair attempts made
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 9.5 Test feedback notifications end-to-end
  - Submit feedback through app
  - Verify Discord notification sent
  - Verify feedback stored in database
  - Verify all fields included in notification
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 9.6 Test activity notifications end-to-end
  - Register new user
  - Verify signup notification sent
  - Verify referral code included if applicable
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9.7 Test health monitoring
  - Wait for daily health summary (or trigger manually)
  - Verify summary includes all stats
  - Trigger high error rate
  - Verify alert notification sent
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## 10. Documentation and Deployment

Document the system and prepare for deployment.

- [ ] 10.1 Create setup documentation
  - Document Discord server setup process
  - Document webhook URL generation
  - Document environment variable configuration
  - Document testing procedures
  - _Requirements: All_

- [ ] 10.2 Create monitoring guide
  - Document how to interpret notifications
  - Document severity levels and response procedures
  - Document throttling behavior
  - Document auto-repair strategies
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10.3 Update deployment checklist
  - Add Discord setup steps
  - Add environment variable configuration
  - Add database migration steps
  - Add testing verification steps
  - _Requirements: All_

- [ ] 10.4 Deploy to production
  - Set up Discord server and webhooks
  - Add webhook URLs to production environment
  - Run database migrations
  - Deploy backend code
  - Deploy frontend code
  - Test all notification types in production
  - _Requirements: All_

---

## 11. Final Verification

Verify all requirements met and system working correctly.

- [ ] 11.1 Verify error monitoring
  - Trigger test errors in production
  - Verify notifications sent to Discord
  - Verify severity classification correct
  - Verify throttling works
  - Verify auto-repair attempts made
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 11.2 Verify feedback system
  - Submit test feedback through app
  - Verify notification sent to Discord
  - Verify feedback stored in database
  - Verify all fields included
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 11.3 Verify activity tracking
  - Register test user
  - Verify signup notification sent
  - Verify all user info included
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11.4 Verify health monitoring
  - Wait for daily health summary
  - Verify all stats included
  - Verify format is readable
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 11.5 Verify cost compliance
  - Monitor notification volume for 1 week
  - Verify no additional costs incurred
  - Verify database storage within budget
  - Verify network bandwidth within budget
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11.6 Run verification scan
  - Execute `node .kiro/verify-and-scan.js`
  - Fix any TypeScript errors
  - Fix any ESLint errors
  - Verify zero errors
  - _Requirements: All_

---

## Success Criteria

✅ **Discord Notifications System is complete when:**

1. Error notifications sent to Discord in real-time
2. Feedback form accessible in app
3. Feedback notifications sent to Discord
4. User signup notifications sent to Discord
5. Daily health summaries sent to Discord
6. Throttling prevents notification spam
7. Auto-repair attempts made for common errors
8. All notifications well-formatted and readable
9. System operates within $20/month budget
10. Zero TypeScript/ESLint errors
11. All tests passing
12. Documentation complete

---

## Notes

- All tasks including unit tests are required for comprehensive implementation
- Test each component before moving to next
- Monitor Discord channels during testing
- Adjust throttling thresholds based on actual usage
- Add more auto-repair strategies as needed
