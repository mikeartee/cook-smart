@echo off
echo ========================================
echo Cook Smart - Phase 3 Testing
echo ========================================
echo.
echo This script will help you test Phase 3 features
echo.
echo STEP 1: Start Backend (serverless-offline)
echo ----------------------------------------
echo Open a NEW terminal and run:
echo   cd backend
echo   serverless offline start
echo.
echo STEP 2: Start React Native App
echo ----------------------------------------
echo After backend is running, press any key to start the app...
pause > nul
echo.
echo Starting Metro bundler...
npm start
