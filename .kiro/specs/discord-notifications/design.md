# Discord Notifications System - Design

## Overview

The Discord Notifications System is a lightweight monitoring and communication solution that leverages Discord webhooks to provide real-time visibility into application health, user feedback, and business metrics. The system integrates seamlessly with the existing Cook Smart backend without requiring additional infrastructure or services.

### Key Design Principles

1. **Zero Additional Cost**: Uses free Discord webhooks
2. **Non-Blocking**: Notifications never block user-facing operations
3. **Fail-Safe**: Notification failures don't affect app functionality
4. **Scalable**: Handles increasing notification volume through throttling
5. **Actionable**: Provides clear, formatted information for quick decision-making

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Cook Smart Backend                       │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────┐  │
│  │   Express    │─────▶│ Notification │─────▶│ Discord  │  │
│  │   Routes     │      │   Service    │      │ Webhooks │  │
│  └──────────────┘      └──────────────┘      └──────────┘  │
│         │                      │                            │
│         │                      │                            │
│  ┌──────▼──────┐      ┌───────▼────────┐                   │
│  │   Error     │      │   Throttle     │                   │
│  │  Middleware │      │    Manager     │                   │
│  └─────────────┘      └────────────────┘                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Discord Server  │
                    │                  │
                    │  ┌────────────┐  │
                    │  │   Error    │  │
                    │  │  Channel   │  │
                    │  └────────────┘  │
                    │  ┌────────────┐  │
                    │  │  Feedback  │  │
                    │  │  Channel   │  │
                    │  └────────────┘  │
                    │  ┌────────────┐  │
                    │  │  Activity  │  │
                    │  │  Channel   │  │
                    │  └────────────┘  │
                    └──────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   NotificationService                        │
├─────────────────────────────────────────────────────────────┤
│  + sendErrorNotification(error, severity, context)          │
│  + sendFeedbackNotification(feedback)                       │
│  + sendActivityNotification(type, data)                     │
│  + sendHealthSummary()                                      │
│  - formatErrorEmbed(error, severity)                        │
│  - formatFeedbackEmbed(feedback)                            │
│  - formatActivityEmbed(type, data)                          │
│  - sendToWebhook(webhookUrl, embed)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ uses
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ThrottleManager                            │
├─────────────────────────────────────────────────────────────┤
│  + shouldSendNotification(key, type): boolean               │
│  + recordNotification(key, type)                            │
│  + getThrottledCount(key): number                           │
│  + sendThrottledSummary()                                   │
│  - throttleMap: Map<string, ThrottleEntry>                  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. NotificationService

**Purpose**: Central service for sending all Discord notifications

**Interface**:
```typescript
interface NotificationService {
  // Error notifications
  sendErrorNotification(
    error: Error,
    severity: 'critical' | 'high' | 'medium' | 'low',
    context?: {
      userId?: string;
      endpoint?: string;
      affectedUsers?: number;
    }
  ): Promise<void>;

  // Feedback notifications
  sendFeedbackNotification(feedback: {
    userId: string;
    userName: string;
    userEmail: string;
    rating?: number;
    category?: string;
    message: string;
    screenshot?: string;
    timestamp: Date;
  }): Promise<void>;

  // Activity notifications
  sendActivityNotification(
    type: 'signup' | 'purchase' | 'referral',
    data: ActivityData
  ): Promise<void>;

  // Health monitoring
  sendHealthSummary(stats: HealthStats): Promise<void>;
}

interface ActivityData {
  signup?: {
    userName: string;
    userEmail: string;
    referredBy?: string;
    referralCode?: string;
  };
  purchase?: {
    userName: string;
    userEmail: string;
    plan: string;
    amount: number;
  };
  referral?: {
    referrerName: string;
    referrerEmail: string;
    refereeName: string;
    refereeEmail: string;
    referralCode: string;
  };
}

interface HealthStats {
  totalErrors: number;
  errorRate: number;
  uptime: number;
  apiUsage: {
    edamam: number;
    themealdb: number;
  };
  databaseStatus: 'healthy' | 'degraded' | 'down';
}
```

