@echo off
setlocal

echo ==========================================
echo    MediChainAI Docker Stack Startup
echo ==========================================
echo.

echo [1/3] Selecting Docker Desktop context...
docker context use desktop-linux
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to switch Docker context to desktop-linux.
    pause
    exit /b 1
)

echo.
echo [2/3] Disabling Compose Bake for compatibility...
set COMPOSE_BAKE=false

echo.
echo [3/3] Building and starting Next.js + MONAI...
docker compose up --build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Docker compose failed. Make sure Docker Desktop is running and healthy.
    pause
    exit /b 1
)

endlocal
