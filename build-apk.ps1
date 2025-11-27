$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Output "🏗️ Building APK v1.0.23 - Privacy & Security Features"
Write-Output "═══════════════════════════════════════════════════════"
Write-Output ""
Write-Output "Java Home: $env:JAVA_HOME"
Write-Output "Java Version:"
& "$env:JAVA_HOME\bin\java.exe" -version
Write-Output ""
Write-Output "Starting Gradle build..."
Write-Output ""

Set-Location android
& .\gradlew.bat clean assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Output ""
    Write-Output "✅ BUILD SUCCESSFUL!"
    Write-Output ""
    Write-Output "📦 APK Location:"
    Write-Output "   android\app\build\outputs\apk\release\app-release.apk"
    Write-Output ""
    
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Output "📊 APK Size: $([math]::Round($apkSize, 2)) MB"
        
        # Copy to desktop
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $newName = "CookSmart-v1.0.23-privacy-security.apk"
        Copy-Item $apkPath "$desktopPath\$newName" -Force
        Write-Output "✅ Copied to Desktop: $newName"
    }
} else {
    Write-Output ""
    Write-Output "❌ BUILD FAILED"
    Write-Output "Check the error messages above"
}

Set-Location ..
