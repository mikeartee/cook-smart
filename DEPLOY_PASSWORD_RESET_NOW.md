# Deploy Password Reset Feature - Complete Guide

## 🎯 What This Deploys

The forgot password feature that allows users to:
1. Request a password reset code via email
2. Receive a 6-digit code in their email
3. Enter the code and set a new password

## ✅ Pre-Deployment Checklist

### Already Done:
- ✅ Frontend screens (ForgotPasswordScreen + ResetPasswordScreen)
- ✅ Backend API routes configured
- ✅ Email service code ready (Resend)
- ✅ Database migration script created
- ✅ Resend package installed

### You Need:
- 🔑 Resend API Key (get from https://resend.com/api-keys)
- 🔐 SSH access to your EC2 server
- 📧 Domain verified in Resend (cooksmartapp.com)

## 🚀 Deployment Steps

### Option 1: Automated Deployment (Recommended)

**Step 1: Setup Environment Variables**
```powershell
.\setup-password-reset-env.ps1
```
This will:
- Prompt for your Resend API key
- Add it to your production server's .env
- Backup your existing .env

**Step 2: Deploy Everything**
```powershell
.\deploy-password-reset.ps1
```
This will:
- Build the backend
- Upload files to EC2
- Run database migration
- Restart the backend service
- Verify deployment

### Option 2: Manual Deployment

**Step 1: Add Environment Variables to Server**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com

cd /home/ec2-user/cook-smart-backend

# Backup .env
cp .env .env.backup

# Edit .env
nano .env

# Add these lines:
RESEND_API_KEY=re_your_actual_key_here
EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>

# Save and exit (Ctrl+X, Y, Enter)
```

**Step 2: Build Backend Locally**
```powershell
cd backend
npm run build
```

**Step 3: Upload to Server**
```powershell
scp -i ~/.ssh/cook-smart-key.pem -r backend/dist/* ec2-user@api.cooksmartapp.com:/home/ec2-user/cook-smart-backend/dist/
```

**Step 4: Run Database Migration**
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com

cd /home/ec2-user/cook-smart-backend

# Run migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/create-password-reset-tokens-table.sql
```

**Step 5: Restart Backend**
```bash
pm2 restart cook-smart-backend
pm2 logs cook-smart-backend --lines 50
```

## 🧪 Testing

### Test on Production:

1. **Open Cook Smart App**
2. **Tap "Forgot Password?"**
3. **Enter your email address**
4. **Check your email** for the 6-digit code
5. **Enter the code** in the app
6. **Set a new password**
7. **Login with new password**

### Verify Backend Logs:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com
pm2 logs cook-smart-backend --lines 100
```

Look for:
- `📧 Email Service: Resend initialized`
- `📧 Password reset email sent to: user@example.com`

## 🔍 Troubleshooting

### Issue: "Email Service: Running in development mode"
**Solution:** RESEND_API_KEY is missing from .env
```bash
# Check .env on server
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com
cat /home/ec2-user/cook-smart-backend/.env | grep RESEND
```

### Issue: "Failed to send email via Resend"
**Solution:** Check API key and domain verification
1. Verify API key is correct
2. Check domain is verified in Resend dashboard
3. Check Resend logs: https://resend.com/logs

### Issue: "Invalid or expired code"
**Solution:** Check database table exists
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d password_reset_tokens"
```

### Issue: Backend won't restart
**Solution:** Check for syntax errors
```bash
pm2 logs cook-smart-backend --err --lines 50
```

## 💰 Cost Impact

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for password resets

**Expected Usage:**
- ~10-50 password resets/day
- Well within free tier
- **Cost: $0/month**

## 📊 Monitoring

### Check Email Delivery:
- Resend Dashboard: https://resend.com/emails
- View sent emails, delivery status, opens

### Check Backend Health:
```bash
curl https://api.cooksmartapp.com/health
```

### Check Database:
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@api.cooksmartapp.com
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM password_reset_tokens WHERE created_at > NOW() - INTERVAL '24 hours';"
```

## 🎉 Success Criteria

✅ Backend logs show "Resend initialized"
✅ Test email received within 30 seconds
✅ Reset code works in app
✅ Password successfully changed
✅ Can login with new password

## 📞 Next Steps After Deployment

1. **Test with multiple email providers** (Gmail, Outlook, Yahoo)
2. **Monitor Resend dashboard** for delivery rates
3. **Check spam folders** if emails not received
4. **Add email verification** for new signups (future feature)

## 🔐 Security Notes

- Reset codes expire after 1 hour
- Codes are single-use only
- Tokens are hashed in database
- Rate limiting prevents abuse
- Email doesn't reveal if account exists

---

**Created:** 2025-11-26
**Status:** Ready to Deploy
**Estimated Time:** 5-10 minutes

