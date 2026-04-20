@echo off
echo ===================================
echo Restarting Frontend with Fresh Code
echo ===================================
echo.
echo Step 1: Killing existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Step 2: Starting development server...
cd /d "%~dp0"
start cmd /k "npm run dev"
echo.
echo Step 3: IMPORTANT - In your browser:
echo    - Press Ctrl+Shift+R (hard refresh)
echo    - OR Clear cache and refresh
echo.
echo ===================================
pause
