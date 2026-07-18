@echo off
title Music App Dev Launcher
color 0A
echo.
echo  ============================================
echo    Music App - Starting Dev Servers
echo  ============================================
echo.

set ROOT=%~dp0
set PGPASSWORD=postgres
set NODE_BIN=%ROOT%node_modules\.bin

echo [1/3] Starting Backend API   ^(port 5000^)...
start "Backend API" cmd /k "cd /d "%ROOT%backend" && set PGPASSWORD=postgres && set NODE_ENV=development && "%NODE_BIN%\ts-node-dev.cmd" --respawn --transpile-only --exit-child src/server.ts"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Frontend Web  ^(port 3000^)...
start "Frontend Web" cmd /k "cd /d "%ROOT%frontend-web" && "%NODE_BIN%\next.cmd" dev"

timeout /t 2 /nobreak >nul

echo [3/3] Starting Admin Panel   ^(port 3001^)...
start "Admin Panel" cmd /k "cd /d "%ROOT%admin" && "%NODE_BIN%\vite.cmd" --port 3001"

echo.
echo  ============================================
echo   Frontend Web  -^>  http://localhost:3000
echo   Admin Panel   -^>  http://localhost:3001
echo   Backend API   -^>  http://localhost:5000/api
echo   Health Check  -^>  http://localhost:5000/health
echo.
echo   Admin: admin@musicapp.com / Admin@12345
echo  ============================================
echo.
echo  Waiting 35 seconds then opening browser...
timeout /t 35 /nobreak >nul

start http://localhost:3000
start http://localhost:3001
pause
