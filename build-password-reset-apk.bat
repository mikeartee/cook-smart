@echo off
echo ========================================
echo Building Cook Smart v1.0.25
echo Password Reset Feature
echo ========================================
echo.

echo Step 1: Cleaning previous builds...
cd android
call gradlew clean
cd ..

echo.
echo Step 2: Building APK...
cd android
call gradlew assembleRelease
cd ..

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo APK Location:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
echo Rename to: CookSmart-v1.0.25-password-reset.apk
echo.
pause

