import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

// Calculate aerial distance using Haversine formula (km)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.8, Number((R * c).toFixed(1)));
};

// Calculate exact real road driving distance and duration via OSRM routing engine
export const getRoadDistanceAndDuration = async (pickup_lat, pickup_lng, drop_lat, drop_lng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup_lng},${pickup_lat};${drop_lng},${drop_lat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    const data = await res.json();
    if (data.routes && data.routes[0]) {
      const roadDistanceKm = Number((data.routes[0].distance / 1000).toFixed(1));
      const durationMins = Math.max(1, Math.round(data.routes[0].duration / 60));
      return { distance: Math.max(0.5, roadDistanceKm), duration: durationMins, isRoadRoute: true };
    }
  } catch (err) {
    console.warn('OSRM routing fetch warning, using fallback calculation:', err.message);
  }

  // Fallback: Haversine distance * 1.3 (city road winding curvature factor)
  const aerial = calculateDistance(pickup_lat, pickup_lng, drop_lat, drop_lng);
  const roadEst = Number((aerial * 1.3).toFixed(1));
  return {
    distance: Math.max(0.8, roadEst),
    duration: Math.ceil(roadEst * 3.5),
    isRoadRoute: false
  };
};

export const estimateFare = async (req, res) => {
  const { pickup_lat, pickup_lng, drop_lat, drop_lng } = req.body;
  const settings = db.data.settings || {};
  const cities = (db.get('cities') || []).filter(c => c.is_active);

  // Check Geofencing
  let isServiceable = true;
  let matchedCity = null;

  if (settings.geofencing_enabled && cities.length > 0 && pickup_lat && pickup_lng) {
    matchedCity = cities.find(c => {
      const dist = calculateDistance(pickup_lat, pickup_lng, c.lat, c.lng);
      return dist <= (c.radius_km || 30);
    });

    if (!matchedCity) {
      isServiceable = false;
    }
  }

  const routeInfo = await getRoadDistanceAndDuration(pickup_lat, pickup_lng, drop_lat, drop_lng);
  const distance = routeInfo.distance;
  const duration = routeInfo.duration;

  // Dynamic Vehicle-Specific Pricing from Admin Settings
  const vp = settings.vehicle_pricing || {};
  const surge = Number(settings.surge_multiplier || 1.0);

  // 1. BIKE (Fastest Solo Ride)
  const bikeBase = Number(vp.bike?.base_fare ?? (settings.base_fare || 25));
  const bikeRateKm = Number(vp.bike?.rate_per_km ?? (settings.rate_per_km || 6.8));
  const bikeDistCharge = distance > 1.5 ? (distance - 1.5) * bikeRateKm : 0;
  const bikeTimeCharge = duration * 0.15;
  const standardBikeFare = Math.max(bikeBase, Math.round((bikeBase + bikeDistCharge + bikeTimeCharge) * surge));

  // 2. BIKE LITE (Budget Solo Ride)
  const bikeLiteBase = Number(vp.bike_lite?.base_fare ?? 20);
  const bikeLiteRateKm = Number(vp.bike_lite?.rate_per_km ?? 6.0);
  const bikeLiteDistCharge = distance > 1.5 ? (distance - 1.5) * bikeLiteRateKm : 0;
  const bikeLiteFare = Math.max(bikeLiteBase, Math.round((bikeLiteBase + bikeLiteDistCharge) * surge));

  // 3. AUTO LITE (Budget 3-Seater Auto)
  const autoLiteBase = Number(vp.auto_lite?.base_fare ?? 35);
  const autoLiteRateKm = Number(vp.auto_lite?.rate_per_km ?? 12.5);
  const autoLiteDistCharge = distance > 1.5 ? (distance - 1.5) * autoLiteRateKm : 0;
  const autoLiteFare = Math.max(autoLiteBase, Math.round((autoLiteBase + autoLiteDistCharge) * surge));

  // 4. BYKNEO AUTO (Standard 3-Seater Auto Rickshaw)
  const autoBase = Number(vp.auto?.base_fare ?? 40);
  const autoRateKm = Number(vp.auto?.rate_per_km ?? 15.5);
  const autoDistCharge = distance > 1.5 ? (distance - 1.5) * autoRateKm : 0;
  const autoFare = Math.max(autoBase, Math.round((autoBase + autoDistCharge) * surge));

  // 5. CAB ECONOMY (Compact AC Cab)
  const cabEcoBase = Number(vp.cab_economy?.base_fare ?? 65);
  const cabEcoRateKm = Number(vp.cab_economy?.rate_per_km ?? 13.5);
  const cabEcoDistCharge = distance > 1.5 ? (distance - 1.5) * cabEcoRateKm : 0;
  const cabEconomyFare = Math.max(cabEcoBase, Math.round((cabEcoBase + cabEcoDistCharge) * surge));

  // 6. CAB PREMIUM (Top-Rated Sedan / SUV)
  const cabPremBase = Number(vp.cab_premium?.base_fare ?? 85);
  const cabPremRateKm = Number(vp.cab_premium?.rate_per_km ?? 17.0);
  const cabPremDistCharge = distance > 1.5 ? (distance - 1.5) * cabPremRateKm : 0;
  const cabPremiumFare = Math.max(cabPremBase, Math.round((cabPremBase + cabPremDistCharge) * surge));

  const now = new Date();
  const formatTime = (addMins) => {
    const d = new Date(now.getTime() + addMins * 60000);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const vehicles = [
    {
      id: 'bike_lite',
      category: 'BIKE',
      name: 'Bike Lite',
      tagline: 'Most pocket-friendly solo ride',
      capacity: 1,
      eta_mins: 3,
      drop_time: `Drop ${formatTime(duration + 3)}`,
      fare: bikeLiteFare,
      original_fare: Math.round(bikeLiteFare * 1.22),
      discount_percent: '18% OFF',
      badge: 'LITE'
    },
    {
      id: 'bike',
      category: 'BIKE',
      name: 'Bykneo Bike',
      tagline: 'Fastest solo ride through traffic',
      capacity: 1,
      eta_mins: 2,
      drop_time: `Drop ${formatTime(duration + 2)}`,
      fare: standardBikeFare,
      original_fare: Math.round(standardBikeFare * 1.2),
      badge: 'FASTEST'
    },
    {
      id: 'auto_lite',
      category: 'AUTO',
      name: 'Auto Lite',
      tagline: 'Affordable Auto rides for up to 3',
      capacity: 3,
      eta_mins: 3,
      drop_time: `Drop ${formatTime(duration + 3)}`,
      fare: autoLiteFare,
      original_fare: Math.round(autoLiteFare * 1.18),
      discount_percent: 'OFFER',
      badge: 'POPULAR'
    },
    {
      id: 'auto',
      category: 'AUTO',
      name: 'Bykneo Auto',
      tagline: 'Doorstep 3-seater Auto Rickshaw',
      capacity: 3,
      eta_mins: 3,
      drop_time: `Drop ${formatTime(duration + 3)}`,
      fare: autoFare,
      original_fare: Math.round(autoFare * 1.15),
      badge: null
    },
    {
      id: 'cab_economy',
      category: 'CAB',
      name: 'Cab Economy',
      tagline: 'Comfortable compact AC cab',
      capacity: 4,
      eta_mins: 2,
      drop_time: `Drop ${formatTime(duration + 2)}`,
      fare: cabEconomyFare,
      original_fare: Math.round(cabEconomyFare * 1.2),
      badge: 'AC CAB'
    },
    {
      id: 'cab_premium',
      category: 'CAB',
      name: 'Cab Premium',
      tagline: 'Top-rated drivers & spacious sedan',
      capacity: 4,
      eta_mins: 2,
      drop_time: `Drop ${formatTime(duration + 2)}`,
      fare: cabPremiumFare,
      original_fare: Math.round(cabPremiumFare * 1.2),
      badge: 'PREMIUM'
    }
  ];

  return res.json({
    is_serviceable: isServiceable,
    matched_city: matchedCity ? matchedCity.name : null,
    active_cities: cities.map(c => ({ name: c.name, radius_km: c.radius_km })),
    distance_km: distance,
    duration_mins: duration,
    is_road_route: routeInfo.isRoadRoute,
    fare: standardBikeFare,
    vehicles,
    breakdown: {
      base_fare: settings.base_fare || 25,
      distance_fare: Math.round(Math.max(0, distance - 1.5) * (settings.rate_per_km || 9)),
      time_fare: duration * (settings.rate_per_min || 1),
      surge: `${settings.surge_multiplier || 1.0}x`
    }
  });
};

export const requestRide = (req, res) => {
  const {
    rider_id,
    rider_name,
    rider_phone,
    pickup_name,
    pickup_lat,
    pickup_lng,
    drop_name,
    drop_lat,
    drop_lng,
    fare,
    vehicle_id = 'bike',
    vehicle_name = 'Bykneo Bike',
    vehicle_category = 'BIKE',
    distance_km,
    duration_mins,
    payment_mode = 'CASH'
  } = req.body;

  // Generate 4-digit security OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  const newRide = db.insert('rides', {
    id: `ride_${uuidv4().slice(0, 8)}`,
    rider_id,
    rider_name,
    rider_phone,
    driver_id: null,
    driver_name: null,
    driver_phone: null,
    vehicle_id,
    vehicle_name,
    vehicle_category,
    vehicle_model: null,
    vehicle_number: null,
    pickup_name,
    pickup_lat: Number(pickup_lat),
    pickup_lng: Number(pickup_lng),
    drop_name,
    drop_lat: Number(drop_lat),
    drop_lng: Number(drop_lng),
    fare: Number(fare),
    distance_km: Number(distance_km),
    duration_mins: Number(duration_mins),
    status: 'REQUESTED',
    otp,
    payment_mode,
    payment_status: 'PENDING',
    rider_rating: null,
    driver_rating: null,
    created_at: new Date().toISOString()
  });

  return res.json({
    success: true,
    ride: newRide
  });
};

