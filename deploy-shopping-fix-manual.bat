@echo off
REM Manual Deploy - Copy files directly to EC2
echo ========================================
echo Manual Deployment - Shopping List Fix
echo ========================================
echo.

echo This will:
echo 1. Copy updated backend files to EC2
echo 2. Rebuild backend on EC2
echo 3. Restart the server
echo.

set /p CONFIRM="Continue? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled.
    exit /b 0
)

echo.
echo Step 1: Copying backend files to EC2...
scp -i "%USERPROFILE%\.ssh\cook-smart-key.pem" backend/src/routes/shopping.ts ubuntu@3.237.38.24:~/cook-smart-backend/src/routes/
scp -i "%USERPROFILE%\.ssh\cook-smart-key.pem" backend/src/models/ShoppingList.ts ubuntu@3.237.38.24:~/cook-smart-backend/src/models/

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to copy files
    pause
    exit /b 1
)

echo [SUCCESS] Files copied
echo.

echo Step 2: Rebuilding and restarting backend on EC2...
ssh -i "%USERPROFILE%\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd cook-smart-backend && npm run build && pm2 restart cook-smart-backend"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Deployment Complete!
    echo ========================================
    echo.
    echo Checking server status...
    ssh -i "%USERPROFILE%\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 10"
    echo.
    echo The shopping list toggle fix is now live!
    echo Test it in the app by tapping a checkbox.
    echo.
) else (
    echo.
    echo ========================================
    echo [ERROR] Deployment Failed
    echo ========================================
    echo.
)

pause
