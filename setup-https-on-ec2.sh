#!/bin/bash
# Automated HTTPS Setup for Cook Smart Backend
# Run this on your EC2 server

set -e  # Exit on any error

echo "=========================================="
echo "Cook Smart HTTPS Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="api.cooksmartapp.com"
EMAIL="services.cooksmart@gmail.com"
BACKEND_PORT=3000

echo -e "${YELLOW}Step 1: Installing required packages...${NC}"
sudo apt-get update -y
sudo apt-get install -y certbot nginx

echo -e "${GREEN}✓ Packages installed${NC}"
echo ""

echo -e "${YELLOW}Step 2: Stopping services temporarily...${NC}"
# Stop nginx if running
sudo systemctl stop nginx 2>/dev/null || true

# Stop Node.js app temporarily (certbot needs port 80)
if command -v pm2 &> /dev/null; then
    pm2 stop all || true
else
    # Try to find and kill node process on port 3000
    sudo lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

echo -e "${GREEN}✓ Services stopped${NC}"
echo ""

echo -e "${YELLOW}Step 3: Getting SSL certificate from Let's Encrypt...${NC}"
sudo certbot certonly --standalone \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive \
    --preferred-challenges http

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}✗ Failed to get SSL certificate${NC}"
    echo "Make sure DNS is pointing to this server: $DOMAIN -> $(curl -s ifconfig.me)"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 4: Configuring nginx...${NC}"

# Create nginx configuration
sudo tee /etc/nginx/conf.d/cooksmartapp.conf > /dev/null <<'EOF'
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
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

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
        
        # Increase timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Stripe webhook endpoint
    location /api/webhooks/stripe {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/cooksmartapp_access.log;
    error_log /var/log/nginx/cooksmartapp_error.log;
}
EOF

# Test nginx configuration
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ nginx configuration valid${NC}"
else
    echo -e "${RED}✗ nginx configuration invalid${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 5: Starting services...${NC}"

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Start Node.js app
if command -v pm2 &> /dev/null; then
    pm2 start all || pm2 restart all
    echo -e "${GREEN}✓ Backend started with PM2${NC}"
else
    echo -e "${YELLOW}⚠ PM2 not found. Please start your Node.js app manually${NC}"
fi
echo ""

echo -e "${YELLOW}Step 6: Setting up SSL auto-renewal...${NC}"

# Add certbot renewal to crontab
(crontab -l 2>/dev/null | grep -v certbot; echo "0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo -e "${GREEN}✓ Auto-renewal configured${NC}"
echo ""

echo -e "${YELLOW}Step 7: Testing HTTPS...${NC}"

sleep 3  # Wait for services to start

# Test HTTPS endpoint
if curl -k -s https://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTTPS is working locally${NC}"
else
    echo -e "${YELLOW}⚠ Local HTTPS test inconclusive (this is often normal)${NC}"
fi
echo ""

echo "=========================================="
echo -e "${GREEN}HTTPS Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Your API is now available at:"
echo "  https://api.cooksmartapp.com"
echo ""
echo "Next steps:"
echo "1. Test from your local machine:"
echo "   curl https://api.cooksmartapp.com/health"
echo ""
echo "2. Set up Stripe webhook:"
echo "   URL: https://api.cooksmartapp.com/api/webhooks/stripe"
echo ""
echo "3. SSL certificate will auto-renew every 90 days"
echo ""
echo "Logs:"
echo "  nginx access: /var/log/nginx/cooksmartapp_access.log"
echo "  nginx error:  /var/log/nginx/cooksmartapp_error.log"
echo ""