export const getActiveRideForUser = (req, res) => {
  const { userId, role } = req.query;
  const rides = db.get('rides');

  const active = rides.find(r => {
    const isOngoing = ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status);
    if (role === 'driver') {
      const driver = db.find('drivers', d => d.user_id === userId);
      return isOngoing && driver && r.driver_id === driver.id;
    }
    return isOngoing && r.rider_id === userId;
  });

  return res.json({
    activeRide: active || null
  });
};

export const getUserRides = (req, res) => {
  const { userId, role } = req.query;
  let list = [];
  if (role === 'driver') {
    const driver = db.find('drivers', d => d.user_id === userId);
    list = driver ? db.filter('rides', r => r.driver_id === driver.id) : [];
  } else {
    list = db.filter('rides', r => r.rider_id === userId);
  }

  return res.json({
    rides: list
  });
};

export const rateRide = (req, res) => {
  const { rideId, rating, feedback, ratedBy } = req.body;
  const ride = db.find('rides', r => r.id === rideId);
  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const updates = {};
  if (ratedBy === 'rider') {
    updates.rider_rating = rating;
    updates.rider_feedback = feedback;
  } else {
    updates.driver_rating = rating;
    updates.driver_feedback = feedback;
  }

  const updated = db.update('rides', rideId, updates);
  return res.json({ success: true, ride: updated });
};

export const cancelRide = (req, res) => {
  const { rideId, reason, cancelledBy } = req.body;
  const ride = db.find('rides', r => r.id === rideId);
  if (!ride) return res.status(404).json({ error: "Ride not found" });

  const updated = db.update('rides', rideId, {
    status: 'CANCELLED',
    cancellation_reason: reason,
    cancelled_by: cancelledBy,
    cancelled_at: new Date().toISOString()
  });

  // Free up driver if assigned
  if (ride.driver_id) {
    db.update('drivers', ride.driver_id, { is_available: true });
  }

  return res.json({ success: true, ride: updated });
};
