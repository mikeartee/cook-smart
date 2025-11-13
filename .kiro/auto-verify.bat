@echo off
echo 🔍 COOK SMART - AUTOMATIC CODE VERIFICATION
echo ==========================================
echo.

cd /d "%~dp0.."

echo 📝 Step 1: Scanning for syntax errors...
node .kiro/verify-and-scan.js

echo.
echo 🎯 Verification complete!
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERRORS FOUND - Please fix before proceeding
    echo Check the report above for details
) else (
    echo ✅ ALL CHECKS PASSED - Safe to proceed!
)

echo.
pause