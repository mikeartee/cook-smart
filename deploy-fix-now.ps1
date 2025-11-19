# Quick Deploy - Pull latest changes and restart backend
$EC2_IP = "3.237.38.24"
$KEY_PATH = "$HOME\.ssh\cook-smart-key.pem"

Write-Host "🚀 Deploying Shopping List Fix to EC2..." -ForegroundColor Green
Write-Host ""

# Commands to run on EC2
$commands = @"
cd ~/cook-smart/backend && \
git fetch origin && \
git checkout fresh-project-migration && \
git pull origin fresh-project-migration && \
npm install && \
pm2 restart cook-smart-backend && \
echo '✅ Backend restarted successfully' && \
pm2 logs cook-smart-backend --lines 20
"@

Write-Host "📡 Connecting to EC2..." -ForegroundColor Cyan
ssh -i $KEY_PATH -o StrictHostKeyChecking=no ubuntu@$EC2_IP $commands

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "The shopping list bulk add endpoint is now live!" -ForegroundColor Yellow
