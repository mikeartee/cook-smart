@echo off
echo ========================================
echo Clean Backend Deployment
echo ========================================
echo.

echo Removing website folder from backend server...
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "cd /home/ubuntu/cook-smart/backend/backend && rm -rf website && git reset --hard HEAD && git pull origin fresh-project-migration && npm install && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 15"

echo.
echo ========================================
echo Clean Backend Deployment Complete!
echo ========================================
pause