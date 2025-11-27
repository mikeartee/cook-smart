Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cook Smart - Deploy Password Reset Feature" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_HOST = "api.cooksmartapp.com"
$EC2_USER = "ec2-user"
$SSH_KEY = "$env:USERPROFILE\.ssh\cook-smart-key.pem"
$BACKEND_PATH = "/home/ec2-user/cook-smart-backend"

Write-Host "Step 1: Checking backend directory..." -ForegroundColor Yellow
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: backend directory not found!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install resend
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Set-Location ..
    pause
    exit 1
}

Write-Host ""
Write-Host "Step 3: Building backend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Set-Location ..
    pause
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "Step 4: Checking environment variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: Make sure your production .env has:" -ForegroundColor Yellow
Write-Host "  - RESEND_API_KEY=re_..." -ForegroundColor White
Write-Host "  - EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Continue with deployment? (y/n)"
if ($continue -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host ""
Write-Host "Step 5: Uploading backend files..." -ForegroundColor Yellow
scp -i $SSH_KEY -r backend/dist/* "${EC2_USER}@${EC2_HOST}:${BACKEND_PATH}/dist/"
scp -i $SSH_KEY backend/migrations/create-password-reset-tokens-table.sql "${EC2_USER}@${EC2_HOST}:${BACKEND_PATH}/migrations/"

Write-Host ""
Write-Host "Step 6: Running database migration..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${EC2_USER}@${EC2_HOST}" @"
cd $BACKEND_PATH
source .env
PGPASSWORD=`$DB_PASSWORD psql -h `$DB_HOST -U `$DB_USER -d `$DB_NAME -f migrations/create-password-reset-tokens-table.sql
"@

Write-Host ""
Write-Host "Step 7: Restarting backend service..." -ForegroundColor Yellow
ssh -i $SSH_KEY "${EC2_USER}@${EC2_HOST}" "pm2 restart cook-smart-backend"

Write-Host ""
Write-Host "Step 8: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$response = Invoke-WebRequest -Uri "https://${EC2_HOST}/health" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✓ Backend is running!" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend health check failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Password reset feature is now LIVE!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test it:" -ForegroundColor Yellow
Write-Host "1. Open Cook Smart app" -ForegroundColor White
Write-Host "2. Tap 'Forgot Password?'" -ForegroundColor White
Write-Host "3. Enter your email" -ForegroundColor White
Write-Host "4. Check email for reset code" -ForegroundColor White
Write-Host ""
pause

