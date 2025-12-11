#!/usr/bin/env pwsh
# Robust Backend Deployment Script for Cook Smart
# Handles SSH timeouts and hanging connections

param(
    [string]$Message = "Backend deployment",
    [int]$Timeout = 30
)

Write-Host "🚀 Cook Smart Backend Deployment" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# SSH connection details
$SSHKey = "~/.ssh/cook-smart-key.pem"
$SSHHost = "ubuntu@34.203.8.150"
$SSHOptions = @(
    "-i", $SSHKey,
    "-o", "ConnectTimeout=10",
    "-o", "ServerAliveInterval=5",
    "-o", "ServerAliveCountMax=3",
    "-o", "BatchMode=yes",
    "-o", "StrictHostKeyChecking=no"
)

function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description,
        [int]$TimeoutSeconds = 30
    )
    
    Write-Host "📡 $Description..." -ForegroundColor Yellow
    
    try {
        # Use Start-Process with timeout to prevent hanging
        $ProcessArgs = $SSHOptions + @($SSHHost, $Command)
        
        $Process = Start-Process -FilePath "ssh" -ArgumentList $ProcessArgs -NoNewWindow -PassThru -RedirectStandardOutput "temp_output.txt" -RedirectStandardError "temp_error.txt"
        
        # Wait for process with timeout
        $Finished = $Process.WaitForExit($TimeoutSeconds * 1000)
        
        if (-not $Finished) {
            Write-Host "⏰ Command timed out after $TimeoutSeconds seconds" -ForegroundColor Red
            $Process.Kill()
            return $false
        }
        
        # Read output
        if (Test-Path "temp_output.txt") {
            $Output = Get-Content "temp_output.txt" -Raw
            if ($Output) {
                Write-Host $Output -ForegroundColor Gray
            }
            Remove-Item "temp_output.txt" -ErrorAction SilentlyContinue
        }
        
        # Read errors
        if (Test-Path "temp_error.txt") {
            $Error = Get-Content "temp_error.txt" -Raw
            if ($Error) {
                Write-Host $Error -ForegroundColor Red
            }
            Remove-Item "temp_error.txt" -ErrorAction SilentlyContinue
        }
        
        if ($Process.ExitCode -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ $Description failed with exit code $($Process.ExitCode)" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "❌ $Description failed: $_" -ForegroundColor Red
        return $false
    }
}

# Step 1: Test SSH Connection
Write-Host "`n🔍 Step 1: Testing SSH Connection"
$TestResult = Invoke-SSHCommand -Command "echo 'SSH connection successful'" -Description "Testing SSH connection" -TimeoutSeconds 10

if (-not $TestResult) {
    Write-Host "❌ SSH connection failed. Please check:" -ForegroundColor Red
    Write-Host "  - SSH key permissions: icacls ~/.ssh/cook-smart-key.pem" -ForegroundColor Yellow
    Write-Host "  - Server accessibility: ping 34.203.8.150" -ForegroundColor Yellow
    Write-Host "  - AWS security groups allow SSH (port 22)" -ForegroundColor Yellow
    exit 1
}

# Step 2: Pull Latest Changes
Write-Host "`n📥 Step 2: Pulling Latest Changes"
$PullResult = Invoke-SSHCommand -Command "cd /home/ubuntu/cook-smart/backend/backend && git pull origin fresh-project-migration" -Description "Pulling latest changes" -TimeoutSeconds 20

if (-not $PullResult) {
    Write-Host "❌ Git pull failed. Continuing anyway..." -ForegroundColor Yellow
}

# Step 3: Install Dependencies
Write-Host "`n📦 Step 3: Installing Dependencies"
$InstallResult = Invoke-SSHCommand -Command "cd /home/ubuntu/cook-smart/backend/backend && npm install" -Description "Installing dependencies" -TimeoutSeconds 60

if (-not $InstallResult) {
    Write-Host "❌ npm install failed. Continuing anyway..." -ForegroundColor Yellow
}

# Step 4: Restart Backend Service
Write-Host "`n🔄 Step 4: Restarting Backend Service"
$RestartResult = Invoke-SSHCommand -Command "cd /home/ubuntu/cook-smart/backend/backend && pm2 restart cook-smart-backend" -Description "Restarting backend service" -TimeoutSeconds 15

if (-not $RestartResult) {
    Write-Host "❌ PM2 restart failed" -ForegroundColor Red
    exit 1
}

# Step 5: Check Service Status
Write-Host "`n📊 Step 5: Checking Service Status"
$StatusResult = Invoke-SSHCommand -Command "pm2 status cook-smart-backend" -Description "Checking service status" -TimeoutSeconds 10

# Step 6: Test API Endpoint
Write-Host "`n🌐 Step 6: Testing API Endpoint"
try {
    $ApiResponse = Invoke-RestMethod -Uri "https://api.cooksmartapp.com/health" -TimeoutSec 10
    Write-Host "✅ API endpoint is responding: $($ApiResponse.status)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API endpoint test failed: $_" -ForegroundColor Yellow
}

# Summary
Write-Host "`n🎉 Deployment Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "SSH Connection: $(if($TestResult){'✅ Success'}else{'❌ Failed'})"
Write-Host "Git Pull: $(if($PullResult){'✅ Success'}else{'⚠️ Warning'})"
Write-Host "NPM Install: $(if($InstallResult){'✅ Success'}else{'⚠️ Warning'})"
Write-Host "PM2 Restart: $(if($RestartResult){'✅ Success'}else{'❌ Failed'})"
Write-Host "Service Status: $(if($StatusResult){'✅ Checked'}else{'⚠️ Warning'})"

if ($TestResult -and $RestartResult) {
    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "The recipe matching fix should now be active." -ForegroundColor Green
} else {
    Write-Host "`n❌ Deployment had issues. Please check manually." -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Test recipe search in the mobile app" -ForegroundColor White
Write-Host "2. Check for improved match percentages (should be >0%)" -ForegroundColor White
Write-Host "3. Monitor logs: ssh -i ~/.ssh/cook-smart-key.pem ubuntu@34.203.8.150 'pm2 logs cook-smart-backend --lines 20'" -ForegroundColor White