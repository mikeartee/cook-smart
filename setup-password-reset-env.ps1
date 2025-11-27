Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Password Reset Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$EC2_HOST = "api.cooksmartapp.com"
$EC2_USER = "ec2-user"
$SSH_KEY = "$env:USERPROFILE\.ssh\cook-smart-key.pem"
$BACKEND_PATH = "/home/ec2-user/cook-smart-backend"

Write-Host "This script will add email configuration to your production server." -ForegroundColor Yellow
Write-Host ""

# Get Resend API Key
Write-Host "Enter your Resend API Key:" -ForegroundColor Yellow
Write-Host "(Get it from: https://resend.com/api-keys)" -ForegroundColor Gray
$resendKey = Read-Host "RESEND_API_KEY"

if ([string]::IsNullOrWhiteSpace($resendKey)) {
    Write-Host "ERROR: RESEND_API_KEY is required!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Adding environment variables to production server..." -ForegroundColor Yellow

# Add to .env on server
ssh -i $SSH_KEY "${EC2_USER}@${EC2_HOST}" @"
cd $BACKEND_PATH

# Backup current .env
cp .env .env.backup-`$(date +%Y%m%d-%H%M%S)

# Add email configuration if not exists
if ! grep -q "RESEND_API_KEY" .env; then
    echo "" >> .env
    echo "# Email Service (Resend)" >> .env
    echo "RESEND_API_KEY=$resendKey" >> .env
    echo "EMAIL_FROM=Cook Smart <noreply@cooksmartapp.com>" >> .env
    echo "✓ Email configuration added"
else
    # Update existing
    sed -i 's/^RESEND_API_KEY=.*/RESEND_API_KEY=$resendKey/' .env
    echo "✓ Email configuration updated"
fi
"@

Write-Host ""
Write-Host "✓ Environment variables configured!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run deploy-password-reset.ps1 to deploy the feature" -ForegroundColor Yellow
Write-Host ""
pause

