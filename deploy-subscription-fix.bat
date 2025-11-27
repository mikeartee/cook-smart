@echo off
echo ========================================
echo Cook Smart - Subscription Payment Fix
echo ========================================
echo.

echo Step 1: Running database migration...
cd backend
node run-subscription-fix-migration.js
if %errorlevel% neq 0 (
    echo ERROR: Migration failed!
    pause
    exit /b 1
)
echo.

echo Step 2: Testing the fix...
node test-subscription-fix.js
if %errorlevel% neq 0 (
    echo ERROR: Tests failed!
    pause
    exit /b 1
)
echo.

echo Step 3: Rebuilding backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo SUCCESS! Subscription fix deployed.
echo ========================================
echo.
echo Next steps:
echo 1. Restart your backend server
echo 2. Test subscription flow in the app
echo.
pause

