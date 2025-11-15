@echo off
echo Fixing Gradle configuration...

cd C:\Users\toota\Documents\Projects\CookSmartFresh\android

echo Updating Gradle wrapper to 8.10.2 (stable with Java 21)...
call gradlew wrapper --gradle-version 8.10.2

echo.
echo Gradle updated! Now try: npm run android
