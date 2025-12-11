# Cook Smart AWS Setup Investigation
# This script will help us figure out your current deployment setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cook Smart AWS Setup Investigation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if AWS CLI is installed
Write-Host "1. Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>$null
    if ($awsVersion) {
        Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
        
        # Check AWS credentials
        Write-Host "2. Checking AWS credentials..." -ForegroundColor Yellow
        try {
            $identity = aws sts get-caller-identity 2>$null | ConvertFrom-Json
            Write-Host "✅ AWS credentials configured" -ForegroundColor Green
            Write-Host "   Account: $($identity.Account)" -ForegroundColor Gray
            Write-Host "   User: $($identity.Arn)" -ForegroundColor Gray
        } catch {
            Write-Host "❌ AWS credentials not configured" -ForegroundColor Red
            Write-Host "   Run: aws configure" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ AWS CLI not found" -ForegroundColor Red
        Write-Host "   Install from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ AWS CLI not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Testing current API endpoint..." -ForegroundColor Yellow

# Test the API endpoint
try {
    $response = Invoke-RestMethod -Uri "https://api.cooksmartapp.com/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "✅ API is responding!" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API not responding: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Testing direct EC2 connection..." -ForegroundColor Yellow

# Test EC2 direct connection
try {
    $tcpTest = Test-NetConnection -ComputerName "34.203.8.150" -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($tcpTest) {
        Write-Host "✅ EC2 port 3000 is reachable" -ForegroundColor Green
        
        # Try HTTP request to EC2
        try {
            $ec2Response = Invoke-RestMethod -Uri "http://34.203.8.150:3000/health" -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ EC2 backend is responding!" -ForegroundColor Green
            Write-Host "   Response: $($ec2Response | ConvertTo-Json -Compress)" -ForegroundColor Cyan
        } catch {
            Write-Host "⚠️  EC2 port open but HTTP not responding" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ EC2 port 3000 not reachable" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Cannot test EC2 connection" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. DNS Resolution Check..." -ForegroundColor Yellow

# Check DNS
try {
    $dnsResult = Resolve-DnsName -Name "api.cooksmartapp.com" -Type A -ErrorAction Stop
    Write-Host "✅ DNS Resolution:" -ForegroundColor Green
    foreach ($record in $dnsResult) {
        Write-Host "   $($record.Name) -> $($record.IPAddress)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ DNS resolution failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($awsVersion -and $identity) {
    Write-Host "✅ You have AWS CLI configured" -ForegroundColor Green
    Write-Host "   We can check your AWS resources" -ForegroundColor White
    Write-Host ""
    Write-Host "Run these commands to investigate:" -ForegroundColor Yellow
    Write-Host "   aws ec2 describe-instances --region us-east-1" -ForegroundColor White
    Write-Host "   aws elasticbeanstalk describe-applications --region us-east-1" -ForegroundColor White
    Write-Host "   aws ecs list-clusters --region us-east-1" -ForegroundColor White
    Write-Host "   aws lambda list-functions --region us-east-1" -ForegroundColor White
} else {
    Write-Host "❌ Need to configure AWS CLI first" -ForegroundColor Red
    Write-Host "   1. Install AWS CLI" -ForegroundColor White
    Write-Host "   2. Run: aws configure" -ForegroundColor White
    Write-Host "   3. Enter your AWS credentials" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")