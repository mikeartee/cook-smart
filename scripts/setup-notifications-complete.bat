@echo off
echo ========================================
echo  Complete Notification System Setup
echo ========================================
echo.
echo This will:
echo   1. Deploy Firebase backend changes
echo   2. Build new APK with Firebase support
echo   3. Provide testing instructions
echo.
echo Prerequisites:
echo   - Firebase service account key downloaded
echo   - SSH access to server working
echo.
set /p CONTINUE="Ready to proceed? (y/n): "

if /i not "%CONTINUE%"=="y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ========================================
echo  PHASE 1: Backend Deployment
echo ========================================
echo.

call scripts\deploy-firebase-notifications.bat

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Backend deployment failed!
    echo Please fix the issues and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  PHASE 2: Build APK with Firebase
echo ========================================
echo.
echo Building new APK with Firebase Cloud Messaging support...
echo.

call scripts\build-apk.bat

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: APK build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Backend: Firebase notifications deployed
echo APK: android\app\build\outputs\apk\release\app-release.apk
echo.
echo ========================================
echo  Testing Instructions
echo ========================================
echo.
echo 1. Transfer APK to your phone:
echo    - Connect phone via USB
echo    - Copy: android\app\build\outputs\apk\release\app-release.apk
echo    - Or use: adb install android\app\build\outputs\apk\release\app-release.apk
echo.
echo 2. Install and open the app
echo.
echo 3. Go to: Settings - Notifications
echo.
echo 4. Click "Enable Notifications"
echo.
echo 5. Grant permission when prompted
echo.
echo 6. Verify status shows "Enabled"
echo.
echo 7. Check server logs for token registration:
echo    ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend --lines 50"
echo.
echo    Look for: "Registered FCM token for user X"
echo.
echo ========================================
echo  Troubleshooting
echo ========================================
echo.
echo If notifications don't enable:
echo   - Check phone Settings - Apps - Cook Smart - Notifications
echo   - Manually enable if needed
echo   - Return to app and click "Refresh Status"
echo.
echo If token not registered:
echo   - Check backend logs for errors
echo   - Verify Firebase service account key is valid
echo   - Check .env has FIREBASE_SERVICE_ACCOUNT_PATH
echo.
echo Backend logs:
echo   ssh -i "c:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.237.38.24 "pm2 logs cook-smart-backend"
echo.
pause

