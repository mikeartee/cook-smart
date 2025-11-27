@echo off
REM Quick Deploy - Shopping List Toggle Fix to EC2
echo ========================================
echo Deploying Shopping List Fix to EC2
echo ========================================
echo.

echo This will:
echo 1. SSH into EC2 server (3.237.38.24)
echo 2. Pull latest code from git
echo 3. Rebuild backend
echo 4. Restart the server
echo.

set /p CONFIRM="Continue? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Step 1: Checking if you have SSH key...
if not exist "%USERPROFILE%\.ssh\cook-smart-key.pem" (
    echo [ERROR] SSH key not found at %USERPROFILE%\.ssh\cook-smart-key.pem
    echo.
    echo Please make sure you have the EC2 SSH key file.
    echo Expected location: %USERPROFILE%\.ssh\cook-smart-key.pem
    pause
    exit /b 1
)

echo [SUCCESS] SSH key found
echo.

echo Step 2: Connecting to EC2 and deploying...
echo.

REM SSH into EC2 and run deployment commands
ssh -i "%USERPROFILE%\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd cook-smart && git pull origin main && cd backend && npm install --production && npm run build && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 20"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Deployment Complete!
    echo ========================================
    echo.
    echo The shopping list toggle fix is now live.
    echo Test it in the app by tapping a checkbox.
    echo.
) else (
    echo.
    echo ========================================
    echo [ERROR] Deployment Failed
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo You may need to manually SSH into the server.
    echo.
)

pause
