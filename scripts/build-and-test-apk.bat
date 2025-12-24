@echo off
echo ========================================
echo Cook Smart - Build and Test APK
echo ========================================
echo.

echo 🔄 Running complete build and test cycle...
echo.

echo Step 1: Clean build APK
call scripts\build-apk-clean.bat
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed, stopping
    exit /b 1
)

echo.
echo Step 2: Test APK on device
call scripts\test-apk.bat
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Testing failed
    exit /b 1
)

echo.
echo 🎉 Build and test cycle completed successfully!
echo ✅ Cook Smart APK is ready for distribution
echo.

pause