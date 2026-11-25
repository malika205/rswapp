@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22 LTS from https://nodejs.org/ first.
  pause
  exit /b 1
)
if not exist node_modules\vite\bin\vite.js (
  call npm ci --no-audit --no-fund
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm run dev -- --open
pause
