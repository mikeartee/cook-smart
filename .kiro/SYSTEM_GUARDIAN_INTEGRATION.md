# System Guardian Integration Complete

## What is System Guardian?

System Guardian is an automated monitoring and self-healing system that:
- **Monitors** backend health 24/7 (every 60 seconds)
- **Detects** issues with database, APIs, and backend services
- **Auto-repairs** common problems automatically
- **Notifies** via Discord when issues occur or are fixed
- **Nuclear option** can rebuild entire system if all else fails

## Current Status

✅ **Backend**: Fully implemented and running
✅ **Auto-start**: Activates automatically in production mode
✅ **API Endpoints**: Available at `/api/v1/system-guardian`
✅ **Admin Screen**: Created for mobile app monitoring

## Features

### 1. Automated Health Checks
- Checks every 60 seconds
- Monitors:
  - Backend error rate
  - Database connection
  - API health
  - Overall system status

### 2. Auto-Repair Strategies
- **Database Connection Repair**: Reconnects to PostgreSQL
- **Rate Limit Handling**: Switches to fallback APIs
- **API Timeout Recovery**: Implements retry with backoff
- **Service Restart**: Restarts PM2 process if needed

### 3. Escalation Levels
1. **Healthy** → No action needed
2. **Degraded** → Attempt targeted repairs
3. **Critical** → Restart services
4. **Nuclear** → Rebuild entire system (after 5 consecutive failures)

### 4. Discord Notifications
Sends notifications for:
- System Guardian activation/deactivation
- Health status changes
- Repair attempts (success/failure)
- Critical alerts
- Nuclear option initiation

## API Endpoints

### GET /api/v1/system-guardian/status
Get current monitoring status and recent repairs
```json
{
  "status": {
    "isMonitoring": true,
    "lastHealthCheck": "2024-11-20T04:00:00Z",
    "consecutiveFailures": 0,
    "repairCount": 5
  },
  "recentRepairs": [...]
}
```

### POST /api/v1/system-guardian/start
Start monitoring (requires auth)

### POST /api/v1/system-guardian/stop
Stop monitoring (requires auth)

### POST /api/v1/system-guardian/nuke
Initiate nuclear option - rebuild system (requires auth + reason)

### GET /api/v1/system-guardian/history
Get full repair history

## Mobile App Integration

### Admin Screen Created
**Location**: `src/screens/admin/SystemGuardianScreen.tsx`

**Features**:
- Real-time status display
- Start/stop monitoring controls
- Nuclear option button (with confirmation)
- Recent repairs history
- Auto-refresh capability

### To Add to Navigation:
1. Import in admin navigation file
2. Add route for System Guardian
3. Add quick action button in AdminDashboardScreen

## Configuration

### Thresholds (in SystemGuardian.ts)
```typescript
MAX_CONSECUTIVE_FAILURES = 5  // Before nuclear option
HEALTH_CHECK_INTERVAL = 60000  // 1 minute
CRITICAL_ERROR_RATE = 0.15     // 15% error rate
```

### Discord Webhooks
Set in backend/.env:
```
DISCORD_WEBHOOK_URL=your_webhook_url
DISCORD_ERROR_WEBHOOK_URL=your_error_webhook_url
```

## How It Works

### Normal Operation
```
1. Health check runs every 60 seconds
2. Checks backend, database, APIs
3. If healthy → Continue monitoring
4. If degraded → Attempt repairs
5. If critical → Restart services
6. Send Discord notifications
```

### Failure Escalation
```
Failure 1-2: Attempt targeted repairs
Failure 3-4: Restart backend service
Failure 5+: NUCLEAR OPTION
  ↓
  Stop all services
  Pull latest code
  npm install
  npm run build
  Restart all services
```

## Testing

### Manual Testing
```bash
# SSH into EC2
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24

# Check if System Guardian is running
pm2 logs cook-smart-backend | grep "System Guardian"

# Should see:
# "🛡️ System Guardian activated - monitoring started"
```

### API Testing
```bash
# Get status (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://3.237.38.24:3000/api/v1/system-guardian/status

# Start monitoring
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://3.237.38.24:3000/api/v1/system-guardian/start

# Stop monitoring
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  http://3.237.38.24:3000/api/v1/system-guardian/stop
```

## Deployment Status

✅ **Already Deployed**: System Guardian is already running on your EC2 server
- Started automatically when backend starts
- Running in production mode
- Monitoring active since last backend restart

## Next Steps

### 1. Add to Admin Dashboard (Optional)
Update `src/screens/AdminDashboardScreen.tsx`:
```typescript
<QuickAction
  title="System Guardian"
  icon="🛡️"
  onPress={() => navigation.navigate('SystemGuardian')}
/>
```

### 2. Add Navigation Route
Add to admin navigation stack:
```typescript
<Stack.Screen 
  name="SystemGuardian" 
  component={SystemGuardianScreen} 
/>
```

### 3. Monitor Discord
Check your Discord server for System Guardian notifications

### 4. Test Nuclear Option (Optional)
Only in emergency or testing:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Testing nuclear option"}' \
  http://3.237.38.24:3000/api/v1/system-guardian/nuke
```

## Benefits

1. **24/7 Monitoring**: Never miss a system issue
2. **Auto-Recovery**: Most issues fixed without human intervention
3. **Reduced Downtime**: Fast automatic repairs
4. **Visibility**: Discord notifications keep you informed
5. **Last Resort**: Nuclear option ensures system can always recover

## Cost Impact

💰 **FREE** - No additional costs
- Uses existing infrastructure
- No external services required
- Discord webhooks are free

## Maintenance

### Regular Tasks
- Monitor Discord notifications
- Review repair history weekly
- Adjust thresholds if needed
- Test nuclear option quarterly

### When to Intervene
- 3+ consecutive failures
- Nuclear option triggered
- Repeated same repairs
- Database connection issues persist

## Security

- All endpoints require authentication
- Nuclear option requires reason (audit trail)
- Repair history tracked
- Discord notifications for all actions

## Success Metrics

Track in Discord:
- Uptime percentage
- Number of auto-repairs
- Time to recovery
- Nuclear option triggers (should be rare)

---

**Status**: ✅ ACTIVE AND MONITORING
**Last Updated**: Nov 20, 2024
**Version**: 1.0.0
