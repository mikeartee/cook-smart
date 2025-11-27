@echo off
echo ========================================
echo Deploying Stripe Checkout to Backend
echo ========================================
echo.

echo Step 1: Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Backend build failed
    pause
    exit /b 1
)
cd ..

echo.
echo Step 2: Copying files to EC2...
scp -i "C:\Users\toota\.ssh\cook-smart-key.pem" backend/dist/controllers/StripeCheckoutController.js ubuntu@3.145.115.131:/home/ubuntu/cook-smart-backend/dist/controllers/
scp -i "C:\Users\toota\.ssh\cook-smart-key.pem" backend/dist/routes/subscriptionPricing.js ubuntu@3.145.115.131:/home/ubuntu/cook-smart-backend/dist/routes/

echo.
echo Step 3: Restarting backend service...
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.145.115.131 "sudo systemctl restart cook-smart-backend"

echo.
echo Step 4: Checking service status...
ssh -i "C:\Users\toota\.ssh\cook-smart-key.pem" ubuntu@3.145.115.131 "sudo systemctl status cook-smart-backend --no-pager"

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Test the endpoint:
echo curl -X POST https://api.cooksmartapp.com/api/v1/subscriptions/create-checkout-session
echo.
pause
