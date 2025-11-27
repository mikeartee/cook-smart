# Webhook Setup - The HTTPS Problem

## 🚨 The Issue

Stripe LIVE mode requires **HTTPS** for webhooks, but your backend is:
- Running on EC2 at: `http://3.237.38.24:3000` (HTTP only)
- You have domain: `cooksmartapp.com` (registered)
- But no HTTPS/SSL certificate configured yet

## 💡 Solutions (Pick One)

### Option 1: Use Stripe CLI for Testing (FASTEST - 2 minutes)
**Best for:** Testing payments right now without HTTPS setup

```bash
# Install Stripe CLI
scoop install stripe

# Login
stripe login

# Forward webhooks to your local/EC2 backend
stripe listen --forward-to http://3.237.38.24:3000/api/webhooks/stripe

# This gives you a webhook secret like: whsec_xxxxx
# Add it to backend/.env
```

**Pros:**
- Works immediately
- No HTTPS needed
- Perfect for testing

**Cons:**
- Must keep CLI running
- Not for production

---

### Option 2: Set Up HTTPS with Let's Encrypt (30 minutes)
**Best for:** Production-ready setup

#### Step 1: Point domain to EC2
1. Go to Route 53
2. Create A record: `api.cooksmartapp.com` → `3.237.38.24`

#### Step 2: Install Certbot on EC2
```bash
ssh -i ~/.ssh/cook-smart-key.pem ec2-user@3.237.38.24

# Install certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot certonly --standalone -d api.cooksmartapp.com
```

#### Step 3: Configure nginx as reverse proxy
```bash
sudo yum install nginx -y

# Configure nginx to proxy to your Node.js app
# (I can provide the config)
```

#### Step 4: Set up webhook with HTTPS URL
```
https://api.cooksmartapp.com/api/webhooks/stripe
```

**Pros:**
- Production ready
- Free SSL certificate
- Professional setup

**Cons:**
- Takes 30 minutes
- Requires DNS configuration

---

### Option 3: Use ngrok (5 minutes)
**Best for:** Quick HTTPS testing without domain setup

```bash
# Install ngrok
scoop install ngrok

# Create tunnel to EC2
ngrok http 3.237.38.24:3000

# This gives you: https://xxxx.ngrok.io
# Use: https://xxxx.ngrok.io/api/webhooks/stripe
```

**Pros:**
- Instant HTTPS
- Works with LIVE mode
- Easy to set up

**Cons:**
- URL changes each time
- Not for production
- Free tier has limits

---

### Option 4: Switch to TEST Mode (5 minutes)
**Best for:** Safe testing without HTTPS hassle

1. Get TEST mode keys from Stripe
2. Create products in TEST mode
3. Use HTTP webhook (TEST mode allows it)
4. Test with test cards
5. Switch to LIVE when ready

**Pros:**
- No HTTPS needed
- Safe testing
- No real money

**Cons:**
- Need to recreate products
- Need to switch keys

---

## 🎯 My Recommendation

**For Right Now:**
Use **Option 1 (Stripe CLI)** or **Option 4 (TEST mode)**

**For Production:**
Set up **Option 2 (HTTPS with Let's Encrypt)**

## 🚀 Let's Start Testing

Which option do you want to use?

1. **Stripe CLI** - I'll guide you through installation
2. **TEST mode** - I'll set it up for you
3. **HTTPS setup** - I'll help configure nginx + SSL
4. **ngrok** - I'll help set up the tunnel

Let me know and I'll get you testing payments in minutes!

