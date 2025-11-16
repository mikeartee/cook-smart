# Test Discord Notifications

Write-Host "🧪 Testing Discord Notifications`n" -ForegroundColor Cyan

# Test 1: Error Notification
Write-Host "📤 Test 1: Sending ERROR notification..." -ForegroundColor Yellow

$errorWebhook = "https://discord.com/api/webhooks/1434777612990943354/rwHoe6i12zyCzguvGsGod6sj4yziAtOfkUT5g2r79FLXE2egWxM5usGLsyZ0LPFTc_GD"
$errorBody = @{
    embeds = @(
        @{
            title = "🚨 TEST ERROR NOTIFICATION"
            description = "This is a test error from Cook Smart monitoring system!"
            color = 15158332
            fields = @(
                @{ name = "Severity"; value = "HIGH"; inline = $true }
                @{ name = "Time"; value = (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"); inline = $true }
                @{ name = "Status"; value = "Test - No action needed"; inline = $false }
            )
            footer = @{ text = "Cook Smart Error Monitor - TEST" }
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $errorWebhook -Method Post -Body $errorBody -ContentType "application/json" | Out-Null
    Write-Host "✅ Error notification sent!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 2: Feedback Notification
Write-Host "📤 Test 2: Sending FEEDBACK notification..." -ForegroundColor Yellow

$feedbackWebhook = "https://discord.com/api/webhooks/1436216941005111427/nRFnSFRtBZXeHfIuC9Ld2xOPkapaTA-K5hY4lt2PJ8FDQq5BHWc7nuO2nBbl--LnggIB"
$feedbackBody = @{
    embeds = @(
        @{
            title = "💬 TEST FEEDBACK"
            description = "This is a test feedback notification!"
            color = 3447003
            fields = @(
                @{ name = "User"; value = "Test User (test@example.com)"; inline = $false }
                @{ name = "Rating"; value = "⭐⭐⭐⭐⭐"; inline = $true }
                @{ name = "Category"; value = "Feature Request"; inline = $true }
                @{ name = "Message"; value = "The Discord notifications are working perfectly! 🎉"; inline = $false }
            )
            footer = @{ text = "Cook Smart Feedback - TEST" }
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $feedbackWebhook -Method Post -Body $feedbackBody -ContentType "application/json" | Out-Null
    Write-Host "✅ Feedback notification sent!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# Test 3: Activity Notification
Write-Host "📤 Test 3: Sending ACTIVITY notification..." -ForegroundColor Yellow

$activityWebhook = "https://discord.com/api/webhooks/1437221881836081284/GC7nJ6n_MM9YusHhLwTw-RVEyizVVM6CDRt6tVnP_qW2OSgD07VBzR8q5Y2M0BSdCNkW"
$activityBody = @{
    embeds = @(
        @{
            title = "👤 TEST USER SIGNUP"
            description = "This is a test activity notification!"
            color = 5763719
            fields = @(
                @{ name = "Name"; value = "Test User"; inline = $true }
                @{ name = "Email"; value = "testuser@example.com"; inline = $true }
                @{ name = "Time"; value = (Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"); inline = $true }
                @{ name = "Source"; value = "Direct signup (TEST)"; inline = $false }
            )
            footer = @{ text = "Cook Smart Activity - TEST" }
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    )
} | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod -Uri $activityWebhook -Method Post -Body $activityBody -ContentType "application/json" | Out-Null
    Write-Host "✅ Activity notification sent!`n" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed: $_`n" -ForegroundColor Red
}

Write-Host "`n🎉 All tests complete!" -ForegroundColor Cyan
Write-Host "`nCheck your Discord channels for 3 test notifications! ✨`n" -ForegroundColor Green
