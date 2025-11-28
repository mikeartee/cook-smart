@echo off
echo ========================================
echo Deploying Token Expiration Fix
echo ========================================
echo.
echo Changes:
echo - Extended JWT token expiration from 7 days to 90 days
echo - Added frontend session expiration handling
echo.

ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend && git pull origin fresh-project-migration && npm install --legacy-peer-deps && npm run build && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 30"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Note: Existing users will need to log out and back in
echo to get a new 90-day token.
echo.

