@echo off
echo ========================================
echo Deploying Notifications + Achievements
echo ========================================
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart-backend && git pull origin fresh-project-migration && npm install --legacy-peer-deps && node run-notifications-migration.js && npm run build && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 30"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
