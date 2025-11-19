# Cook Smart - Deployment Status

## ✅ COMPLETED TODAY

### 1. Stripe Configuration (LIVE Mode)
- ✅ Stripe LIVE keys configured
- ✅ Products created in Stripe:
  - Yearly: $24.99 (promo) → $34.99 (renewal)
  - Monthly: $6.99/month
  - Weekly: $2.99/week
- ✅ Product IDs stored in database

### 2. Database Setup
- ✅ All migrations completed
- ✅ Subscription tables created
- ✅ Product data seeded

### 3. AWS EC2 Server
- ✅ EC2 instance launched (t3.small)
- ✅ Instance ID: i-05e0746da4f5f9da0
- ✅ Public IP: **3.237.38.24**
- ✅ Security groups configured (ports 22, 80, 443, 3000)
- ✅ SSH key created: cook-smart-key.pem

### 4. Code Ready
- ✅ All backend code complete
- ✅ Subscription pricing system implemented
- ✅ Mobile app screens created
- ✅ All code committed to git (main branch)
- ✅ Tagged as v1.1.0-beta

---

## ⏳ REMAINING TASKS

### Option A: Complete EC2 Deployment (30 minutes)

The EC2 server is running but the backend isn't deployed yet due to script line-ending issues.

**Manual Deployment Steps:**

1. **Connect to EC2 via AWS Console:**
   - Go to EC2 Console → Instances
   - Select your instance (i-05e0746da4f5f9da0)
   - Click "Connect" → "Session Manager" or "EC2 Instance Connect"
   - This opens a browser-based terminal

2. **Run these commands in the EC2 terminal:**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and other tools
sudo npm install -g pm2
sudo apt install -y git nginx

# Clone your repository (you'll need to make it public temporarily or use a deploy key)
git clone https://github.com/tootallgames2020/cook-smart.git
cd cook-smart/backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://cooksmartadmin:CookSmart2024!@cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com:5432/cooksmartdb
JWT_SECRET=cook_smart_jwt_secret_2024_very_long_and_secure_key_for_production
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SRkHlKSbJqCZWWDLbbUxcsh5Nd2nrQOpuuCnJ5U8RdDVNKAdL954YDcfREHkooJaOPyR0guknOo1coRO0c8BnpZ0004oWidmO
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
PORT=3000
NODE_ENV=production
EOF

# Install dependencies and build
npm install --production
npm run build

# Start with PM2
pm2 start dist/server.js --name cook-smart-backend
pm2 save
pm2 startup

# Configure Nginx
sudo tee /etc/nginx/sites-available/cook-smart > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/cook-smart /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Test
curl http://localhost:3000/api/health
```

3. **Test from your computer:**
```
http://3.237.38.24/api/health
```

---

### Option B: Use Alternative Deployment (Easier)

Consider using a Platform-as-a-Service that handles deployment automatically:

1. **Railway.app** (Recommended - Free tier available)
   - Connect GitHub repo
   - Auto-deploys on push
   - Provides HTTPS URL automatically
   - Cost: ~$5/month after free tier

2. **Render.com** (Also good)
   - Similar to Railway
   - Free tier available
   - Easy setup

3. **Heroku** (Classic choice)
   - Well-documented
   - Free tier removed, starts at $7/month

---

## 🔧 AFTER BACKEND IS LIVE

### 1. Configure Stripe Webhook
- Go to Stripe Dashboard → Developers → Webhooks
- Add endpoint: `http://YOUR_SERVER_IP/api/webhooks/stripe`
- Select events: `customer.subscription.*`, `invoice.*`
- Copy webhook secret
- Add to `.env` as `STRIPE_WEBHOOK_SECRET`
- Restart backend

### 2. Update Mobile App
In `src/config/api.ts`:
```typescript
export const API_URL = 'http://3.237.38.24'; // or your domain
```

### 3. Test Everything
```bash
# Test health
curl http://3.237.38.24/api/health

# Test subscription phase
curl http://3.237.38.24/api/v1/subscriptions/phase

# Test plans
curl http://3.237.38.24/api/v1/subscriptions/plans
```

---

## 📊 SUMMARY

**What's Working:**
- ✅ Stripe products configured in LIVE mode
- ✅ Database ready with all tables
- ✅ EC2 server running
- ✅ All code complete and in git

**What's Needed:**
- ⏳ Deploy backend code to EC2 (or alternative platform)
- ⏳ Configure Stripe webhook
- ⏳ Update mobile app API URL
- ⏳ Test end-to-end

**Estimated Time to Complete:** 30-45 minutes

---

## 🆘 NEED HELP?

If you want to continue:
1. Use AWS Console "Connect" feature (easiest)
2. Or consider Railway/Render for simpler deployment
3. Or we can troubleshoot the PowerShell scripts further

Your subscription system is 95% complete - just needs the backend deployed!

---

## 📝 IMPORTANT CREDENTIALS

**EC2 Server:**
- IP: 3.237.38.24
- Key: C:\Users\toota\.ssh\cook-smart-key.pem
- User: ubuntu

**Stripe:**
- Mode: LIVE
- Secret: sk_live_51SRkHlKSbJqCZWWD...
- Publishable: pk_live_51SRkHlKSbJqCZWWD...

**Database:**
- Host: cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com
- Database: cooksmartdb
- User: cooksmartadmin

All sensitive credentials are in `backend/.env`
