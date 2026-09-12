/**
 * RiderXO Instant Local Fare & Vehicle Calculation Engine (0ms Execution)
 * Immediately generates accurate distance, duration, and vehicle fares on-device
 * without waiting for remote backend network round-trips.
 */

export const calculateAerialDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.0;
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
  return Math.max(0.8, Number((R * c).toFixed(1)));
};

export const getInstantFareEstimate = (pickup, drop) => {
  if (!pickup?.lat || !drop?.lat) return null;

  const aerial = calculateAerialDistance(pickup.lat, pickup.lng, drop.lat, drop.lng);
  const distance = Math.max(0.8, Number((aerial * 1.3).toFixed(1)));
  const duration = Math.max(2, Math.ceil(distance * 3.2));

  // 1. BIKE (Standard Moto)
  const bikeBase = 25;
  const bikeRateKm = 6.8;
  const bikeDistCharge = distance > 1.5 ? (distance - 1.5) * bikeRateKm : 0;
  const bikeTimeCharge = duration * 0.15;
  const bikeFare = Math.max(bikeBase, Math.round(bikeBase + bikeDistCharge + bikeTimeCharge));

  // 2. BIKE LITE (Budget Solo)
  const bikeLiteBase = 20;
  const bikeLiteRateKm = 6.0;
  const bikeLiteDistCharge = distance > 1.5 ? (distance - 1.5) * bikeLiteRateKm : 0;
  const bikeLiteFare = Math.max(bikeLiteBase, Math.round(bikeLiteBase + bikeLiteDistCharge));

  // 3. AUTO LITE (Budget Auto)
  const autoLiteBase = 35;
  const autoLiteRateKm = 12.5;
  const autoLiteDistCharge = distance > 1.5 ? (distance - 1.5) * autoLiteRateKm : 0;
  const autoLiteFare = Math.max(autoLiteBase, Math.round(autoLiteBase + autoLiteDistCharge));

  // 4. AUTO (Standard 3-Seater)
  const autoBase = 40;
  const autoRateKm = 15.5;
  const autoDistCharge = distance > 1.5 ? (distance - 1.5) * autoRateKm : 0;
  const autoFare = Math.max(autoBase, Math.round(autoBase + autoDistCharge));

  // 5. CAB ECONOMY (Compact AC Hatchback)
  const cabEcoBase = 65;
  const cabEcoRateKm = 13.5;
  const cabEcoDistCharge = distance > 1.5 ? (distance - 1.5) * cabEcoRateKm : 0;
  const cabEconomyFare = Math.max(cabEcoBase, Math.round(cabEcoBase + cabEcoDistCharge));

  // 6. CAB PREMIUM (Top-Rated Sedan / SUV)
  const cabPremBase = 85;
  const cabPremRateKm = 17.0;
  const cabPremDistCharge = distance > 1.5 ? (distance - 1.5) * cabPremRateKm : 0;
  const cabPremiumFare = Math.max(cabPremBase, Math.round(cabPremBase + cabPremDistCharge));

  const now = new Date();
  const formatTime = (addMins) => {
    const d = new Date(now.getTime() + addMins * 60000);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const vehicles = [
    {
      id: 'bike_lite',
      category: 'BIKE',
      name: 'Bike Lite',
      tagline: 'Most pocket-friendly solo ride',
      capacity: 1,
      eta_mins: 2,
      drop_time: formatTime(2 + duration),
      fare: bikeLiteFare,
      base_fare: bikeLiteBase,
      description: 'Fast & ultra-budget motorcycle'
    },
    {
      id: 'bike',
      category: 'BIKE',
      name: 'RiderXO Bike',
      tagline: 'Fastest solo commute with helmet',
      capacity: 1,
      eta_mins: 3,
      drop_time: formatTime(3 + duration),
      fare: bikeFare,
      base_fare: bikeBase,
      description: 'Standard moto with safety helmet'
    },
    {
      id: 'auto_lite',
      category: 'AUTO',
      name: 'Auto Lite',
      tagline: 'Affordable shared doorstep auto',
      capacity: 3,
      eta_mins: 4,
      drop_time: formatTime(4 + duration),
      fare: autoLiteFare,
      base_fare: autoLiteBase,
      description: 'Economical 3-seater auto'
    },
    {
      id: 'auto',
      category: 'AUTO',
      name: 'Auto Rickshaw',
      tagline: 'Dedicated 3-seater doorstep auto',
      capacity: 3,
      eta_mins: 4,
      drop_time: formatTime(4 + duration),
      fare: autoFare,
      base_fare: autoBase,
      description: 'Dedicated 3-seater auto rickshaw'
    },
    {
      id: 'cab_economy',
      category: 'CAB',
      name: 'Cab Economy',
      tagline: 'AC Hatchback at guaranteed low fares',
      capacity: 4,
      eta_mins: 6,
      drop_time: formatTime(6 + duration),
      fare: cabEconomyFare,
      base_fare: cabEcoBase,
      description: 'Comfy AC Hatchback (WagonR / Swift)'
    },
    {
      id: 'cab_premium',
      category: 'CAB',
      name: 'Cab Premium',
      tagline: 'Spacious Sedan / SUV with top drivers',
      capacity: 4,
      eta_mins: 7,
      drop_time: formatTime(7 + duration),
      fare: cabPremiumFare,
      base_fare: cabPremBase,
      description: 'Spacious AC Sedan / Ertiga'
    }
  ];

  return {
    is_serviceable: true,
    distance_km: distance,
    duration_mins: duration,
    fare: bikeFare,
    vehicles: vehicles
  };
};
