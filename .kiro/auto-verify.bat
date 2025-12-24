@echo off
echo 🛡️ COOK SMART SYSTEM GUARDIAN v1.1.7
echo ====================================
echo 🍳 Comprehensive System Health Check
echo.

cd /d "%~dp0.."

echo 🔍 Running comprehensive system verification...
echo    - Code quality checks
echo    - API configuration validation  
echo    - Backend health monitoring
echo    - Website deployment status
echo    - APK build readiness
echo    - Security & infrastructure
echo.

node .kiro/verify-and-scan.js

echo.
echo 🎯 System Guardian scan complete!
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ CRITICAL ISSUES FOUND - Must fix before deployment
    echo 🔧 Check the detailed report above for fix suggestions
    echo 📋 Run this script again after making fixes
) else (
    echo ✅ ALL SYSTEMS OPERATIONAL - Cook Smart v1.1.7 ready!
    echo 🚀 Safe to deploy website, backend, and distribute APK
    echo 🎊 System Guardian: ALL GREEN!
)

echo.
echo Press any key to exit...
pause >nul