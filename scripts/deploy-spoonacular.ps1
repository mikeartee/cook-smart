Write-Host "Deploying Spoonacular Integration to Production..." -ForegroundColor Green
Write-Host ""

$sshKey = "c:\Users\toota\.ssh\cook-smart-key.pem"
$server = "ubuntu@3.237.38.24"
$backendPath = "/home/ubuntu/cook-smart-backend"

Write-Host "1. Pulling latest code from GitHub..." -ForegroundColor Yellow
ssh -i $sshKey $server "cd $backendPath && git pull origin fresh-project-migration"

Write-Host ""
Write-Host "2. Installing dependencies..." -ForegroundColor Yellow
ssh -i $sshKey $server "cd $backendPath && npm install"

Write-Host ""
Write-Host "3. Building TypeScript..." -ForegroundColor Yellow
ssh -i $sshKey $server "cd $backendPath && npm run build"

Write-Host ""
Write-Host "4. Restarting server..." -ForegroundColor Yellow
ssh -i $sshKey $server "pm2 restart cook-smart-backend"

Write-Host ""
Write-Host "5. Checking server status..." -ForegroundColor Yellow
ssh -i $sshKey $server "pm2 logs cook-smart-backend --lines 20"

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Spoonacular is now live with 5000+ US recipes!" -ForegroundColor Green
