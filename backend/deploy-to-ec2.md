# Deploy Cook Smart Backend to AWS EC2

## Prerequisites
- AWS Account
- EC2 instance running (Ubuntu 22.04 recommended)
- SSH access to EC2 instance
- Domain name (optional but recommended)

## Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. **Name**: cook-smart-backend
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance type**: t3.small (2 vCPU, 2GB RAM) - ~$15/month
5. **Key pair**: Create new or use existing
6. **Security Group**: 
   - SSH (22) - Your IP only
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
   - Custom TCP (3000) - Anywhere (for Node.js)
7. **Storage**: 20 GB gp3
8. Click "Launch Instance"

## Step 2: Connect to EC2

```bash
# Download your .pem key file
# Set permissions
chmod 400 your-key.pem

# Connect
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 3: Install Node.js and Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
pm2 --version
```

## Step 4: Clone Your Repository

```bash
# Clone your repo
git clone https://github.com/tootallgames2020/cook-smart.git
cd cook-smart/backend

# Install dependencies
npm install --production
```

## Step 5: Set Up Environment Variables

```bash
# Create .env file
nano .env
```

Paste your production environment variables (from your local backend/.env):
```env
# Database Configuration
DATABASE_URL=postgresql://cooksmartadmin:CookSmart2024!@cook-smart-db-beta.cgfwigy2i9lk.us-east-1.rds.amazonaws.com:5432/cooksmartdb

# JWT Configuration
JWT_SECRET=cook_smart_jwt_secret_2024_very_long_and_secure_key_for_production

# Stripe Configuration (LIVE)
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SRkHlKSbJqCZWWDLbbUxcsh5Nd2nrQOpuuCnJ5U8RdDVNKAdL954YDcfREHkooJaOPyR0guknOo1coRO0c8BnpZ0004oWidmO

# Discord Webhooks
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD
DISCORD_ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD

# Server Configuration
PORT=3000
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

## Step 6: Build and Start Backend

```bash
# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name cook-smart-backend

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

## Step 7: Configure Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cook-smart
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/cook-smart /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
```

## Step 9: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Step 10: Verify Deployment

```bash
# Check if backend is running
pm2 status

# Check logs
pm2 logs cook-smart-backend

# Test API
curl http://localhost:3000/api/health
```

From your local machine:
```bash
# Test public endpoint (replace with your EC2 IP or domain)
curl http://your-ec2-ip/api/health
curl http://your-ec2-ip/api/v1/subscriptions/phase
```

## Step 11: Update Mobile App

Update your mobile app's API URL to point to your EC2 instance:

In `src/config/api.ts`:
```typescript
export const API_URL = 'http://your-ec2-ip-or-domain.com';
// or with domain:
export const API_URL = 'https://api.cooksmartapp.com';
```

## Step 12: Configure Stripe Webhook

Now that your backend is live, configure the Stripe webhook:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `http://your-ec2-ip/api/webhooks/stripe` (or `https://your-domain.com/api/webhooks/stripe`)
4. **Events to send**:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Click "Add endpoint"
6. Copy the **Signing secret** (starts with `whsec_...`)

Add to your `.env` on EC2:
```bash
nano .env
# Add this line:
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

Restart backend:
```bash
pm2 restart cook-smart-backend
```

## Maintenance Commands

```bash
# View logs
pm2 logs cook-smart-backend

# Restart backend
pm2 restart cook-smart-backend

# Stop backend
pm2 stop cook-smart-backend

# Update code
cd ~/cook-smart
git pull origin main
cd backend
npm install --production
npm run build
pm2 restart cook-smart-backend

# Monitor resources
pm2 monit
```

## Cost Breakdown

- **EC2 t3.small**: ~$15/month
- **Data transfer**: ~$1-2/month
- **Total**: ~$16-17/month (well within $20 budget)

## Troubleshooting

### Backend won't start
```bash
pm2 logs cook-smart-backend --lines 100
```

### Can't connect to database
- Check RDS security group allows EC2 IP
- Verify DATABASE_URL is correct

### Nginx errors
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Port 3000 not accessible
- Check EC2 security group allows port 3000
- Check if backend is running: `pm2 status`

## Success Checklist

- [ ] EC2 instance running
- [ ] Node.js and PM2 installed
- [ ] Code cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Backend built and running with PM2
- [ ] Nginx configured as reverse proxy
- [ ] SSL certificate installed (optional)
- [ ] Firewall configured
- [ ] API endpoints accessible
- [ ] Stripe webhook configured
- [ ] Mobile app updated with production API URL

---

Your backend is now live and ready for production! 🚀
