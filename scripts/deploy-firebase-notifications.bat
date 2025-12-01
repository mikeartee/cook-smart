@echo off
echo ========================================
echo  Deploy Firebase Notifications System
echo ========================================
echo.

REM Step 1: Install firebase-admin on server
echo Step 1: Installing firebase-admin...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend && npm install firebase-admin"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install firebase-admin
    pause
    exit /b 1
)

echo.
echo ========================================
echo  IMPORTANT: Firebase Service Account
echo ========================================
echo.
echo Before continuing, you need to:
echo 1. Go to Firebase Console: https://console.firebase.google.com/
echo 2. Select project: cook-smart-97568
echo 3. Click gear icon - Project Settings
echo 4. Go to Service Accounts tab
echo 5. Click "Generate New Private Key"
echo 6. Save as: firebase-service-account.json
echo.
echo Then upload it with this command:
echo scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" firebase-service-account.json ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/config/
echo.
set /p CONTINUE="Have you uploaded the service account key? (y/n): "

if /i not "%CONTINUE%"=="y" (
    echo.
    echo Deployment cancelled. Please upload the key and run this script again.
    pause
    exit /b 0
)

echo.
echo Step 2: Uploading new notification service...
scp -i "c:\Users\toota\.ssh\cook-smart-key.pem" backend\src\services\PushNotificationService.firebase.ts ubuntu@3.237.38.24:/home/ubuntu/cook-smart/backend/src/services/

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to upload notification service
    pause
    exit /b 1
)

echo.
echo Step 3: Replacing notification service on server...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend/src/services && mv PushNotificationService.ts PushNotificationService.old.ts && mv PushNotificationService.firebase.ts PushNotificationService.ts"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to replace notification service
    pause
    exit /b 1
)

echo.
echo Step 4: Adding environment variable...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "grep -q FIREBASE_SERVICE_ACCOUNT_PATH /home/ubuntu/cook-smart/backend/.env || echo 'FIREBASE_SERVICE_ACCOUNT_PATH=/home/ubuntu/cook-smart/backend/config/firebase-service-account.json' >> /home/ubuntu/cook-smart/backend/.env"

echo.
echo Step 5: Building backend...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "cd /home/ubuntu/cook-smart/backend && npm run build"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Step 6: Restarting backend...
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 restart cook-smart-backend"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to restart backend
    pause
    exit /b 1
)

echo.
echo Step 7: Checking logs...
timeout /t 3 /nobreak >nul
ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 30 --nostream"

echo.
echo ========================================
echo  Backend Deployment Complete!
echo ========================================
echo.
echo Look for: "Firebase Admin SDK initialized" in the logs above
echo.
echo Next: Build new APK with Firebase support
echo   Run: scripts\build-apk.bat
echo.
pause

