@echo off
echo ==========================================
echo    MediChainAI Setup ^& Startup Script
echo ==========================================
echo.

WHERE node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is NOT installed or not in your PATH.
    echo Please download and install it from: https://nodejs.org/
    echo.
    echo After installing, please restart this script.
    pause
    exit /b
)

echo [1/2] Installing dependencies...
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b
)

echo.
echo [2/2] Starting development server...
echo.
echo Opening app in browser...
start "" "http://localhost:3000"

call npm run dev
pause
