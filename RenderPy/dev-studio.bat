@echo off
setlocal
echo ===================================================
echo   RenderPy Studio - Live Hot-Reload Dev Launcher
echo ===================================================
echo.
echo [1/2] Starting Vite React Dev Server...
start "Vite Dev Server" cmd /c "cd frontend && npm run dev"
echo Waiting for Vite dev server to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Launching Desktop Window...
call run-studio.bat --dev
