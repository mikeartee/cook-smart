# Set Up HTTPS on EC2 - Production Ready

## What We're Doing
1. Point `api.cooksmartapp.com` to your EC2 server
2. Install SSL certificate (free from Let's Encrypt)
3. Configure nginx as reverse proxy
4. Set up Stripe webhook with HTTPS

**Time:** 20-30 minutes
**Cost:** $0 (free SSL certificate)

---

## Step 1: Configure DNS (5 minutes)

### Go to Route 53:
https://console.aws.amazon.com/route53/

### Find your hosted zone:
- Click on "Hosted zones"
- Click on `cooksmartapp.com`

### Create A Record:
1. Click **"Create record"**
2. **Record name:** `api`
3. **Record type:** `A - Routes traffic to an IPv4 address`
4. **Value:** `3.237.38.24` (your EC2 IP)
5. **TTL:** `300` (5 minutes)
6. Click **"Create records"**

### Wait 2-5 minutes for DNS to propagate

### Test DNS:
```bash
# From your local machine
nslookup api.cooksmartapp.com
# Should return: 3.237.38.24
```

---

## Step 2: SSH into EC2 and Install Certbot (5 minutes)

```bash
# SSH into your EC2 server
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@3.237.38.24

# Update system
sudo yum update -y

# Install certbot
sudo yum install certbot -y

# Install nginx
sudo yum install nginx -y
```

---

## Step 3: Get SSL Certificate (5 minutes)

### Stop your Node.js app temporarily (certbot needs port 80):
```bash
# Find your Node.js process
pm2 list
# or
ps aux | grep node

# Stop it temporarily
pm2 stop all
# or kill the process
```

### Get SSL certificate:
```bash
sudo certbot certonly --standalone -d api.cooksmartapp.com --email services.cooksmart@gmail.com --agree-tos --non-interactive
```

This will:
- Verify you own the domain
- Generate SSL certificate
- Store it in `/etc/letsencrypt/live/api.cooksmartapp.com/`

### Expected output:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api.cooksmartapp.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/api.cooksmartapp.com/privkey.pem
```

---

## Step 4: Configure nginx (10 minutes)

### Create nginx configuration:
```bash
sudo nano /etc/nginx/conf.d/cooksmartapp.conf
```

### Paste this configuration:
```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name api.cooksmartapp.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS - Main configuration
server {
    listen 443 ssl http2;
    server_name api.cooksmartapp.com;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/api.cooksmartapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.cooksmartapp.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Stripe webhook endpoint (no timeout)
    location /api/webhooks/stripe {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # No timeout for webhooks
        proxy_read_timeout 300s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/cooksmartapp_access.log;
    error_log /var/log/nginx/cooksmartapp_error.log;
}
```

### Save and exit:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Test nginx configuration:
```bash
sudo nginx -t
```

Should say: "syntax is ok" and "test is successful"

### Start nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Restart your Node.js app:
```bash
pm2 start all
# or
cd /path/to/backend
npm start
```

---

## Step 5: Update EC2 Security Group (5 minutes)

### Go to EC2 Console:
https://console.aws.amazon.com/ec2/

### Find your instance:
- Click "Instances"
- Find your Cook Smart instance

### Edit Security Group:
1. Click on the instance
2. Click "Security" tab
3. Click on the security group link
4. Click "Edit inbound rules"
5. Add these rules if not present:

| Type  | Protocol | Port | Source    | Description |
|-------|----------|------|-----------|-------------|
| HTTP  | TCP      | 80   | 0.0.0.0/0 | HTTP        |
| HTTPS | TCP      | 443  | 0.0.0.0/0 | HTTPS       |
| Custom| TCP      | 3000 | 0.0.0.0/0 | Node.js     |

6. Click "Save rules"

---

## Step 6: Test HTTPS (2 minutes)

### From your local machine:
```bash
# Test HTTPS endpoint
curl https://api.cooksmartapp.com/health

# Should return your health check response
```

### Test in browser:
Open: https://api.cooksmartapp.com/health

Should show your API response with a green padlock 🔒

---

## Step 7: Set Up Stripe Webhook (5 minutes)

Now that you have HTTPS, let's create the webhook!

### Go to Stripe Dashboard:
https://dashboard.stripe.com/webhooks

Make sure you're in **LIVE mode**.

### Add Endpoint:
1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://api.cooksmartapp.com/api/webhooks/stripe`
3. **Description:** `Cook Smart Payment Webhooks`
4. Click **"Select events"**
5. Choose these events:
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

### Update .env on EC2:
```bash
# Still in SSH session
cd /path/to/backend
nano .env

# Update this line:
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
pm2 restart all
```

---

## Step 8: Test Webhook (2 minutes)

### In Stripe Dashboard:
1. Go to your webhook
2. Click **"Send test webhook"**
3. Select `customer.subscription.created`
4. Click **"Send test webhook"**

### Check if it worked:
- Should show "200 OK" in Stripe
- Check your backend logs: `pm2 logs`
- Should see: "Processing Stripe webhook: customer.subscription.created"

---

## ✅ Done! HTTPS is Live!

Your setup is now:
- ✅ HTTPS enabled with free SSL certificate
- ✅ Domain: `https://api.cooksmartapp.com`
- ✅ nginx reverse proxy configured
- ✅ Stripe webhook ready
- ✅ Production ready!

---

## 🔄 SSL Certificate Auto-Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Set up auto-renewal (runs twice daily)
sudo crontab -e

# Add this line:
0 0,12 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

---

## 🧪 Ready to Test Payments!

Now you can:
1. Test payments with LIVE mode
2. Webhooks will work automatically
3. All subscription events tracked
4. Production ready!

Want to start testing now?

