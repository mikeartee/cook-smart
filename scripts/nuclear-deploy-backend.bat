@echo off
echo ========================================
echo Nuclear Backend Deployment (Full Reset)
echo ========================================
echo.

echo WARNING: This will reset ALL changes on the server!
pause

echo Connecting to backend server: 34.203.8.150
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && git reset --hard HEAD && git clean -fdx && git pull origin fresh-project-migration && npm install && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 15"

echo.
echo ========================================
echo Nuclear Backend Deployment Complete!
echo ========================================
pause