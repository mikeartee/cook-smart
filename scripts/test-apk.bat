@echo off
echo ========================================
echo Cook Smart - APK Testing
echo ========================================
echo.

set APK_PATH=android\app\build\outputs\apk\release\app-release.apk

echo 🔍 Checking if APK exists...
if not exist "%APK_PATH%" (
    echo ❌ APK not found at: %APK_PATH%
    echo 🔨 Run build-apk-clean.bat first to build the APK
    pause
    exit /b 1
)

echo ✅ APK found: %APK_PATH%
echo.

echo 📱 Installing APK on connected device...
adb install -r "%APK_PATH%"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed
    echo 🔌 Make sure device is connected and USB debugging is enabled
    pause
    exit /b 1
)

echo.
echo 🚀 Starting Cook Smart app...
adb shell am start -n com.cooksmartfresh/.MainActivity
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to start app
    pause
    exit /b 1
)

echo.
echo ✅ APK installed and started successfully!
echo.
echo 🧪 Manual testing checklist:
echo    [ ] App opens without crashes
echo    [ ] Login/registration works
echo    [ ] Recipe search works
echo    [ ] Barcode scanning works
echo    [ ] All screens load properly
echo    [ ] API calls connect to https://api.cooksmartapp.com
echo.

pause