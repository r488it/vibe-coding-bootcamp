@echo off
rem ============================================================
rem  VIBE CODING BOOTCAMP launcher
rem  Double-click: starts local server + opens Chrome
rem  Close this window to stop the server.
rem ============================================================
cd /d "%~dp0"
title VIBE CODING BOOTCAMP - close this window to stop

echo.
echo  =============================================
echo   VIBE CODING BOOTCAMP
echo   URL : http://localhost:8888
echo   STOP: close this window
echo  =============================================
echo.

rem ---- check python ----
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Install it from https://www.python.org/
    echo.
    pause
    exit /b 1
)

rem ---- open browser (Chrome if available, else default browser) ----
start chrome "http://localhost:8888" 2>nul || start "" "http://localhost:8888"

rem ---- start server (keeps running in this window) ----
python -m http.server 8888

rem ---- if the server exits/fails, keep window open to show the reason ----
echo.
echo [INFO] Server stopped.
pause
