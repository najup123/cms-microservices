@echo off
echo ===================================
echo Restarting Spring Boot Backend
echo ===================================
echo.
echo Step 1: Building with Maven...
cd /d "%~dp0"
call mvnw.cmd clean install -DskipTests
echo.
if %ERRORLEVEL% NEQ 0 (
    echo BUILD FAILED!
    pause
    exit /b 1
)
echo.
echo Step 2: Killing existing Java processes...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Step 3: Starting Spring Boot application...
start cmd /k "mvnw.cmd spring-boot:run"
echo.
echo Backend is starting...
echo Check the new window for logs.
echo.
echo ===================================
pause
