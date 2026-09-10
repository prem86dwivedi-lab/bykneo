import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Check if the application is running inside a native Android / iOS wrapper (Capacitor)
 */
export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Calculate forward azimuth bearing angle (0° - 360°) between two coordinates
 */
export const calculateBearing = (startLat, startLng, endLat, endLng) => {
  if (!startLat || !startLng || !endLat || !endLng) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const dLng = toRad(endLng - startLng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

/**
 * Calculate distance in meters using Haversine formula
 */
export const distanceMeters = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371000; // Earth radius in meters
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

/**
 * Request high-precision location permission from Android OS or Browser
 */
export const requestLocationPermissions = async () => {
  try {
    if (isNativeApp()) {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted' || status.coarseLocation === 'granted';
    }
    if ('permissions' in navigator) {
      const p = await navigator.permissions.query({ name: 'geolocation' });
      return p.state === 'granted' || p.state === 'prompt';
    }
    return true;
  } catch (err) {
    console.warn('[Location] Permission check fallback:', err);
    return true;
  }
};

/**
 * Get current one-shot high accuracy position
 */
export const getPreciseCurrentPosition = async () => {
  if (isNativeApp()) {
    try {
      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      return {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        heading: pos.coords.heading || 0,
        speed: pos.coords.speed || 0,
        accuracy: pos.coords.accuracy || 5
      };
    } catch (err) {
      console.warn('[Native GPS] Fallback to browser GPS:', err);
    }
  }

  // Browser / PWA fallback
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          heading: pos.coords.heading || 0,
          speed: pos.coords.speed || 0,
          accuracy: pos.coords.accuracy || 10
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
};

/**
 * Continuous high-frequency location watcher with Jitter Deadband
 */
export const watchPreciseLocation = (onLocationUpdate, onError) => {
  let lastCoord = null;

  const handleCoords = (lat, lng, headingRaw, speed, accuracy) => {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    let heading = headingRaw || 0;
    if (lastCoord) {
      const dist = distanceMeters(lastCoord.lat, lastCoord.lng, lat, lng);
      // Jitter deadband: ignore sensor micro-jumps < 2.5 meters
      if (dist < 2.5) {
        return;
      }
      // Calculate real heading based on physical displacement
      if (dist >= 3.0) {
        heading = calculateBearing(lastCoord.lat, lastCoord.lng, lat, lng);
      }
    }

    lastCoord = { lat, lng };
    onLocationUpdate({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      heading: Math.round(heading),
      speed: Math.round(speed || 0),
      accuracy: Math.round(accuracy || 0)
    });
  };

  if (isNativeApp()) {
    let watchId = null;
    Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      (pos, err) => {
        if (err) {
          if (onError) onError(err);
          return;
        }
        if (pos && pos.coords) {
          handleCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.heading,
            pos.coords.speed,
            pos.coords.accuracy
          );
        }
      }
    ).then((id) => {
      watchId = id;
    });

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }

  // Browser / PWA continuous watcher
  if ('geolocation' in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        handleCoords(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.heading,
          pos.coords.speed,
          pos.coords.accuracy
        );
      },
      (err) => {
        if (onError) onError(err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }

  return () => {};
};
