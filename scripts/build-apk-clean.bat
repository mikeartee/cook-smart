@echo off
echo ========================================
echo Cook Smart - Clean APK Build
echo ========================================
echo.

echo 🧹 Cleaning previous builds...
cd android
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Clean failed
    pause
    exit /b 1
)

echo.
echo 🔨 Building release APK...
call gradlew assembleRelease --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ APK built successfully!
echo 📱 Location: android\app\build\outputs\apk\release\app-release.apk
echo.

echo 📋 APK Information:
dir android\app\build\outputs\apk\release\app-release.apk

echo.
echo 🎯 Next steps:
echo    1. Test APK on physical device
echo    2. Verify API connectivity to https://api.cooksmartapp.com
echo    3. Check all app functionality
echo.

pause