@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo        STARTING RIDERXO RIDE-SHARING ECOSYSTEM
echo ========================================================
echo.

REM Clean stale local ports before starting the stack to prevent blank-screen and port-locked issues.
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /PID %%P /F >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3001 " 2^>nul') do taskkill /PID %%P /F >nul 2>&1
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5000 " 2^>nul') do taskkill /PID %%P /F >nul 2>&1

timeout /t 1 >nul

start "RiderXO Backend (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 2 >nul

start "RiderXO Mobile App (Port 3000)" cmd /k "cd app && npm run dev -- --host 0.0.0.0 --port 3000"
timeout /t 2 >nul

start "RiderXO Admin Dashboard (Port 3001)" cmd /k "cd admin && npm run dev -- --host 0.0.0.0 --port 3001"

echo.
echo ========================================================
echo All 3 RiderXO services launched!
echo.
echo 💻 PC Access:
echo - RiderXO Mobile/PWA App: http://localhost:3000
echo - Admin Dashboard:        http://localhost:3001
echo - Backend REST/Socket:    http://localhost:5000
echo.
echo 📱 Mobile / APK API:
echo - Local Wi-Fi Server:     http://192.168.43.16:5000
echo ========================================================
