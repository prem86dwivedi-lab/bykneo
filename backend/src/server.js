import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import rideRoutes from './routes/ride.routes.js';
import driverRoutes from './routes/driver.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { registerSocketHandlers } from './sockets/ride.socket.js';
import { db } from './db/index.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS for web, mobile apps, and admin dashboard
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());

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
  const settings = db.data.settings || {};
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
      active_cities: '/api/cities/active'
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

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 Bykneo Real-time Backend running on port ${PORT}`);
  console.log(`🌐 Local REST API: http://localhost:${PORT}/api`);
  console.log(`🌐 Network REST API: http://0.0.0.0:${PORT}/api`);
  console.log(`⚡ WebSocket Server: ws://localhost:${PORT}`);
  console.log(`=============================================`);
});
