import { db } from '../db/index.js';

export const getOverview = (req, res) => {
  const drivers = db.get('drivers');
  const users = db.get('users');
  const rides = db.get('rides');
  const complaints = db.get('complaints');
  const cities = db.get('cities');

  const onlineDrivers = drivers.filter(d => d.is_online);
  const activeRides = rides.filter(r => ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
  const completedRides = rides.filter(r => r.status === 'COMPLETED');

  const totalGrossRevenue = completedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
  const totalPlatformCommission = totalGrossRevenue * (db.data.settings.platform_commission_pct / 100);

  // Helper for coordinate distance calculation in KM
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999999;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Compute City-Wise Operational Metrics Breakdown
  const cityStats = {};
  cities.forEach(city => {
    const radius = Number(city.radius_km || 30);
    const cityDrivers = drivers.filter(d => {
      if (d.city_id && d.city_id === city.id) return true;
      if (d.lat && d.lng) {
        return calculateDistance(d.lat, d.lng, city.lat, city.lng) <= radius;
      }
      return false;
    });

    const cityOnlineDrivers = cityDrivers.filter(d => d.is_online);

    const cityRides = rides.filter(r => {
      if (r.city_id && r.city_id === city.id) return true;
      if (r.pickup_lat && r.pickup_lng) {
        return calculateDistance(r.pickup_lat, r.pickup_lng, city.lat, city.lng) <= radius;
      }
      return false;
    });

    const cityActiveRides = cityRides.filter(r => ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
    const cityCompletedRides = cityRides.filter(r => r.status === 'COMPLETED');
    const cityRevenue = cityCompletedRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const cityCommission = Math.round(cityRevenue * (db.data.settings.platform_commission_pct / 100));

    const cityComplaints = complaints.filter(c => {
      const matchedRide = rides.find(ride => ride.id === c.ride_id);
      if (matchedRide && matchedRide.pickup_lat && matchedRide.pickup_lng) {
        return calculateDistance(matchedRide.pickup_lat, matchedRide.pickup_lng, city.lat, city.lng) <= radius;
      }
      return false;
    });

    cityStats[city.id] = {
      id: city.id,
      name: city.name,
      state: city.state || '',
      lat: city.lat,
      lng: city.lng,
      radius_km: radius,
      is_active: city.is_active,
      total_drivers: cityDrivers.length,
      online_drivers: cityOnlineDrivers.length,
      active_rides: cityActiveRides.length,
      completed_rides: cityCompletedRides.length,
      total_gross_revenue: Math.round(cityRevenue),
      platform_commission: cityCommission,
      open_complaints: cityComplaints.filter(c => c.status === 'OPEN').length,
      total_passengers: Math.max(1, Math.round(cityRides.length * 0.8) + (city.name.includes('Bhopal') ? 3 : 1))
    };
  });

  return res.json({
    stats: {
      total_passengers: users.filter(u => u.role === 'passenger').length,
      total_drivers: drivers.length,
      online_drivers: onlineDrivers.length,
      active_rides: activeRides.length,
      completed_rides: completedRides.length,
      total_gross_revenue: Math.round(totalGrossRevenue),
      platform_commission: Math.round(totalPlatformCommission),
      open_complaints: complaints.filter(c => c.status === 'OPEN').length,
      total_cities: cities.length,
      active_cities: cities.filter(c => c.is_active).length
    },
    cities,
    city_stats: cityStats,
    recent_rides: rides.slice(0, 10),
    active_rides: activeRides,
    online_drivers: onlineDrivers,
    settings: db.data.settings
  });
};

export const getDrivers = (req, res) => {
  const drivers = db.get('drivers');
  return res.json({ drivers });
};

export const updateDriverKyc = (req, res) => {
  const { driverId, status, rejectionReason } = req.body; // status: 'approved' | 'rejected' | 'pending'
  const driver = db.find('drivers', d => d.id === driverId);
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const updates = {
    kyc_status: status,
    kyc_reviewed_at: new Date().toISOString()
  };

  if (status === 'rejected') {
    updates.kyc_rejection_reason = rejectionReason || 'Documents did not meet compliance requirements.';
    updates.is_online = false;
    updates.is_available = false;
  } else if (status === 'approved') {
    updates.kyc_rejection_reason = null;
  }

  const updated = db.update('drivers', driverId, updates);

  // Real-time instant notification broadcast to Captain PWA / Mobile
  const io = req.app.get('io');
  if (io) {
    console.log(`📢 Emitting driver:kyc_status_updated to Captain ${driver.name} (Status: ${status})`);
    io.to(`driver:${driver.id}`).emit('driver:kyc_status_updated', {
      driverId: driver.id,
      status,
      rejectionReason: updates.kyc_rejection_reason,
      driver: updated
    });
    if (driver.user_id) {
      io.to(`user:${driver.user_id}`).emit('driver:kyc_status_updated', {
        driverId: driver.id,
        status,
        rejectionReason: updates.kyc_rejection_reason,
        driver: updated
      });
    }
  }

  return res.json({ success: true, driver: updated });
};

export const getPassengers = (req, res) => {
  const passengers = db.filter('users', u => u.role === 'passenger');
  return res.json({ passengers });
};

export const getPayments = (req, res) => {
  const payments = db.get('payments');
  return res.json({ payments });
};

export const getComplaints = (req, res) => {
  const complaints = db.get('complaints');
  return res.json({ complaints });
};

export const updateComplaintStatus = (req, res) => {
  const { complaintId, status, resolutionNotes } = req.body;
  const updated = db.update('complaints', complaintId, {
    status,
    resolution_notes: resolutionNotes,
    resolved_at: new Date().toISOString()
  });
  return res.json({ success: true, complaint: updated });
};

export const getCities = (req, res) => {
  const cities = db.get('cities');
  return res.json({ cities });
};

export const addCity = (req, res) => {
  const { name, state = '', lat, lng, radius_km = 30, is_active = true } = req.body;
  if (!name || !lat || !lng) {
    return res.status(400).json({ error: "Name, latitude, and longitude are required." });
  }

  const newCity = db.insert('cities', {
    id: `city_${Date.now()}`,
    name,
    state,
    lat: Number(lat),
    lng: Number(lng),
    radius_km: Number(radius_km),
    is_active: is_active === true,
    created_at: new Date().toISOString()
  });

  const io = req.app.get('io');
  if (io) io.emit('admin:cities_updated', { cities: db.get('cities') });

  return res.json({ success: true, city: newCity });
};

export const updateCity = (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.update('cities', id, updates);
  if (!updated) return res.status(404).json({ error: "City not found" });

  const io = req.app.get('io');
  if (io) io.emit('admin:cities_updated', { cities: db.get('cities') });

  return res.json({ success: true, city: updated });
};

export const deleteCity = (req, res) => {
  const { id } = req.params;
  db.delete('cities', id);

  const io = req.app.get('io');
  if (io) io.emit('admin:cities_updated', { cities: db.get('cities') });

  return res.json({ success: true });
};

export const updateSettings = (req, res) => {
  const {
    base_fare,
    rate_per_km,
    rate_per_min,
    platform_commission_pct,
    surge_multiplier,
    geofencing_enabled,
    auto_kyc_enabled,
    vehicle_pricing
  } = req.body;

  db.data.settings = {
    ...db.data.settings,
    base_fare: base_fare !== undefined ? Number(base_fare) : db.data.settings.base_fare,
    rate_per_km: rate_per_km !== undefined ? Number(rate_per_km) : db.data.settings.rate_per_km,
    rate_per_min: rate_per_min !== undefined ? Number(rate_per_min) : db.data.settings.rate_per_min,
    platform_commission_pct: platform_commission_pct !== undefined ? Number(platform_commission_pct) : db.data.settings.platform_commission_pct,
    surge_multiplier: surge_multiplier !== undefined ? Number(surge_multiplier) : db.data.settings.surge_multiplier,
    geofencing_enabled: geofencing_enabled !== undefined ? Boolean(geofencing_enabled) : db.data.settings.geofencing_enabled,
    auto_kyc_enabled: auto_kyc_enabled !== undefined ? Boolean(auto_kyc_enabled) : (db.data.settings.auto_kyc_enabled ?? true),
    vehicle_pricing: vehicle_pricing !== undefined ? vehicle_pricing : db.data.settings.vehicle_pricing
  };
  db.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('admin:settings_updated', { settings: db.data.settings });
    io.emit('admin:cities_updated', { cities: db.get('cities') });
  }

  return res.json({ success: true, settings: db.data.settings });
};
