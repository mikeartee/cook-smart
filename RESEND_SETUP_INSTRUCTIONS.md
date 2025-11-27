# Resend Email Service Setup

## Your Tasks (5 minutes)

### 1. Sign Up for Resend
1. Go to https://resend.com
2. Click "Sign Up" or "Get Started"
3. Create account with your email
4. Verify your email

### 2. Get API Key
1. Once logged in, go to "API Keys" section
2. Click "Create API Key"
3. Name it: "Cook Smart Production"
4. Copy the API key (starts with `re_`)
5. **SAVE IT** - you won't see it again!

### 3. Verify Domain (Optional but Recommended)
1. Go to "Domains" section
2. Add domain: `cooksmartapp.com`
3. Add DNS records they provide
4. Wait for verification (can take a few minutes)

**Note:** You can skip domain verification for now and use `onboarding@resend.dev` as sender

## My Tasks (Already Done ✅)

- ✅ Installed Resend package
- ✅ Created new EmailService with Resend
- ✅ Created test script
- ✅ Created deployment script

## What We'll Do Together

### Step 1: Test Locally (2 min)
```bash
# Add to backend/.env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# Test it
cd backend
node test-resend-email.js
```

### Step 2: Deploy to Server (5 min)
```bash
# Run deployment script
deploy-resend-email.bat

# Or manually:
# 1. Copy new EmailService to server
# 2. Add RESEND_API_KEY to server .env
# 3. Rebuild backend
# 4. Restart PM2
```

### Step 3: Test on Server (2 min)
```bash
# SSH to server and test
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24
cd /home/ubuntu/cook-smart-backend
node test-resend-email.js
```

## Environment Variables Needed

### Local (.env)
```
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
```

### Server (.env)
```
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>
```

## Resend vs AWS SES

| Feature | Resend | AWS SES |
|---------|--------|---------|
| Free Tier | 3,000 emails/month | 200 emails/day (sandbox) |
| Setup Time | 5 minutes | Hours (verification) |
| Approval | Instant | Denied ❌ |
| API | Simple | Complex |
| Dashboard | Beautiful | Confusing |

## What Emails Will Use This

- Password reset emails
- Subscription confirmation emails
- Welcome emails
- Notification emails

## Testing

### Test Email Script
```bash
cd backend
node test-resend-email.js
```

### Test Password Reset
```bash
# In app, click "Forgot Password"
# Enter your email
# Check inbox for reset code
```

## Rollback Plan

If Resend doesn't work:
```bash
# Restore old EmailService
scp backend/EmailService.backup.js ubuntu@3.237.38.24:/home/ubuntu/cook-smart-backend/dist/services/EmailService.js
ssh ubuntu@3.237.38.24 "pm2 restart cook-smart-backend"
```

## Cost

- **Free:** 3,000 emails/month
- **Paid:** $20/month for 50,000 emails
- **For BETA:** Free tier is plenty

## Next Steps After Setup

1. ✅ Test password reset in app
2. ✅ Verify emails arrive
3. ✅ Check spam folder (first time)
4. ✅ Add domain verification (optional)
5. ✅ Monitor usage in Resend dashboard

## Support

- Resend Docs: https://resend.com/docs
- Resend Support: support@resend.com
- Very responsive team!

