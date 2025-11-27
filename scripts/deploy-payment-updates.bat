@echo off
echo ========================================
echo  Deploy Payment System Updates
echo ========================================
echo.

echo [1/4] Running database migration...
cd backend
node -e "const pool = require('./dist/config/database').default; const fs = require('fs'); const sql = fs.readFileSync('./migrations/013_create_subscription_reminders.sql', 'utf8'); pool.query(sql).then(() => { console.log('Migration complete'); process.exit(0); }).catch(err => { console.error('Migration failed:', err); process.exit(1); });"

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)

echo.
echo [2/4] Building backend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)

echo.
echo [3/4] Restarting backend server...
echo NOTE: You need to manually restart your backend server
echo Run: npm start (or pm2 restart if using PM2)
echo.

cd ..

echo [4/4] Building frontend...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Restart your backend server
echo 2. Build new APK: npm run build-apk
echo 3. Distribute APK to beta testers
echo.
echo WHAT'S NOW ACTIVE:
echo - Subscription monitoring (every 6 hours)
echo - Email reminders (7, 3, 1 days before expiry)
echo - Grace period enforcement (7 days)
echo - Payment failure notifications
echo - Access restrictions
echo - Updated TOS and Refund Policy
echo.
pause
