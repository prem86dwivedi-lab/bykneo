import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

export const login = (req, res) => {
  const { phone, role = 'passenger' } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  // Find existing user or create automatically (OTP-less for easy demo/testing)
  let user = db.find('users', u => u.phone === phone);

  if (!user) {
    user = db.insert('users', {
      id: `usr_${uuidv4().slice(0, 8)}`,
      phone,
      name: role === 'driver' ? 'New Captain' : 'New Rider',
      email: `${phone.replace(/\D/g, '')}@bykneo.com`,
      role,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
      wallet_balance: role === 'driver' ? 500.00 : 200.00,
      rating: 5.0,
      created_at: new Date().toISOString()
    });

    if (role === 'driver') {
      db.insert('drivers', {
        id: `drv_${uuidv4().slice(0, 8)}`,
        user_id: user.id,
        name: user.name,
        phone: user.phone,
        vehicle_model: "Honda Activa 6G",
        vehicle_number: "DL 01 AB 0001",
        license_number: "DL-NEW-DRIVER-01",
        is_online: true,
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 5.0,
        total_rides: 0,
        today_earnings: 0.00,
        kyc_status: "approved"
      });
    }
  }

  let driverProfile = null;
  if (user.role === 'driver' || role === 'driver') {
    driverProfile = db.find('drivers', d => d.user_id === user.id);
    if (!driverProfile) {
      driverProfile = db.insert('drivers', {
        id: `drv_${uuidv4().slice(0, 8)}`,
        user_id: user.id,
        name: user.name,
        phone: user.phone,
        vehicle_model: "Bajaj Pulsar 150",
        vehicle_number: "DL 04 EF 9876",
        license_number: "DL-TEMP-998877",
        is_online: true,
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 5.0,
        total_rides: 0,
        today_earnings: 0.00,
        kyc_status: "approved"
      });
    }
  }

  return res.json({
    success: true,
    user,
    driverProfile,
    token: `bykneo_token_${user.id}`
  });
};

export const switchRole = (req, res) => {
  const { userId, newRole } = req.body;
  const user = db.find('users', u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const updatedUser = db.update('users', userId, { role: newRole });
  let driverProfile = null;
  if (newRole === 'driver') {
    driverProfile = db.find('drivers', d => d.user_id === userId);
    if (!driverProfile) {
      driverProfile = db.insert('drivers', {
        id: `drv_${uuidv4().slice(0, 8)}`,
        user_id: userId,
        name: user.name,
        phone: user.phone,
        vehicle_model: "Hero Splendor iSmart",
        vehicle_number: "DL 09 PQ 3456",
        license_number: "DL-SWITCH-01928",
        is_online: true,
        is_available: true,
        lat: 28.6139,
        lng: 77.2090,
        heading: 0,
        rating: 5.0,
        total_rides: 0,
        today_earnings: 0.00,
        kyc_status: "approved"
      });
    }
  }

  return res.json({
    success: true,
    user: updatedUser,
    driverProfile
  });
};

export const getDemoAccounts = (req, res) => {
  const passengers = db.filter('users', u => u.role === 'passenger');
  const drivers = db.get('drivers');
  const admins = db.filter('users', u => u.role === 'admin');

  return res.json({
    passengers,
    drivers,
    admins
  });
};
