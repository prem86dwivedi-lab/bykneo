import { db } from '../db/index.js';

export const toggleOnline = (req, res) => {
  const { driverId, isOnline } = req.body;
  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (!driver) return res.status(404).json({ error: "Driver profile not found" });

  const updated = db.update('drivers', driver.id, {
    is_online: isOnline,
    is_available: isOnline
  });

  return res.json({ success: true, driver: updated });
};

export const updateLocation = (req, res) => {
  const { driverId, lat, lng, heading } = req.body;
  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (!driver) return res.status(404).json({ error: "Driver profile not found" });

  const updated = db.update('drivers', driver.id, {
    lat: Number(lat),
    lng: Number(lng),
    heading: Number(heading || 0),
    last_ping: new Date().toISOString()
  });

  return res.json({ success: true, driver: updated });
};

export const getEarnings = (req, res) => {
  const { driverId } = req.params;
  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const rides = db.filter('rides', r => r.driver_id === driver.id && r.status === 'COMPLETED');
  
  const totalEarned = rides.reduce((acc, r) => {
    const platformCut = r.fare * (db.data.settings.platform_commission_pct / 100);
    return acc + (r.fare - platformCut);
  }, 0);

  const today = new Date().toISOString().slice(0, 10);
  const todayRides = rides.filter(r => (r.completed_at || r.created_at).startsWith(today));
  const todayEarned = todayRides.reduce((acc, r) => {
    const platformCut = r.fare * (db.data.settings.platform_commission_pct / 100);
    return acc + (r.fare - platformCut);
  }, 0);

  return res.json({
    total_earnings: Math.round(totalEarned),
    today_earnings: Math.round(todayEarned),
    total_completed_trips: rides.length,
    today_trips: todayRides.length,
    rating: driver.rating,
    recent_trips: rides.slice(0, 10)
  });
};

export const getOnlineDrivers = (req, res) => {
  const onlineDrivers = db.filter('drivers', d => d.is_online === true);
  return res.json({ drivers: onlineDrivers });
};

export const updateKyc = (req, res) => {
  const {
    driverId,
    vehicle_id,
    vehicle_category = 'BIKE',
    vehicle_type_name,
    vehicle_model,
    vehicle_number,
    license_number,
    rc_number,
    aadhaar_number,
    payout_upi,
    dl_photo,
    rc_photo,
    aadhaar_photo,
    selfie_photo
  } = req.body;

  const driver = db.find('drivers', d => d.id === driverId || d.user_id === driverId);
  if (!driver) return res.status(404).json({ error: "Driver not found" });

  const isAutoKyc = db.data.settings?.auto_kyc_enabled === true;
  const initialStatus = isAutoKyc ? 'approved' : 'pending';

  const updated = db.update('drivers', driver.id, {
    vehicle_id: vehicle_id || driver.vehicle_id || 'bike',
    vehicle_category: vehicle_category || driver.vehicle_category || 'BIKE',
    vehicle_type_name: vehicle_type_name || driver.vehicle_type_name || 'Bykneo Bike',
    vehicle_model: vehicle_model || driver.vehicle_model,
    vehicle_number: vehicle_number || driver.vehicle_number,
    license_number: license_number || driver.license_number,
    rc_number: rc_number || driver.rc_number,
    aadhaar_number: aadhaar_number || driver.aadhaar_number,
    payout_upi: payout_upi || driver.payout_upi,
    dl_photo: dl_photo || driver.dl_photo,
    rc_photo: rc_photo || driver.rc_photo,
    aadhaar_photo: aadhaar_photo || driver.aadhaar_photo,
    selfie_photo: selfie_photo || driver.selfie_photo,
    kyc_status: initialStatus,
    kyc_verified_mode: isAutoKyc ? 'AI_AUTOMATIC' : 'MANUAL_PENDING',
    kyc_submitted_at: new Date().toISOString()
  });

  // Real-time instant notification broadcast to Admin PWA / Mobile
  const io = req.app.get('io');
  if (io) {
    if (!isAutoKyc) {
      console.log(`📢 Emitting admin:kyc_submitted for Captain ${driver.name} (Manual Review Required)`);
      io.to('admins').emit('admin:kyc_submitted', {
        driverId: driver.id,
        name: driver.name,
        phone: driver.phone,
        vehicle_id: updated.vehicle_id,
        vehicle_category: updated.vehicle_category,
        vehicle_type_name: updated.vehicle_type_name,
        vehicle_model: updated.vehicle_model,
        vehicle_number: updated.vehicle_number,
        submitted_at: updated.kyc_submitted_at
      });
    } else {
      console.log(`⚡ Captain ${driver.name} automatically AI verified and activated!`);
    }
  }

  return res.json({
    success: true,
    driver: updated,
    auto_approved: isAutoKyc
  });
};
