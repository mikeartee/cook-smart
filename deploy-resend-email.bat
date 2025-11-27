@echo off
echo ========================================
echo Deploying Resend Email Service
echo ========================================
echo.

echo Step 1: Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Backing up old EmailService...
scp -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24:/home/ubuntu/cook-smart-backend/dist/services/EmailService.js backend/EmailService.backup.js

echo.
echo Step 3: Copying new EmailService to server...
scp -i "C:\Users\toota\.ssh\cook-smart-key.pem" backend/src/services/EmailService.resend.ts ubuntu@3.237.38.24:/home/ubuntu/cook-smart-backend/src/services/EmailService.ts

echo.
echo Step 4: Rebuilding on server...
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart-backend && npm run build"

echo.
echo Step 5: Updating environment variables...
echo You need to add RESEND_API_KEY to the server .env file
echo Run this command manually:
echo ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "nano /home/ubuntu/cook-smart-backend/.env"
echo.
echo Add this line:
echo RESEND_API_KEY=your_api_key_here
echo.
pause

echo.
echo Step 6: Restarting backend...
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 restart cook-smart-backend"

echo.
echo Step 7: Checking service status...
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 10 --nostream"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
pause
