import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import rideRoutes from './routes/ride.routes.js';
import driverRoutes from './routes/driver.routes.js';
import adminRoutes from './routes/admin.routes.js';
import pushRoutes from './routes/push.routes.js';
import { registerSocketHandlers } from './sockets/ride.socket.js';
import { db } from './db/index.js';
import { initPush } from './services/push.service.js';

const app = express();
const server = http.createServer(app);

// Enable CORS for web, mobile apps, and admin dashboard
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploaded documents and photos statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Register real-time Socket handlers
registerSocketHandlers(io);

// Public Active Cities endpoint for Rider & Driver Geofencing
app.get('/api/cities/active', (req, res) => {
  const cities = db.get('cities') || [];
  const settings = db.data?.settings || {};
  return res.json({
    geofencing_enabled: settings.geofencing_enabled !== false,
    cities: cities.filter(c => c.is_active !== false)
  });
});

// Root Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: 'Bykneo API & Real-time Server',
    message: '🚀 Bykneo Real-time Backend is running smoothly',
    endpoints: {
      health: '/api/health',
      active_cities: '/api/cities/active',
      auth: '/api/auth'
    },
    time: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Bykneo API & Real-time Server',
    time: new Date().toISOString()
  });
});

import fs from 'fs';

// Direct APK Download Endpoint
app.get(['/bykneo.apk', '/download/bykneo.apk'], (req, res) => {
  const possiblePaths = [
    path.join(__dirname, '../../app/android/app/build/outputs/apk/debug/app-debug.apk'),
    path.join(__dirname, '../../app/android/app/build/outputs/apk/release/app-release-unsigned.apk'),
    path.join(__dirname, '../../app/android/app/build/outputs/apk/release/app-release.apk'),
    path.join(__dirname, '../downloads/bykneo.apk')
  ];
  const apkPath = possiblePaths.find(p => fs.existsSync(p));
  if (apkPath) {
    res.download(apkPath, 'bykneo.apk', {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive'
      }
    });
  } else {
    res.status(404).json({ error: 'APK build not found on server.' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushRoutes);

// Initialise Web Push notification service (generates VAPID keys if not present)
initPush();

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 Bykneo Real-time Backend running on port ${PORT}`);
  console.log(`🌐 Local REST API: http://localhost:${PORT}/api`);
  console.log(`🌐 Network REST API: http://0.0.0.0:${PORT}/api`);
  console.log(`⚡ WebSocket Server: ws://localhost:${PORT}`);
  console.log(`=============================================`);
});
