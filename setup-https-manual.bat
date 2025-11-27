@echo off
echo ========================================
echo Cook Smart HTTPS Setup - Manual Steps
echo ========================================
echo.
echo Step 1: DNS Record
echo ✅ DONE - api.cooksmartapp.com now points to 3.237.38.24
echo    (DNS may take 5-10 minutes to propagate globally)
echo.
echo Step 2: Test DNS
echo Run this command to check if DNS is ready:
echo    nslookup api.cooksmartapp.com
echo.
echo Should return: 3.237.38.24
echo.
echo ========================================
echo Step 3: Upload Script to EC2
echo ========================================
echo.
echo Run this command:
echo    scp -i %USERPROFILE%\.ssh\cook-smart-key.pem setup-https-on-ec2.sh ec2-user@3.237.38.24:~/
echo.
echo If that fails, try finding your SSH key:
echo    dir %USERPROFILE%\.ssh\*.pem
echo.
echo ========================================
echo Step 4: SSH into EC2 and Run Script
echo ========================================
echo.
echo Run these commands:
echo    ssh -i %USERPROFILE%\.ssh\cook-smart-key.pem ec2-user@3.237.38.24
echo    chmod +x setup-https-on-ec2.sh
echo    sudo ./setup-https-on-ec2.sh
echo.
echo The script will:
echo    - Install certbot and nginx
echo    - Get SSL certificate
echo    - Configure HTTPS
echo    - Start services
echo.
echo ========================================
echo Step 5: After HTTPS is Working
echo ========================================
echo.
echo 1. Test HTTPS:
echo    curl https://api.cooksmartapp.com/health
echo.
echo 2. Go to Stripe Dashboard:
echo    https://dashboard.stripe.com/webhooks
echo.
echo 3. Add webhook endpoint:
echo    URL: https://api.cooksmartapp.com/api/webhooks/stripe
echo    Events: subscription.created, subscription.updated, etc.
echo.
echo 4. Copy webhook secret and add to EC2 .env file
echo.
echo ========================================
echo.
pause
