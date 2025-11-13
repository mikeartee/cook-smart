@echo off
REM Cook Smart Progress Tracker - Windows Batch Script

cd /d "%~dp0specs\cook-smart"

if "%1"=="complete" (
    node progress-tracker.js complete %2 %3 %4
    git add .
    git commit -m "progress: completed %3"
    echo.
    echo ✅ Progress updated and committed to git!
) else if "%1"=="status" (
    node progress-tracker.js status
) else if "%1"=="recent" (
    node progress-tracker.js recent %2
) else (
    echo Cook Smart Progress Tracker
    echo.
    echo Usage:
    echo   track-progress complete "1.1.1" "Initialize React Native project" "Project created and tested"
    echo   track-progress status
    echo   track-progress recent [count]
    echo.
    echo This will automatically:
    echo   - Mark the item as complete in the checklist
    echo   - Update progress percentages
    echo   - Commit changes to git
    echo   - Show current status
)

pause