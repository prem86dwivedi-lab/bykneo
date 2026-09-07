@echo off
echo ========================================================
echo        STARTING BYKNEO RIDE-SHARING ECOSYSTEM
echo ========================================================
echo.

start "Bykneo Backend (Port 5000)" cmd /k "cd backend && npm start"
timeout /t 2 >nul

start "Bykneo Unified Mobile App (Port 3000)" cmd /k "cd app && npm run dev"
timeout /t 2 >nul

start "Bykneo Admin Dashboard (Port 3001)" cmd /k "cd admin && npm run dev"

echo.
echo ========================================================
echo All 3 Bykneo services launched!
echo.
echo 💻 PC Access:
echo - Unified Mobile App:  http://localhost:3000
echo - Admin Dashboard:     http://localhost:3001
echo - Backend API:         http://localhost:5000
echo.
echo 📱 Mobile Testing (Same Wi-Fi):
echo - Open Mobile Chrome/Safari: http://10.221.152.16:3000
echo ========================================================
