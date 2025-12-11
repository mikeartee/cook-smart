#!/usr/bin/env pwsh

# Cook Smart - Server Log Checker
# Quick script to check backend logs without getting stuck

Write-Host "========================================" -ForegroundColor Green
Write-Host "Cook Smart - Server Log Checker" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Check if SSH key exists
if (-not (Test-Path "~/.ssh/cook-smart-key.pem")) {
    Write-Host "❌ SSH key not found at ~/.ssh/cook-smart-key.pem" -ForegroundColor Red
    exit 1
}

Write-Host "✅ SSH key found" -ForegroundColor Green

# Function to run SSH command with timeout
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n🔍 $Description..." -ForegroundColor Yellow
    
    try {
        $result = ssh -i ~/.ssh/cook-smart-key.pem -o ConnectTimeout=10 -o BatchMode=yes ubuntu@34.203.8.150 $Command
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result
        } else {
            Write-Host "❌ Command failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ SSH command failed: $_" -ForegroundColor Red
    }
}

# Check server status
Invoke-SSHCommand "pm2 status" "Checking PM2 status"

# Check recent logs (last 15 lines, no streaming)
Invoke-SSHCommand "pm2 logs cook-smart-backend --lines 15 --nostream" "Getting recent logs"

# Check for errors in last 50 lines
Invoke-SSHCommand "pm2 logs cook-smart-backend --lines 50 --nostream | grep -i error | tail -10" "Checking for recent errors"

# Check system resources
Invoke-SSHCommand "free -h && df -h /" "Checking system resources"

# Test API health
Write-Host "`n🔍 Testing API health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://api.cooksmartapp.com/health" -TimeoutSec 10
    Write-Host "✅ API Health: $($response.status)" -ForegroundColor Green
    Write-Host "Database: $($response.database.connected ? 'Connected' : 'Disconnected')" -ForegroundColor ($response.database.connected ? 'Green' : 'Red')
} catch {
    Write-Host "❌ API health check failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Log check complete!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")