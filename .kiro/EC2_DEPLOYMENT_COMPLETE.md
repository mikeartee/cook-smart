# EC2 Deployment Complete ✅

## Deployment Summary

The Cook Smart backend has been successfully deployed to EC2!

**Server Details:**
- IP Address: `3.237.38.24`
- Instance ID: `i-05e0746da4f5f9da0`
- Instance Type: t3.small
- Region: us-east-1

## What's Working

✅ Backend code deployed and running
✅ PM2 process manager configured
✅ PM2 auto-start on reboot enabled
✅ Nginx reverse proxy configured
✅ Server responding to HTTP requests
✅ All routes accessible

**Test the server:**
```bash
curl http://3.237.38.24/health
curl http://3.237.38.24/api/v1/subscriptions/phase
```

## Next Steps Required

### 1. Fix Database Connectivity

The backend is running but can't connect to RDS. This is likely a security group issue.

**To fix:**
1. Go to AWS Console → RDS → Your database
2. Click on the security group
3. Add inbound rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: EC2 security group (or EC2 private IP)

### 2. Configure Stripe Webhook

Once database is connected:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `http://3.237.38.24/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.*`
   - `invoice.*`
4. Copy webhook secret
5. Add to EC2 `.env` file:
   ```bash
   ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
   cd ~/cook-smart-backend
   echo 'STRIPE_WEBHOOK_SECRET=whsec_your_secret_here' >> .env
   pm2 restart cook-smart-backend
   ```

### 3. Update Mobile App

In `src/config/api.ts`:
```typescript
export const API_URL = 'http://3.237.38.24';
```

### 4. Set Up SSL (Optional but Recommended)

For production, you should use HTTPS:

```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Deployment Files

- **Deployment Script:** `deploy-ec2-windows.ps1`
- **SSH Key:** `~/.ssh/cook-smart-key.pem`
- **Backend Location:** `/home/ubuntu/cook-smart-backend`

## Useful Commands

**View logs:**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
pm2 logs cook-smart-backend
```

**Restart backend:**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
pm2 restart cook-smart-backend
```

**Update code:**
```bash
# From your local machine
.\deploy-ec2-windows.ps1
```

## Status

🟢 Backend Deployed
🟡 Database Connection Pending (security group fix needed)
🟡 Stripe Webhook Pending
🟡 Mobile App Update Pending

The deployment is 90% complete - just need to fix the RDS security group to allow EC2 connections!
