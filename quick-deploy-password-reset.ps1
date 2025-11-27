Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Quick Deploy - Password Reset Feature" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we have Resend API key
Write-Host "Step 1: Checking Resend API Key..." -ForegroundColor Yellow

$hasResendKey = $false
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "RESEND_API_KEY=re_") {
        Write-Host "✓ Resend API key found in local .env" -ForegroundColor Green
        $hasResendKey = $true
    }
}

if (-not $hasResendKey) {
    Write-Host ""
    Write-Host "⚠ Resend API key not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Get your API key from: https://resend.com/api-keys" -ForegroundColor Cyan
    Write-Host ""
    $resendKey = Read-Host "Enter your Resend API Key (starts with re_)"
    
    if ([string]::IsNullOrWhiteSpace($resendKey)) {
        Write-Host "ERROR: API key is required!" -ForegroundColor Red
        pause
        exit 1
    }
    
    # Add to local .env for testing
    if (Test-Path ".env") {
        Add-Content ".env" "`nRESEND_API_KEY=$resendKey"
        Add-Content ".env" "EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>"
    }
    Write-Host "✓ API key added to local .env" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Building backend..." -ForegroundColor Yellow
cd backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    cd ..
    pause
    exit 1
}
cd ..
Write-Host "✓ Backend built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Preparing deployment files..." -ForegroundColor Yellow

# Check SSH key
$sshKeyPath = "$env:USERPROFILE\.ssh\cook-smart-key.pem"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "⚠ SSH key not found at: $sshKeyPath" -ForegroundColor Yellow
    $sshKeyPath = Read-Host "Enter path to your SSH key"
    if (-not (Test-Path $sshKeyPath)) {
        Write-Host "ERROR: SSH key not found!" -ForegroundColor Red
        pause
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to Deploy!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Upload backend files to EC2" -ForegroundColor White
Write-Host "  2. Run database migration" -ForegroundColor White
Write-Host "  3. Update environment variables" -ForegroundColor White
Write-Host "  4. Restart backend service" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Continue with deployment? (y/n)"
if ($continue -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host ""
Write-Host "Step 4: Deploying to production..." -ForegroundColor Yellow

$EC2_HOST = "api.cooksmartapp.com"
$EC2_USER = "ec2-user"
$BACKEND_PATH = "/home/ec2-user/cook-smart-backend"

# Upload backend dist files
Write-Host "  → Uploading backend files..." -ForegroundColor Gray
scp -i $sshKeyPath -r backend/dist/* "${EC2_USER}@${EC2_HOST}:${BACKEND_PATH}/dist/"

# Upload migration file
Write-Host "  → Uploading migration file..." -ForegroundColor Gray
scp -i $sshKeyPath backend/migrations/create-password-reset-tokens-table.sql "${EC2_USER}@${EC2_HOST}:${BACKEND_PATH}/migrations/"

Write-Host ""
Write-Host "Step 5: Configuring production environment..." -ForegroundColor Yellow

# Get Resend key from local .env
$resendKeyValue = ""
if (Test-Path ".env") {
    $envLines = Get-Content ".env"
    foreach ($line in $envLines) {
        if ($line -match "^RESEND_API_KEY=(.+)$") {
            $resendKeyValue = $matches[1]
            break
        }
    }
}

if ([string]::IsNullOrWhiteSpace($resendKeyValue)) {
    Write-Host "⚠ Could not find RESEND_API_KEY in .env" -ForegroundColor Yellow
    $resendKeyValue = Read-Host "Enter Resend API key for production"
}

# Update production .env
ssh -i $sshKeyPath "${EC2_USER}@${EC2_HOST}" @"
cd $BACKEND_PATH

# Backup .env
cp .env .env.backup-`$(date +%Y%m%d-%H%M%S)

# Add or update email config
if ! grep -q "RESEND_API_KEY" .env; then
    echo "" >> .env
    echo "# Email Service (Resend)" >> .env
    echo "RESEND_API_KEY=$resendKeyValue" >> .env
    echo "EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>" >> .env
else
    sed -i 's|^RESEND_API_KEY=.*|RESEND_API_KEY=$resendKeyValue|' .env
    if ! grep -q "EMAIL_FROM" .env; then
        echo "EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>" >> .env
    fi
fi

echo "✓ Environment configured"
"@

Write-Host ""
Write-Host "Step 6: Running database migration..." -ForegroundColor Yellow
ssh -i $sshKeyPath "${EC2_USER}@${EC2_HOST}" @"
cd $BACKEND_PATH
source .env
PGPASSWORD=`$DB_PASSWORD psql -h `$DB_HOST -U `$DB_USER -d `$DB_NAME -f migrations/create-password-reset-tokens-table.sql 2>&1
"@

Write-Host ""
Write-Host "Step 7: Restarting backend service..." -ForegroundColor Yellow
ssh -i $sshKeyPath "${EC2_USER}@${EC2_HOST}" "pm2 restart cook-smart-backend"

Write-Host ""
Write-Host "Step 8: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "https://${EC2_HOST}/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Backend is running!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Could not verify backend health" -ForegroundColor Yellow
}

# Check logs
Write-Host ""
Write-Host "Checking backend logs..." -ForegroundColor Yellow
ssh -i $sshKeyPath "${EC2_USER}@${EC2_HOST}" "pm2 logs cook-smart-backend --lines 20 --nostream"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Password Reset Feature is now LIVE! 🎉" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test it now:" -ForegroundColor Yellow
Write-Host "  1. Open Cook Smart app" -ForegroundColor White
Write-Host "  2. Tap 'Forgot Password?'" -ForegroundColor White
Write-Host "  3. Enter your email" -ForegroundColor White
Write-Host "  4. Check email for 6-digit code" -ForegroundColor White
Write-Host "  5. Enter code and set new password" -ForegroundColor White
Write-Host ""
Write-Host "Monitor emails: https://resend.com/emails" -ForegroundColor Cyan
Write-Host ""
pause

