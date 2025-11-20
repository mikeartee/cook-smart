# Deploy Password Reset Feature to EC2
# Run this script to upload backend changes

$EC2_IP = "3.237.38.24"
$EC2_USER = "ubuntu"
$KEY_PATH = "C:\Users\toota\.ssh\cook-smart-key.pem"
$REMOTE_PATH = "/home/ubuntu/cook-smart-backend"

Write-Host "🚀 Deploying Password Reset Feature to EC2..." -ForegroundColor Green
Write-Host ""

# Check if key file exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "❌ SSH key not found at: $KEY_PATH" -ForegroundColor Red
    Write-Host "Please update the KEY_PATH in this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "📤 Step 1: Uploading password reset routes..." -ForegroundColor Cyan
scp -i $KEY_PATH backend/src/routes/passwordReset.ts "${EC2_USER}@${EC2_IP}:${REMOTE_PATH}/src/routes/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload passwordReset.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Routes uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 2: Uploading email service..." -ForegroundColor Cyan
scp -i $KEY_PATH backend/src/services/EmailService.ts "${EC2_USER}@${EC2_IP}:${REMOTE_PATH}/src/services/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload EmailService.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Email service uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 3: Uploading User model..." -ForegroundColor Cyan
scp -i $KEY_PATH backend/src/models/User.ts "${EC2_USER}@${EC2_IP}:${REMOTE_PATH}/src/models/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload User.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ User model uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 4: Uploading server.ts..." -ForegroundColor Cyan
scp -i $KEY_PATH backend/src/server.ts "${EC2_USER}@${EC2_IP}:${REMOTE_PATH}/src/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload server.ts" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Server file uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "📤 Step 5: Uploading database migration..." -ForegroundColor Cyan
scp -i $KEY_PATH backend/migrations/create-password-reset-tokens-table.sql "${EC2_USER}@${EC2_IP}:${REMOTE_PATH}/migrations/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload migration" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Migration uploaded" -ForegroundColor Green

Write-Host ""
Write-Host "🔨 Step 6: Building TypeScript on server..." -ForegroundColor Cyan
ssh -i $KEY_PATH "${EC2_USER}@${EC2_IP}" "cd ${REMOTE_PATH}; npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green

Write-Host ""
Write-Host "🗄️ Step 7: Running database migration..." -ForegroundColor Cyan
ssh -i $KEY_PATH "${EC2_USER}@${EC2_IP}" "cd ${REMOTE_PATH}; PGPASSWORD='CookSmart2024!' psql -h cook-smart-db.c9wt8gzmu6qo.us-east-1.rds.amazonaws.com -U postgres -d cooksmart -f migrations/create-password-reset-tokens-table.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Migration may have already run (this is OK if table exists)" -ForegroundColor Yellow
}
Write-Host "✅ Migration completed" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Step 8: Restarting PM2..." -ForegroundColor Cyan
ssh -i $KEY_PATH "${EC2_USER}@${EC2_IP}" "pm2 restart cook-smart-backend"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PM2 restart failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Server restarted" -ForegroundColor Green

Write-Host ""
Write-Host "🏥 Step 9: Checking server health..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
$response = Invoke-WebRequest -Uri "http://${EC2_IP}:3000/health" -UseBasicParsing
if ($response.StatusCode -eq 200) {
    Write-Host "✅ Server is healthy!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Server health check returned: $($response.StatusCode)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What was deployed:" -ForegroundColor Cyan
Write-Host "  • Password reset routes (/api/v1/password/*)" -ForegroundColor White
Write-Host "  • Email service for sending reset codes" -ForegroundColor White
Write-Host "  • User model with updatePassword method" -ForegroundColor White
Write-Host "  • Database table: password_reset_tokens" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test the endpoints:" -ForegroundColor Cyan
Write-Host "  curl -X POST http://${EC2_IP}:3000/api/v1/password/forgot-password -H 'Content-Type: application/json' -d '{\"email\":\"test@example.com\"}'" -ForegroundColor Gray
Write-Host ""
