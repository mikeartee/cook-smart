# 🚀 Deploy Backend Fixes - Quick Guide

## What's Being Deployed

✅ Fixed `GET /api/v1/subscriptions/me` endpoint
✅ Fixed `GET /api/v1/settings/privacy` SQL parameters  
✅ Fixed `PATCH /api/v1/settings/privacy` SQL parameters
✅ Fixed health monitor cascading errors
✅ Fixed DiscordWebhookService TypeScript errors

## Deployment Steps

### 1. Commit and Push Changes

```bash
git add backend/
git commit -m "Fix: Add /subscriptions/me endpoint and fix privacy settings SQL params"
git push origin main
```

### 2. SSH to Production Server

```bash
ssh -i your-key.pem ubuntu@54.82.17.206
```

### 3. Pull Latest Code

```bash
cd /home/ubuntu/cook-smart-backend
git pull origin main
```

### 4. Install Dependencies (if needed)

```bash
npm install
```

### 5. Build TypeScript

```bash
npm run build
```

### 6. Restart PM2

```bash
pm2 restart cook-smart-api
```

### 7. Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs cook-smart-api --lines 50
```

### 8. Test Endpoints

```bash
# Test subscription endpoint (should return 401 if not authenticated)
curl https://api.cooksmart.app/api/v1/subscriptions/me

# Test privacy settings endpoint (should return 401 if not authenticated)
curl https://api.cooksmart.app/api/v1/settings/privacy
```

## Expected Results

Both endpoints should return:
- Status: 401 Unauthorized (this is correct - means endpoint exists)
- When authenticated in the app, they will return actual data

## Troubleshooting

**If endpoints return 404:**
- Check git pull worked: `git log -1`
- Verify build succeeded: `ls dist/routes/`
- Check PM2 restarted: `pm2 status`

**If PM2 won't restart:**
```bash
pm2 stop cook-smart-api
pm2 start cook-smart-api
```

**If build fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

## Done!

Once deployed, the app will be able to:
- Fetch user subscription status
- Load and save privacy settings
- No more health monitor error loops
