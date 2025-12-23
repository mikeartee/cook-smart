@echo off
echo ========================================
echo Deploying Backend to Cook Smart Server
echo ========================================
echo.

echo Connecting to backend server: 34.203.8.150
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && git pull origin fresh-project-migration && npm install && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 20"

echo.
echo ========================================
echo Backend Deployment Complete!
echo ========================================
pause