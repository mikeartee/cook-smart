@echo off
echo ========================================
echo Checking Backend Status
echo ========================================
echo.

echo 1. Testing API health...
curl -s https://api.cooksmartapp.com/health
echo.
echo.

echo 2. Checking PM2 status on server...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "pm2 status"
echo.

echo 3. Recent backend logs...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@34.203.8.150 "pm2 logs cook-smart-backend --lines 10"

echo.
echo ========================================
echo Status Check Complete!
echo ========================================
pause