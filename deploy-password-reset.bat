@echo off
echo ========================================
echo Cook Smart - Deploy Password Reset Feature
echo ========================================
echo.

echo Step 1: Checking backend directory...
if not exist "backend" (
    echo ERROR: backend directory not found!
    pause
    exit /b 1
)

echo Step 2: Installing dependencies...
cd backend
call npm install resend
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    cd ..
    pause
    exit /b 1
)

echo.
echo Step 3: Building backend...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo Step 4: Connecting to EC2 and deploying...
echo.
echo IMPORTANT: Make sure you have:
echo 1. RESEND_API_KEY in your production .env
echo 2. EMAIL_FROM in your production .env
echo.

set /p CONTINUE="Continue with deployment? (y/n): "
if /i not "%CONTINUE%"=="y" (
    echo Deployment cancelled.
    pause
    exit /b 0
)

echo.
echo Deploying to production server...
scp -i "C:\Users\YourUser\.ssh\cook-smart-key.pem" -r backend/dist/* ec2-user@api.cooksmartapp.com:/home/ec2-user/cook-smart-backend/dist/

echo.
echo Step 5: Running database migration...
echo Creating password_reset_tokens table...

ssh -i "C:\Users\YourUser\.ssh\cook-smart-key.pem" ec2-user@api.cooksmartapp.com "cd /home/ec2-user/cook-smart-backend && PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f migrations/create-password-reset-tokens-table.sql"

echo.
echo Step 6: Restarting backend service...
ssh -i "C:\Users\YourUser\.ssh\cook-smart-key.pem" ec2-user@api.cooksmartapp.com "pm2 restart cook-smart-backend"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Password reset feature is now LIVE!
echo.
echo Test it:
echo 1. Open Cook Smart app
echo 2. Tap "Forgot Password?"
echo 3. Enter your email
echo 4. Check email for reset code
echo.
pause

