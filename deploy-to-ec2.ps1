# Cook Smart Backend Deployment Script
# Run this script to deploy to EC2

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cook Smart Backend Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
$sshKey = "$env:USERPROFILE\.ssh\cook-smart-key.pem"
if (-not (Test-Path $sshKey)) {
    Write-Host "❌ SSH key not found at: $sshKey" -ForegroundColor Red
    Write-Host "Please ensure your SSH key is in the correct location" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green

# Build backend locally first
Write-Host "Building backend locally..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Local build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Local build successful" -ForegroundColor Green
Set-Location ..

# Deploy to EC2
Write-Host ""
Write-Host "Deploying to EC2 server..." -ForegroundColor Yellow

$deployCommands = @"
cd /home/ubuntu/cook-smart/backend/backend &&
echo 'Pulling latest changes...' &&
git pull origin fresh-project-migration &&
echo 'Installing dependencies...' &&
npm install &&
echo 'Building TypeScript...' &&
npm run build &&
echo 'Restarting PM2 process...' &&
pm2 restart cook-smart-backend &&
echo 'Checking status...' &&
pm2 status &&
echo 'Testing API...' &&
curl -s http://localhost:3000/health | head -5 &&
echo 'Deployment complete!'
"@

ssh -i $sshKey ubuntu@34.203.8.150 $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Testing production API..." -ForegroundColor Yellow
    
    # Test production API
    try {
        $response = Invoke-RestMethod -Uri "https://api.cooksmartapp.com/health" -TimeoutSec 10
        Write-Host "✅ Production API is responding!" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️  Production API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "This might be normal if DNS/SSL isn't configured yet" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "🎉 Backend deployment complete!" -ForegroundColor Green
    Write-Host "You can now try logging into the admin dashboard" -ForegroundColor Cyan
    Write-Host "Username: brad" -ForegroundColor White
    Write-Host "Password: June172018!" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")