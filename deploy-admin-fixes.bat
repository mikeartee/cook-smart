@echo off
echo ========================================
echo Deploying Admin Dashboard Fixes to EC2
echo ========================================
echo.

REM Step 1: Commit changes
echo Step 1: Committing changes to git...
git add .
git commit -m "Admin dashboard fixes - updated middleware and added screens"
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Nothing to commit or commit failed
)
echo.

REM Step 2: Push to repository
echo Step 2: Pushing to repository...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git push failed
    pause
    exit /b 1
)
echo [SUCCESS] Code pushed to repository
echo.

REM Step 3: Deploy to EC2
echo Step 3: Deploying to EC2...
echo Connecting to ubuntu@3.237.38.24...
echo.

ssh -i "%USERPROFILE%\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd ~/cook-smart-backend && git pull origin main && npm install --legacy-peer-deps && pm2 restart cook-smart-backend && pm2 logs cook-smart-backend --lines 20"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Deployment complete!
    echo.
    echo Backend restarted on EC2
    echo Testing endpoint...
    curl http://3.237.38.24:3000/health
    echo.
    echo ========================================
    echo DEPLOYMENT SUCCESSFUL
    echo ========================================
    echo.
    echo Your admin dashboard should now work!
    echo Try logging out and back in to the app.
) else (
    echo.
    echo [ERROR] Deployment failed
    echo Check the error messages above
)

echo.
pause
