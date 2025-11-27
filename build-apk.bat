@echo off
echo Building Cook Smart APK...
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set PATH=%JAVA_HOME%\bin;%PATH%
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%

echo Cleaning previous build...
cd android
call gradlew clean

echo Building release APK...
call gradlew assembleRelease

echo.
echo Build complete!
echo APK location: android\app\build\outputs\apk\release\app-release.apk
cd ..
