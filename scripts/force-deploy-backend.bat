@echo off
echo ========================================
echo Force Deploying Backend (Clean Pull)
echo ========================================
echo.

echo Connecting to backend server: 34.203.8.150
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && git stash && git clean -fd && git pull origin fresh-project-migration && npm install && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 10"

echo.
echo ========================================
echo Force Backend Deployment Complete!
echo ========================================
pause