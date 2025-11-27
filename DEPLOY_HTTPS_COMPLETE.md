# Complete HTTPS Deployment - Step by Step

## Prerequisites Check
- ✅ Domain registered: `cooksmartapp.com`
- ✅ EC2 server running: `3.237.38.24`
- ✅ Backend running on port 3000
- ✅ SSH key available: `~/.ssh/cook-smart-key.pem`

---

## Step 1: Set Up DNS (5 minutes)

### Option A: Manual (AWS Console)
1. Go to: https://console.aws.amazon.com/route53/
2. Click "Hosted zones" → `cooksmartapp.com`
3. Click "Create record"
4. **Record name:** `api`
5. **Record type:** `A`
6. **Value:** `3.237.38.24`
7. **TTL:** `300`
8. Click "Create records"

### Option B: Using AWS CLI (if you have it)
```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "api.cooksmartapp.com",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "3.237.38.24"}]
      }
    }]
  }'
```

### Verify DNS (wait 2-5 minutes):
```bash
nslookup api.cooksmartapp.com
# Should return: 3.237.38.24
```

---

## Step 2: Update EC2 Security Group (3 minutes)

### Go to EC2 Console:
https://console.aws.amazon.com/ec2/

1. Click "Instances"
2. Select your Cook Smart instance
3. Click "Security" tab
4. Click on the security group link
5. Click "Edit inbound rules"
6. Add these rules (if not present):

| Type  | Protocol | Port | Source    |
|-------|----------|------|-----------|
| HTTP  | TCP      | 80   | 0.0.0.0/0 |
| HTTPS | TCP      | 443  | 0.0.0.0/0 |
| SSH   | TCP      | 22   | Your IP   |
| Custom| TCP      | 3000 | 0.0.0.0/0 |

7. Click "Save rules"

---

## Step 3: Upload and Run Setup Script (10 minutes)

### From your local machine:

```bash
# Upload the setup script to EC2
scp -i ~/.ssh/cook-smart-key.pem setup-https-on-ec2.sh ec2-user@3.237.38.24:~/

# SSH into EC2
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@3.237.38.24

# Make script executable
chmod +x setup-https-on-ec2.sh

# Run the setup script
sudo ./setup-https-on-ec2.sh
```

### What the script does:
1. ✅ Installs certbot and nginx
2. ✅ Gets SSL certificate from Let's Encrypt
3. ✅ Configures nginx as reverse proxy
4. ✅ Sets up auto-renewal
5. ✅ Starts all services

### Expected output:
```
==========================================
HTTPS Setup Complete!
==========================================

Your API is now available at:
  https://api.cooksmartapp.com
```

---

## Step 4: Test HTTPS (2 minutes)

### From your local machine:

```bash
# Test HTTPS endpoint
curl https://api.cooksmartapp.com/health

# Should return your health check response
```

### Test in browser:
Open: https://api.cooksmartapp.com/health

Should see:
- ✅ Green padlock 🔒
- ✅ Valid SSL certificate
- ✅ Your API response

---

## Step 5: Set Up Stripe Webhook (5 minutes)

Now that HTTPS is working, let's configure the webhook!

### Go to Stripe Dashboard:
https://dashboard.stripe.com/webhooks

**Make sure you're in LIVE mode** (toggle in top right)

### Add Endpoint:
1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://api.cooksmartapp.com/api/webhooks/stripe`
3. **Description:** `Cook Smart Payment Webhooks - Production`
4. Click **"Select events"**
5. Choose these 6 events:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `customer.subscription.trial_will_end`
6. Click **"Add endpoint"**

### Get Signing Secret:
1. Click on the webhook you just created
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)

---

## Step 6: Update .env with Webhook Secret (3 minutes)

### SSH into EC2 (if not already):
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@3.237.38.24
```

### Find your backend directory:
```bash
# Common locations:
cd ~/backend
# or
cd /home/ec2-user/cook-smart/backend
# or
find ~ -name ".env" -path "*/backend/.env"
```

### Edit .env:
```bash
nano .env
```

### Update this line:
```bash
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
```

Replace with the secret you copied from Stripe.

### Save and exit:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Restart backend:
```bash
pm2 restart all
# or if not using PM2:
# pkill node && npm start &
```

---

## Step 7: Test Webhook (2 minutes)

### In Stripe Dashboard:
1. Go to your webhook: https://dashboard.stripe.com/webhooks
2. Click on your webhook
3. Click **"Send test webhook"**
4. Select `customer.subscription.created`
5. Click **"Send test webhook"**

### Check result:
- Should show **"200 OK"** ✅
- If you see error, check backend logs: `pm2 logs`

### Check backend logs:
```bash
pm2 logs --lines 50
```

Should see:
```
Processing Stripe webhook: customer.subscription.created
```

---

## ✅ Verification Checklist

Run through this checklist to make sure everything works:

### DNS:
- [ ] `nslookup api.cooksmartapp.com` returns `3.237.38.24`

### HTTPS:
- [ ] `curl https://api.cooksmartapp.com/health` works
- [ ] Browser shows green padlock at `https://api.cooksmartapp.com`
- [ ] SSL certificate is valid (not expired)

### Backend:
- [ ] Backend is running: `pm2 list` or `ps aux | grep node`
- [ ] Port 3000 is listening: `sudo lsof -i :3000`
- [ ] No errors in logs: `pm2 logs`

### nginx:
- [ ] nginx is running: `sudo systemctl status nginx`
- [ ] nginx config is valid: `sudo nginx -t`
- [ ] Can access via HTTPS

### Stripe:
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook secret in `.env`
- [ ] Test webhook returns 200 OK
- [ ] Backend logs show webhook received

---

## 🎉 Success!

Your production setup is complete:
- ✅ HTTPS enabled with free SSL certificate
- ✅ Domain: `https://api.cooksmartapp.com`
- ✅ nginx reverse proxy configured
- ✅ Stripe webhook working
- ✅ SSL auto-renewal configured
- ✅ Production ready!

---

## 🧪 Ready to Test Payments!

Now you can run the payment lifecycle tests from `PAYMENT_LIFECYCLE_TESTING.md`

All webhooks will work automatically and you're ready for production!

---

## 🔧 Troubleshooting

### DNS not resolving:
```bash
# Check DNS propagation
nslookup api.cooksmartapp.com
# Wait 5-10 minutes and try again
```

### SSL certificate failed:
```bash
# Check if port 80 is accessible
curl http://api.cooksmartapp.com
# Make sure security group allows port 80
```

### nginx not starting:
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Test config
sudo nginx -t
```

### Webhook not working:
```bash
# Check backend logs
pm2 logs

# Check if webhook secret is correct
grep STRIPE_WEBHOOK_SECRET .env

# Test webhook endpoint
curl -X POST https://api.cooksmartapp.com/api/webhooks/stripe
# Should return 400 (expected - needs valid signature)
```

---

## 📞 Need Help?

If you run into issues:
1. Check the logs: `pm2 logs`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `nslookup api.cooksmartapp.com`
4. Test HTTPS: `curl -v https://api.cooksmartapp.com/health`

