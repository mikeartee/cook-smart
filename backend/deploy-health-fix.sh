#!/bin/bash

# Deploy health monitor fix to production

echo "🚀 Deploying health monitor fix..."

# Copy built files to production
scp -r dist/* ubuntu@54.82.17.206:/home/ubuntu/cook-smart-backend/dist/

# Restart PM2
ssh ubuntu@54.82.17.206 "cd /home/ubuntu/cook-smart-backend && pm2 restart cook-smart-api"

echo "✅ Deployment complete!"
