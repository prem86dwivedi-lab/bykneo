# Bykneo (🏍️ Fast Bike Rides & Mobility Platform)

A full-stack, real-time on-demand bike taxi platform inspired by Rapido & Uber, built with **$0 initial budget** using open-source, high-performance web and mobile technologies.

---

## 🏗️ Architecture & Ecosystem

```
D:\My apps\bykneo\
├── backend/                  # Real-Time Node.js + Express + Socket.IO Server (Port 5000)
│   ├── src/controllers/      # Auth, Rides, Drivers, Admin, Payments
│   ├── src/sockets/          # Live GPS streaming & ride matching engine
│   ├── src/db/               # Persistent database with preloaded test data
│   └── src/server.js         # API & WebSocket entry point
│
├── app/                      # Bykneo Unified App (Port 3000)
│   ├── Passenger Flow:       # Booking, Radar Matching, Live Map Tracking, OTP, Receipts, Ratings
│   ├── Captain Flow:         # Online/Offline, Radar Request Alert, Navigation, OTP Verification, Earnings
│   └── Drawer Menu:          # Book Ride, Find Driver, Live Tracking, My Rides, Wallet, Profile
│
└── admin/                    # Bykneo Admin Operations Portal (Port 3001)
    └── Features:             # Live Fleet Heatmap, Active Rides, Drivers KYC, Passengers, Payments, Complaints
```

---

## 🚀 How to Run

### 1. Start Backend Server (Port 5000)
```bash
cd "D:\My apps\bykneo\backend"
npm start
```

### 2. Start Unified Mobile App (Port 3000)
```bash
cd "D:\My apps\bykneo\app"
npm run dev
```
👉 Open in browser: `http://localhost:3000`

### 3. Start Admin Operations Portal (Port 3001)
```bash
cd "D:\My apps\bykneo\admin"
npm run dev
```
👉 Open in browser: `http://localhost:3001`

---

## ⚡ Live Multi-Device Testing Scenario

1. **Window 1 (Passenger):** Open `http://localhost:3000`, click **Rahul (Rider)** demo login.
2. **Window 2 (Captain):** Open `http://localhost:3000` (in Incognito or another browser), click **Vikram (Captain)** demo login and toggle **"Go Online"**.
3. **Window 3 (Admin):** Open `http://localhost:3001` to observe the live fleet on the map.
4. On Window 1, tap **Book Bykneo Ride**.
5. Window 2 immediately plays a sound alert and shows the 15-second incoming ride request modal!
6. Captain accepts ride $\rightarrow$ Passenger sees Captain details & start OTP.
7. Captain taps **"I Have Arrived"** $\rightarrow$ enters 4-digit OTP $\rightarrow$ starts trip $\rightarrow$ completes trip $\rightarrow$ fare is recorded and credited to Captain's wallet!
