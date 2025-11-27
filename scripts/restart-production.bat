@echo off
echo ========================================
echo Restarting Production Server
echo ========================================
echo.

REM You need to run this command manually with your SSH key:
echo Please run this command in a separate terminal:
echo.
echo ssh -i "path\to\your-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart-backend && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 50"
echo.
echo Replace "path\to\your-key.pem" with your actual SSH key path
echo.
pause