**Implementation Details**:
- Uses `node-fetch` or `axios` to send HTTP POST requests to Discord webhooks
- Formats messages using Discord embed format
- Handles webhook failures gracefully (logs but doesn't throw)
- Implements retry logic with exponential backoff (max 3 retries)
- Validates webhook URLs on initialization

### 2. ThrottleManager

**Purpose**: Prevents notification spam through intelligent rate limiting

**Interface**:
```typescript
interface ThrottleManager {
  shouldSendNotification(key: string, type: NotificationType): boolean;
  recordNotification(key: string, type: NotificationType): void;
  getThrottledCount(key: string): number;
  sendThrottledSummary(): Promise<void>;
}

type NotificationType = 'error' | 'feedback' | 'activity' | 'health';

interface ThrottleEntry {
  lastSent: Date;
  count: number;
  throttledCount: number;
}
```

**Throttling Rules**:
- **Errors**: Max 1 per minute per unique error type (based on error message hash)
- **Critical Errors**: Never throttled
- **Feedback**: Never throttled
- **Activity**: Never throttled
- **Throttled Summary**: Sent every 5 minutes if throttled notifications exist

**Implementation Details**:
- Uses in-memory Map for throttle tracking
- Clears old entries every hour to prevent memory leaks
- Generates unique keys using MD5 hash of error message
- Runs background job every 5 minutes to send throttled summaries

### 3. ErrorMiddleware

**Purpose**: Catches and reports all unhandled errors in Express routes

**Interface**:
```typescript
function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void;
```

**Implementation Details**:
- Catches all errors from route handlers
- Determines severity based on error type and HTTP status code
- Extracts context (user ID, endpoint, request body)
- Sends notification via NotificationService
- Returns appropriate error response to client
- Never exposes internal error details to client

**Severity Classification**:
- **Critical**: Database connection failures, authentication system failures
- **High**: 500 errors, unhandled exceptions, third-party API failures
- **Medium**: 400 errors, validation failures, rate limit exceeded
- **Low**: 404 errors, expected business logic errors

### 4. FeedbackController

**Purpose**: Handles user feedback submissions from the mobile app

**Routes**:
```typescript
POST /api/v1/feedback
```

**Request Body**:
```typescript
interface FeedbackRequest {
  rating?: number;        // 1-5 stars
  category?: string;      // 'bug' | 'feature' | 'general'
  message: string;        // Required
  screenshot?: string;    // Base64 encoded image (optional)
}
```

**Response**:
```typescript
interface FeedbackResponse {
  success: boolean;
  message: string;
  feedbackId: string;
}
```

**Implementation Details**:
- Validates request body
- Stores feedback in database
- Sends notification to Discord
- Returns success response immediately (doesn't wait for Discord)
- Handles screenshot upload to S3 if provided (future enhancement)

### 5. ActivityTracker

**Purpose**: Tracks and reports key user activities

**Methods**:
```typescript
interface ActivityTracker {
  trackSignup(user: User, referralCode?: string): Promise<void>;
  trackPurchase(user: User, plan: string, amount: number): Promise<void>;
  trackReferral(referrer: User, referee: User, code: string): Promise<void>;
}
```

**Integration Points**:
- Called from `authRoutes.ts` on user registration
- Called from payment webhook handler on successful purchase
- Called from referral system when referred user signs up

**Implementation Details**:
- Sends notifications asynchronously (doesn't block main flow)
- Logs activity to database for analytics
- Includes relevant user information (name, email, timestamp)
- Handles notification failures gracefully

## Data Models

### Feedback Model

```typescript
interface Feedback {
  id: string;
  user_id: string;
  rating?: number;
  category?: string;
  message: string;
  screenshot_url?: string;
  created_at: Date;
  status: 'new' | 'read' | 'in_progress' | 'resolved' | 'ignored';
}
```

**Database Table**:
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  category VARCHAR(50),
  message TEXT NOT NULL,
  screenshot_url TEXT,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

### NotificationLog Model

```typescript
interface NotificationLog {
  id: string;
  type: 'error' | 'feedback' | 'activity' | 'health';
  channel: 'error' | 'feedback' | 'activity';
  payload: any;
  sent_at: Date;
  success: boolean;
  error_message?: string;
}
```

**Database Table**:
```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Auto-delete logs older than 30 days
CREATE OR REPLACE FUNCTION delete_old_notification_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM notification_logs WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

## Discord Embed Formats

### Error Notification

```json
{
  "embeds": [{
    "title": "🚨 ERROR DETECTED",
    "color": 15158332,
    "fields": [
      { "name": "Severity", "value": "High", "inline": true },
      { "name": "Time", "value": "2025-11-15 14:30:00 UTC", "inline": true },
      { "name": "Endpoint", "value": "/api/v1/recipes/search", "inline": true },
      { "name": "Error", "value": "Database connection timeout", "inline": false },
      { "name": "Affected Users", "value": "3", "inline": true },
      { "name": "Status", "value": "Attempting auto-repair...", "inline": true }
    ],
    "footer": { "text": "Cook Smart Error Monitor" },
    "timestamp": "2025-11-15T14:30:00.000Z"
  }]
}
```

### Feedback Notification

```json
{
  "embeds": [{
    "title": "💬 NEW FEEDBACK",
    "color": 3447003,
    "fields": [
      { "name": "User", "value": "John Doe (john@example.com)", "inline": false },
      { "name": "Rating", "value": "⭐⭐⭐⭐⭐", "inline": true },
      { "name": "Category", "value": "Feature Request", "inline": true },
      { "name": "Time", "value": "2025-11-15 14:30:00 UTC", "inline": true },
      { "name": "Message", "value": "Would love to see barcode scanning!", "inline": false }
    ],
    "footer": { "text": "Cook Smart Feedback" },
    "timestamp": "2025-11-15T14:30:00.000Z"
  }]
}
```

### Activity Notification (Signup)

```json
{
  "embeds": [{
    "title": "👤 NEW USER SIGNUP",
    "color": 5763719,
    "fields": [
      { "name": "Name", "value": "Jane Smith", "inline": true },
      { "name": "Email", "value": "jane@example.com", "inline": true },
      { "name": "Time", "value": "2025-11-15 14:30:00 UTC", "inline": true },
      { "name": "Referred By", "value": "John Doe (Code: JOHN123)", "inline": false }
    ],
    "footer": { "text": "Cook Smart Activity" },
    "timestamp": "2025-11-15T14:30:00.000Z"
  }]
}
```

## Error Handling

### Notification Failure Handling

```typescript
async function sendNotification(webhookUrl: string, embed: any): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(embed),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status}`);
    }

    // Log success
    await NotificationLogModel.create({
      type: embed.type,
      channel: embed.channel,
      payload: embed,
      success: true,
    });
  } catch (error) {
    // Log failure but don't throw
    console.error('Failed to send Discord notification:', error);
    
    await NotificationLogModel.create({
      type: embed.type,
      channel: embed.channel,
      payload: embed,
      success: false,
      error_message: error.message,
    });
  }
}
```

### Auto-Repair System

```typescript
interface AutoRepairStrategy {
  canHandle(error: Error): boolean;
  repair(error: Error): Promise<RepairResult>;
}

interface RepairResult {
  success: boolean;
  message: string;
  action: string;
}

class DatabaseConnectionRepair implements AutoRepairStrategy {
  canHandle(error: Error): boolean {
    return error.message.includes('database connection');
  }

  async repair(error: Error): Promise<RepairResult> {
    // Attempt to reconnect to database
    try {
      await database.reconnect();
      return {
        success: true,
        message: 'Database connection restored',
        action: 'Reconnected to PostgreSQL',
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to restore database connection',
        action: 'Manual intervention required',
      };
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **NotificationService Tests**
   - Test embed formatting for each notification type
   - Test webhook URL validation
   - Test retry logic
   - Test failure handling

2. **ThrottleManager Tests**
   - Test throttling rules for each notification type
   - Test throttled summary generation
   - Test memory cleanup

3. **ErrorMiddleware Tests**
   - Test severity classification
   - Test context extraction
   - Test error response formatting

### Integration Tests

1. **End-to-End Notification Flow**
   - Trigger error → Verify Discord notification sent
   - Submit feedback → Verify Discord notification sent
   - Register user → Verify Discord notification sent

2. **Throttling Behavior**
   - Send 10 identical errors → Verify only 1 notification sent
   - Wait 1 minute → Verify next error sends notification

3. **Webhook Failure Handling**
   - Configure invalid webhook URL → Verify app continues working
   - Verify notification logged as failed

### Manual Testing

1. **Discord Channel Setup**
   - Create Discord server
   - Create three channels (errors, feedback, activity)
   - Generate webhook URLs for each channel
   - Test webhook URLs with curl

2. **Notification Appearance**
   - Verify embed colors are correct
   - Verify formatting is readable
   - Verify emojis display correctly
   - Verify timestamps are accurate

## Security Considerations

1. **Webhook URL Protection**
   - Store webhook URLs in environment variables
   - Never expose webhook URLs in client code
   - Rotate webhook URLs if compromised

2. **Data Privacy**
   - Don't include sensitive user data (passwords, tokens) in notifications
   - Mask email addresses in public channels (optional)
   - Include only necessary user information

3. **Rate Limiting**
   - Implement throttling to prevent abuse
   - Monitor notification volume
   - Alert if notification rate exceeds threshold

4. **Error Message Sanitization**
   - Remove sensitive information from error messages
   - Don't include database connection strings
   - Don't include API keys or secrets

## Performance Considerations

1. **Async Notifications**
   - All notifications sent asynchronously
   - Don't block user-facing operations
   - Use background jobs for batch notifications

2. **Memory Management**
   - Clear throttle map every hour
   - Limit notification log retention to 30 days
   - Use database indexes for efficient queries

3. **Network Efficiency**
   - Batch throttled notifications into single message
   - Compress large payloads
   - Implement connection pooling for webhook requests

## Deployment Checklist

1. **Discord Setup**
   - [ ] Create Discord server
   - [ ] Create error channel
   - [ ] Create feedback channel
   - [ ] Create activity channel
   - [ ] Generate webhook URLs
   - [ ] Test webhook URLs

2. **Backend Configuration**
   - [ ] Add webhook URLs to `.env`
   - [ ] Deploy NotificationService
   - [ ] Deploy ThrottleManager
   - [ ] Deploy ErrorMiddleware
   - [ ] Deploy FeedbackController
   - [ ] Deploy ActivityTracker

3. **Database Setup**
   - [ ] Run feedback table migration
   - [ ] Run notification_logs table migration
   - [ ] Set up auto-cleanup job

4. **Frontend Integration**
   - [ ] Add feedback button to settings
   - [ ] Create feedback form modal
   - [ ] Implement feedback submission
   - [ ] Test feedback flow

5. **Testing**
   - [ ] Test error notifications
   - [ ] Test feedback notifications
   - [ ] Test activity notifications
   - [ ] Test throttling
   - [ ] Test auto-repair

6. **Monitoring**
   - [ ] Monitor Discord channels
   - [ ] Verify notifications are sent
   - [ ] Check notification logs
   - [ ] Verify throttling works

## Cost Analysis

- **Discord Webhooks**: $0 (free, unlimited)
- **Database Storage**: ~$0.10/month (feedback + logs)
- **Network Bandwidth**: ~$0.05/month (webhook requests)
- **Total**: ~$0.15/month

**Well within $20/month budget** ✅

## Future Enhancements

1. **Advanced Auto-Repair**
   - More repair strategies
   - Machine learning for error prediction
   - Automated rollback on critical errors

2. **Analytics Dashboard**
   - Visualize notification trends
   - Error frequency charts
   - User feedback sentiment analysis

3. **Slack Integration**
   - Support Slack webhooks as alternative
   - Multi-channel support

4. **Mobile Push Notifications**
   - Critical errors trigger push notifications
   - Configurable notification preferences
