# Setup AWS SES for Password Reset Emails

## Current Status

✅ Email service code already exists
✅ Password reset routes already exist
✅ Beautiful email templates ready
❌ AWS SES not configured (currently logs to console)

## Cost: $0/month

- First 62,000 emails/month: FREE (when sending from EC2)
- You won't hit this limit for a long time

## Setup Steps (15 minutes)

### Step 1: Verify Your Email Address in AWS SES

1. Go to AWS Console → SES (Simple Email Service)
2. Click "Verified identities" → "Create identity"
3. Choose "Email address"
4. Enter: `services.cooksmart@gmail.com`
5. Click "Create identity"
6. **Check your email** and click the verification link
7. Wait for status to show "Verified"

### Step 2: Create SMTP Credentials

1. In AWS SES, go to "SMTP settings"
2. Click "Create SMTP credentials"
3. Enter username: `cook-smart-smtp-user`
4. Click "Create user"
5. **IMPORTANT**: Copy and save:
   - SMTP Username (looks like: AKIAIOSFODNN7EXAMPLE)
   - SMTP Password (looks like: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)

### Step 3: Get Your SES Region

Your SES region is shown in the SMTP settings page. It's probably:

- `us-east-1` (N. Virginia)
- `us-west-2` (Oregon)

### Step 4: Update EC2 Environment Variables

SSH into your EC2 server and add these to `.env`:

```bash
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24
cd cook-smart-backend
nano .env
```

Add these lines:

```env
# AWS SES Email Configuration
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=YOUR_SMTP_USERNAME_HERE
AWS_SES_SECRET_KEY=YOUR_SMTP_PASSWORD_HERE
EMAIL_FROM=services.cooksmart@gmail.com
```

Save and exit (Ctrl+X, Y, Enter)

### Step 5: Restart Backend

```bash
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 20
```

You should see:

```
📧 Email Service: Configured with AWS SES
```

### Step 6: Test It!

1. Open Cook Smart app
2. Tap "Forgot Password?"
3. Enter email address
4. Check email for reset code
5. Enter code and new password
6. Done! ✅

## Sandbox vs Production Mode

### Sandbox Mode (Default)

- Can only send to verified email addresses
- Good for testing
- **You're probably in this mode**

### Production Mode (Request Access)

To send to ANY email address:

1. Go to AWS SES → Account dashboard
2. Click "Request production access"
3. Fill out form:
   - **Use case**: Transactional emails (password resets, notifications)
   - **Website URL**: cooksmart.app
   - **Expected volume**: 1,000 emails/month
   - **Compliance**: We follow CAN-SPAM and have unsubscribe links
4. Submit (usually approved in 24 hours)

## What Emails Will Work

### Current Features (Already Coded):

- ✅ Password reset emails
- ✅ Welcome emails (can enable)
- ✅ Email verification (can enable)

### Future Features (Easy to Add):

- Recipe sharing via email
- Weekly recipe digest
- Shopping list reminders
- Subscription renewal reminders

## Monitoring

Check email sending in AWS Console:

- SES → Sending statistics
- See delivery rate, bounces, complaints
- All should be 99%+ delivery rate

## Troubleshooting

### Emails not sending?

```bash
# Check logs
pm2 logs cook-smart-backend | grep -i email

# Verify SES credentials
aws ses verify-email-identity --email-address services.cooksmart@gmail.com
```

### Emails going to spam?

- Set up SPF, DKIM, and DMARC records (I can help with this)
- Use a verified domain instead of @gmail.com sender

## Next Steps

1. **Verify email in AWS SES** (5 min)
2. **Create SMTP credentials** (2 min)
3. **Update .env on EC2** (3 min)
4. **Restart backend** (1 min)
5. **Test password reset** (2 min)

Total time: ~15 minutes
Total cost: $0/month

Ready to start? I can walk you through each step!
