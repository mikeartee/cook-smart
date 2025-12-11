@echo off
echo ========================================
echo Cook Smart Backend Deployment Script
echo ========================================
echo.

echo Step 1: Building backend locally...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)
echo ✅ Build successful!
echo.

echo Step 2: Connecting to EC2 server...
echo You need to run these commands manually on the EC2 server:
echo.
echo ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150
echo.
echo Then run these commands on the server:
echo.
echo cd /home/ubuntu/cook-smart/backend/backend
echo git pull origin fresh-project-migration
echo npm install
echo npm run build
echo pm2 restart cook-smart-backend
echo pm2 logs cook-smart-backend --lines 20
echo.
echo ========================================
echo Manual Deployment Instructions:
echo ========================================
echo 1. SSH into the server using the command above
echo 2. Navigate to the backend directory
echo 3. Pull the latest changes from GitHub
echo 4. Install dependencies and build
echo 5. Restart the PM2 process
echo 6. Check logs to verify it's working
echo.
pause