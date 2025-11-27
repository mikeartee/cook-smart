@echo off
echo ========================================
echo Deploying Payment Fix
echo ========================================
echo.

echo Step 1: Building APK...
call gradlew assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Step 2: Finding APK...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if not exist "%APK_PATH%" (
    echo ERROR: APK not found at %APK_PATH%
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo APK Location: %APK_PATH%
echo.
echo Install on your device:
echo   adb install -r "%APK_PATH%"
echo.
pause
