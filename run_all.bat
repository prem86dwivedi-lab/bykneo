@echo off
echo ========================================================
echo        STARTING RIDERXO RIDE-SHARING ECOSYSTEM
echo ========================================================
echo.

start "RiderXO Backend (Port 5000)" cmd /k "cd backend && npm start"
timeout /t 2 >nul

start "RiderXO Mobile App (Port 3000)" cmd /k "cd app && npm run dev"
timeout /t 2 >nul

start "RiderXO Admin Dashboard (Port 3001)" cmd /k "cd admin && npm run dev"

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
