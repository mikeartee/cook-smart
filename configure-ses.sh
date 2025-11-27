#!/bin/bash
# Quick SES Configuration Script

echo "========================================="
echo "AWS SES Email Configuration"
echo "========================================="
echo ""

echo "Before running this script, make sure you have:"
echo "1. Verified your email in AWS SES Console"
echo "2. Created SMTP credentials"
echo ""

read -p "Have you completed these steps? (y/n): " READY
if [ "$READY" != "y" ]; then
    echo "Please complete AWS SES setup first. See SETUP_AWS_SES_EMAIL.md"
    exit 1
fi

echo ""
echo "Enter your AWS SES configuration:"
echo ""

read -p "AWS SES Region (e.g., us-east-1): " SES_REGION
read -p "SMTP Username (starts with AKIA...): " SES_ACCESS_KEY
read -sp "SMTP Password: " SES_SECRET_KEY
echo ""
read -p "From Email (default: services.cooksmart@gmail.com): " EMAIL_FROM
EMAIL_FROM=${EMAIL_FROM:-services.cooksmart@gmail.com}

echo ""
echo "Configuration:"
echo "Region: $SES_REGION"
echo "Username: $SES_ACCESS_KEY"
echo "From: $EMAIL_FROM"
echo ""

read -p "Add these to EC2 .env file? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

# SSH into EC2 and update .env
ssh -i ~/.ssh/cook-smart-key.pem ubuntu@3.237.38.24 << EOF
cd cook-smart-backend

# Backup current .env
cp .env .env.backup

# Add SES configuration
echo "" >> .env
echo "# AWS SES Email Configuration" >> .env
echo "AWS_SES_REGION=$SES_REGION" >> .env
echo "AWS_SES_ACCESS_KEY=$SES_ACCESS_KEY" >> .env
echo "AWS_SES_SECRET_KEY=$SES_SECRET_KEY" >> .env
echo "EMAIL_FROM=$EMAIL_FROM" >> .env

echo "✅ Configuration added to .env"

# Restart backend
pm2 restart cook-smart-backend

echo "✅ Backend restarted"

# Show logs
pm2 logs cook-smart-backend --lines 10 --nostream | grep -i email

EOF

echo ""
echo "========================================="
echo "✅ AWS SES Configured!"
echo "========================================="
echo ""
echo "Test it by:"
echo "1. Open Cook Smart app"
echo "2. Tap 'Forgot Password?'"
echo "3. Enter email address"
echo "4. Check email for reset code"
echo ""
