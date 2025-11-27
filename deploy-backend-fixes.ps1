# Deploy Backend Fixes to Production
# Fixes: /subscriptions/me endpoint, /settings/privacy SQL params, health monitor errors

Write-Host "🚀 Deploying Backend Fixes to Production..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$SERVER = "ubuntu@54.82.17.206"
$REMOTE_PATH = "/home/ubuntu/cook-smart-backend"
$KEY_PATH = "cook-smart-key.pem"

# Check if key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found: $KEY_PATH" -ForegroundColor Red
    Write-Host "Please ensure the SSH key is in the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Step 1: Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

Write-Host "📤 Step 2: Uploading files to production..." -ForegroundColor Yellow

# Upload dist folder
Write-Host "  Uploading dist folder..."
scp -i $KEY_PATH -r backend/dist/* ${SERVER}:${REMOTE_PATH}/dist/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload dist folder" -ForegroundColor Red
    exit 1
}

# Upload package.json (in case dependencies changed)
Write-Host "  Uploading package.json..."
scp -i $KEY_PATH backend/package.json ${SERVER}:${REMOTE_PATH}/
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload package.json" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🔄 Step 3: Restarting PM2..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "cd $REMOTE_PATH && pm2 restart cook-smart-api"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to restart PM2" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PM2 restarted successfully" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Step 4: Checking PM2 status..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "pm2 status"
Write-Host ""

Write-Host "📝 Step 5: Checking recent logs..." -ForegroundColor Yellow
ssh -i $KEY_PATH $SERVER "pm2 logs cook-smart-api --lines 20 --nostream"
Write-Host ""

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 What was deployed:" -ForegroundColor Cyan
Write-Host "  • Fixed GET /api/v1/subscriptions/me endpoint" -ForegroundColor White
Write-Host "  • Fixed GET /api/v1/settings/privacy SQL parameters" -ForegroundColor White
Write-Host "  • Fixed PATCH /api/v1/settings/privacy SQL parameters" -ForegroundColor White
Write-Host "  • Fixed health monitor cascading errors" -ForegroundColor White
Write-Host "  • Fixed DiscordWebhookService TypeScript errors" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test the endpoints:" -ForegroundColor Cyan
Write-Host "  curl -H 'Authorization: Bearer YOUR_TOKEN' https://api.cooksmart.app/api/v1/subscriptions/me" -ForegroundColor Gray
Write-Host "  curl -H 'Authorization: Bearer YOUR_TOKEN' https://api.cooksmart.app/api/v1/settings/privacy" -ForegroundColor Gray
Write-Host ""
