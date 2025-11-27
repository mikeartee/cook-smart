#!/bin/bash
echo "🔔 Deploying Notifications + Achievements..."
echo ""

cd /home/ubuntu/cook-smart-backend

echo "1. Pulling latest code..."
git pull origin fresh-project-migration

echo ""
echo "2. Installing dependencies..."
npm install --legacy-peer-deps

echo ""
echo "3. Running database migration..."
node run-notifications-migration.js

echo ""
echo "4. Building TypeScript..."
npm run build

echo ""
echo "5. Restarting server..."
pm2 restart cook-smart-backend

echo ""
echo "6. Checking logs..."
pm2 logs cook-smart-backend --lines 30

echo ""
echo "✅ Deployment complete!"
echo "🔔 Daily notifications will run at 9 AM"
echo "🏆 Achievement system is active"
