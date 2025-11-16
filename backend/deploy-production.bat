@echo off
REM Cook Smart - Production Deployment Script (Windows)
REM This script automates the deployment process

echo ========================================
echo Cook Smart - Production Deployment
echo ========================================
echo.

REM Step 1: Verify readiness
echo Step 1: Verifying deployment readiness...
node scripts/verify-deployment-readiness.js
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Readiness check failed. Please fix errors before deploying.
    exit /b 1
)
echo [SUCCESS] Readiness check passed
echo.

REM Step 2: Run migrations
echo Step 2: Running database migrations...
set /p MIGRATE="Run database migrations? (y/n): "
if /i "%MIGRATE%"=="y" (
    node run-all-migrations.js
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Migrations completed
    ) else (
        echo [ERROR] Migrations failed
        exit /b 1
    )
) else (
    echo [WARNING] Skipping migrations
)
echo.

REM Step 3: Create Stripe products
echo Step 3: Creating Stripe products...
echo [WARNING] Make sure you're in Stripe LIVE mode!
set /p STRIPE="Create Stripe products? (y/n): "
if /i "%STRIPE%"=="y" (
    node scripts/setup-stripe-products.js
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Stripe products created
        echo [WARNING] SAVE THE PRODUCT IDs FROM ABOVE!
    ) else (
        echo [ERROR] Stripe product creation failed
        exit /b 1
    )
) else (
    echo [WARNING] Skipping Stripe product creation
)
echo.

REM Step 4: Verify database tables
echo Step 4: Verifying database tables...
node scripts/check-database-tables.js
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Database tables verified
) else (
    echo [ERROR] Database verification failed
    exit /b 1
)
echo.

REM Step 5: Build backend
echo Step 5: Building backend...
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backend built successfully
) else (
    echo [ERROR] Backend build failed
    exit /b 1
)
echo.

REM Step 6: Deployment summary
echo ========================================
echo DEPLOYMENT SUMMARY
echo ========================================
echo.
echo [SUCCESS] All automated steps completed successfully!
echo.
echo Manual steps remaining:
echo 1. Configure Stripe webhook in dashboard
echo    URL: https://your-api-domain.com/api/webhooks/stripe
echo    Events: subscription.*, invoice.*
echo.
echo 2. Deploy code to production server
echo    - Push Docker image, or
echo    - Deploy via your CI/CD pipeline
echo.
echo 3. Restart production server
echo.
echo 4. Verify deployment:
echo    curl https://your-api-domain.com/api/health
echo    curl https://your-api-domain.com/api/v1/subscriptions/phase
echo.
echo 5. Test subscription flow with test card
echo.
echo 6. Monitor logs and Discord notifications
echo.
echo Ready for production deployment!
echo.
pause
