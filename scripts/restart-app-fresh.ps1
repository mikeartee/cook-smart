# Restart App with Fresh Cache
Write-Host "🔄 Restarting app with fresh cache..." -ForegroundColor Cyan
Write-Host ""

# Stop Metro if running
Write-Host "1️⃣ Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {$_.CommandLine -like "*react-native*"} | Stop-Process -Force
Start-Sleep -Seconds 2

# Clear Metro cache
Write-Host "2️⃣ Clearing Metro cache..." -ForegroundColor Yellow
if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
}

# Start Metro with reset cache
Write-Host "3️⃣ Starting Metro with reset cache..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start -- --reset-cache"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ Metro started!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now do this on your device/emulator:" -ForegroundColor Cyan
Write-Host "   1. Close the Cook Smart app completely" -ForegroundColor White
Write-Host "   2. Reopen the app from your device" -ForegroundColor White
Write-Host "   3. Go to Profile → Privacy & Security" -ForegroundColor White
Write-Host "   4. Tap Privacy Policy or Terms of Service" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Watch the Metro console for:" -ForegroundColor Cyan
Write-Host "   🔵 Blue circle = button was tapped" -ForegroundColor White
Write-Host "   🟢 Green circle = screen rendered" -ForegroundColor White
Write-Host ""
