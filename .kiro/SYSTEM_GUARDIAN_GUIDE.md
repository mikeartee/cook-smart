# System Guardian - Automated Monitoring & Repair System

## Overview

System Guardian is an advanced automated monitoring and self-repair system that watches over your Cook Smart application 24/7. It can detect issues, attempt automatic repairs, and even rebuild the entire system if necessary.

## Features

### 🔍 Continuous Monitoring
- Health checks every 60 seconds
- Monitors backend, database, and API health
- Tracks error rates and system performance
- Sends real-time alerts to Discord

### 🔧 Automatic Repairs
- **Database Connection Issues**: Automatically reconnects to PostgreSQL
- **Backend Crashes**: Restarts PM2 process
- **High Error Rates**: Triggers investigation and repair
- **API Timeouts**: Implements retry logic

### ☢️ Nuclear Option
- Last resort when all repairs fail
- Stops all services
- Pulls latest code from GitHub
- Reinstalls dependencies
- Rebuilds application
- Restarts all services
- **Triggered after 5 consecutive failures**

### 📢 Discord Notifications
All actions are logged to your Discord channel:
- 🛡️ System Guardian activation/deactivation
- ⚠️ System degraded warnings
- 🚨 Critical failures
- ✅ Successful repairs
- ☢️ Nuclear option initiated
- 📊 Repair history

## How It Works

### Health Check Cycle
```
Every 60 seconds:
1. Check backend health (error rate)
2. Check database health (connection & response time)
3. Check API health (usage stats)
4. Determine overall system health
5. Take action if needed
```

### Health States

#### Healthy ✅
- Error rate < 5%
- Database responding < 100ms
- All systems operational

#### Degraded ⚠️
- Error rate 5-15%
- Database responding 100-500ms
- System functional but slow
- **Action**: Attempt targeted repairs

#### Critical 🚨
- Error rate > 15%
- Database down or > 500ms
- System failing
- **Action**: Aggressive repairs, escalate to nuclear option if needed

## API Endpoints

### Get Status
```bash
GET /api/v1/system-guardian/status
Authorization: Bearer <token>
```

Response:
```json
{
  "status": {
    "isMonitoring": true,
    "lastHealthCheck": "2025-11-19T23:30:00.000Z",
    "consecutiveFailures": 0,
    "repairCount": 3
  },
  "recentRepairs": [...]
}
```

### Start Monitoring
```bash
POST /api/v1/system-guardian/start
Authorization: Bearer <token>
```

### Stop Monitoring
```bash
POST /api/v1/system-guardian/stop
Authorization: Bearer <token>
```

### Manual Nuclear Option (Emergency Only)
```bash
POST /api/v1/system-guardian/nuke
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Manual intervention required due to..."
}
```

### Get Repair History
```bash
GET /api/v1/system-guardian/history
Authorization: Bearer <token>
```

## Configuration

### Environment Variables

System Guardian uses the existing Discord webhook:
```env
DISCORD_ERROR_WEBHOOK=https://discord.com/api/webhooks/...
```

### Thresholds (in SystemGuardian.ts)

```typescript
MAX_CONSECUTIVE_FAILURES = 5      // Nuclear option trigger
HEALTH_CHECK_INTERVAL = 60000     // 1 minute
CRITICAL_ERROR_RATE = 0.15        // 15%
```

## Deployment

### On EC2

System Guardian automatically starts in production mode:

```typescript
// In server.ts
if (process.env.NODE_ENV === 'production') {
  SystemGuardian.startMonitoring();
}
```

### Manual Control

SSH into EC2 and use the API:

```bash
# Check status
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/system-guardian/status

# Stop monitoring
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/system-guardian/stop

# Start monitoring
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/system-guardian/start
```

## Repair Actions

### 1. Database Reconnect
**Trigger**: Database connection errors
**Action**: 
- Test connection
- Reconnect to PostgreSQL
- Verify with SELECT 1 query

### 2. Backend Restart
**Trigger**: High error rate or backend down
**Action**:
- Execute `pm2 restart cook-smart-backend`
- Wait for restart
- Verify health

### 3. Nuclear Rebuild
**Trigger**: 5 consecutive failures
**Action**:
1. `pm2 stop all`
2. `git pull origin fresh-project-migration`
3. `npm install`
4. `npm run build`
5. `pm2 restart all`

## Discord Notifications

### Notification Types

| Type | Color | When |
|------|-------|------|
| Info (ℹ️) | Blue | System Guardian start/stop |
| Success (✅) | Green | Successful repairs, recovery |
| Warning (⚠️) | Yellow | Degraded state, repair attempts |
| Error (🚨) | Red | Critical failures, nuclear option |

### Example Notifications

```
🛡️ System Guardian Activated
Automated monitoring and repair system is now active

⚠️ System Degraded
Backend: degraded
Database: healthy
APIs: healthy

✅ Database Repaired
Database connection restored

☢️ NUCLEAR OPTION INITIATED
Reason: Maximum consecutive failures reached
Rebuilding entire system...

✅ System Rebuilt
Nuclear option completed successfully. System is back online.
```

## Testing

### Test in Development

```bash
# Start backend in development
npm run dev

# System Guardian won't auto-start in dev mode
# Manually start for testing:
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/system-guardian/start
```

### Simulate Failures

```typescript
// In your code, temporarily add:
throw new Error('Simulated database failure');
```

Watch Discord for notifications and repair attempts.

## Best Practices

### ✅ Do
- Monitor Discord channel regularly
- Review repair history weekly
- Keep Discord webhook configured
- Test nuclear option in staging first
- Document any manual interventions

### ❌ Don't
- Disable in production without reason
- Ignore repeated repair attempts
- Use nuclear option casually
- Modify thresholds without testing
- Remove Discord notifications

## Troubleshooting

### System Guardian Not Starting
```bash
# Check logs
pm2 logs cook-smart-backend | grep "System Guardian"

# Verify environment
echo $NODE_ENV  # Should be "production"

# Check Discord webhook
echo $DISCORD_ERROR_WEBHOOK  # Should be set
```

### Too Many Notifications
```typescript
// Adjust thresholds in SystemGuardian.ts
HEALTH_CHECK_INTERVAL = 300000  // 5 minutes instead of 1
```

### Nuclear Option Keeps Triggering
1. Check repair history for patterns
2. Review error logs
3. May indicate infrastructure issue
4. Consider manual intervention

## Future Enhancements

- [ ] Machine learning for predictive failures
- [ ] Automatic scaling based on load
- [ ] Integration with AWS CloudWatch
- [ ] SMS alerts for critical failures
- [ ] Automatic rollback on failed deployments
- [ ] Performance optimization suggestions
- [ ] Cost optimization recommendations

## Support

If System Guardian fails to resolve an issue:
1. Check Discord notifications for details
2. Review repair history via API
3. SSH into EC2 and check logs
4. Manual intervention may be required
5. Contact development team if persistent

---

**System Guardian**: Making Cook Smart bulletproof, one repair at a time. 🛡️
