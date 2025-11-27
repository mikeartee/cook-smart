# Deploy Social Features to Production
# Run this script to deploy backend changes

Write-Host "🚀 Deploying Social & Advanced Features to Production" -ForegroundColor Green
Write-Host ""

# SSH connection details
$sshKey = "c:\Users\toota\.ssh\cook-smart-key.pem"
$server = "ubuntu@3.237.38.24"

Write-Host "📡 Connecting to server..." -ForegroundColor Cyan
Write-Host ""

# Deploy commands
$deployCommands = @"
cd /home/ubuntu/cook-smart/backend && \
echo '📥 Pulling latest code...' && \
git pull origin fresh-project-migration && \
echo '' && \
echo '🗄️  Running database migrations...' && \
node run-social-migrations.js && \
echo '' && \
echo '📦 Installing dependencies...' && \
npm install && \
echo '' && \
echo '🔨 Building TypeScript...' && \
npm run build && \
echo '' && \
echo '🔄 Restarting server...' && \
pm2 restart cook-smart-backend && \
echo '' && \
echo '✅ Deployment complete!' && \
echo '' && \
echo '📊 Server Status:' && \
pm2 status && \
echo '' && \
echo '📝 Recent Logs:' && \
pm2 logs cook-smart-backend --lines 20 --nostream
"@

# Execute deployment
ssh -i $sshKey $server $deployCommands

Write-Host ""
Write-Host "🎉 Deployment script completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the logs above for any errors"
Write-Host "2. Test the health endpoint: curl https://api.cooksmartapp.com/health"
Write-Host "3. Test the app locally: npm run android"
Write-Host ""
