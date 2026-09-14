import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  Satellite,
  Map as MapIcon,
  Layers,
  Sparkles,
  Check,
  MapPin,
  ArrowLeft,
  Navigation,
  Compass,
  Loader2
} from 'lucide-react';
import { useDeviceCompass } from '../utils/useDeviceCompass';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;

// High-Visibility 3D Top-Down Road Vehicle SVG Generator (Matching User Provided Vehicle References)
const getTopDownVehicleSvg = (vehicleId = 'bike', heading = 0) => {
  const isAuto = vehicleId.includes('auto');
  const isCab = vehicleId.includes('cab');
  const isPremium = vehicleId === 'cab_premium';
  const isLite = vehicleId.includes('lite');

  if (isAuto) {
    // 🛺 Auto-Rickshaw (Screenshot 2: Green/Yellow Auto & Screenshot 3: White/Blue Auto)
    const isWhiteBlue = isLite;
    const canopyColor = isWhiteBlue ? '#1e293b' : '#FACC15';
    const bodyColor = isWhiteBlue ? '#f8fafc' : '#15803d';
    const accentColor = isWhiteBlue ? '#2563eb' : '#ca8a04';

    return `
      <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out; width: 20px; height: 28px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
        <svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.85));">
          <!-- Directional Road Shadow -->
          <ellipse cx="10" cy="15" rx="8" ry="11" fill="rgba(0,0,0,0.4)" />

          <!-- Front Single Wheel Mudguard & Nose -->
          <path d="M8.8 0.8h2.4l1 2.8h-4.4l1-2.8z" fill="#09090b" />
          <circle cx="10" cy="2.2" r="1" fill="#71717a" />
          <circle cx="10" cy="1" r="0.8" fill="#fef08a" />

          <!-- Front Windshield & Visor -->
          <path d="M4 4.5h12l-1 3.2H5L4 4.5z" fill="${isWhiteBlue ? '#38bdf8' : '#38bdf8'}" fill-opacity="0.9" stroke="${accentColor}" stroke-width="0.8" />
          <line x1="10" y1="4.5" x2="10" y2="7.7" stroke="${accentColor}" stroke-width="0.6" />

          <!-- Auto Driver (Helmet / Cap) -->
          <circle cx="10" cy="9" r="1.8" fill="#18181b" stroke="#3f3f46" stroke-width="0.4" />

          <!-- Canopy Roof -->
          <rect x="2.5" y="7.5" width="15" height="15" rx="3" fill="${canopyColor}" stroke="${accentColor}" stroke-width="0.8" />

          <!-- Lower Body / Passenger Bay -->
          <rect x="2.5" y="18.5" width="15" height="5" rx="1.5" fill="${bodyColor}" stroke="#09090b" stroke-width="0.6" />

          <!-- Roof Ribs -->
          <line x1="5.5" y1="11" x2="14.5" y2="11" stroke="${isWhiteBlue ? '#475569' : '#eab308'}" stroke-width="1.1" stroke-linecap="round" />
          <line x1="5.5" y1="14.5" x2="14.5" y2="14.5" stroke="${isWhiteBlue ? '#475569' : '#eab308'}" stroke-width="1.1" stroke-linecap="round" />
          <line x1="5.5" y1="18" x2="14.5" y2="18" stroke="${isWhiteBlue ? '#475569' : '#eab308'}" stroke-width="1.1" stroke-linecap="round" />

          <!-- Side Mirrors -->
          <rect x="1" y="5.5" width="1.6" height="1.2" rx="0.4" fill="#09090b" />
          <rect x="17.4" y="5.5" width="1.6" height="1.2" rx="0.4" fill="#09090b" />

          <!-- Rear Hazard & Brake Lamps -->
          <circle cx="4.5" cy="22.5" r="0.9" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.3" />
          <circle cx="15.5" cy="22.5" r="0.9" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.3" />
        </svg>
      </div>
    `;
  }

  if (isCab) {
    // 🚗 4-Wheeler Car (Screenshot 1: Left Orange Car & Right Lime Green Car)
    const carColor = isPremium ? '#84CC16' : '#F97316'; // Green for premium, Orange for economy
    const hoodColor = isPremium ? '#65A30D' : '#EA580C';

    return `
      <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out; width: 22px; height: 36px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
        <svg width="22" height="36" viewBox="0 0 22 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.85));">
          <!-- Directional Road Shadow -->
          <ellipse cx="11" cy="19" rx="9" ry="14" fill="rgba(0,0,0,0.4)" />

          <!-- 4 Road Wheels -->
          <rect x="0.2" y="6" width="2" height="5.5" rx="1" fill="#09090b" />
          <rect x="19.8" y="6" width="2" height="5.5" rx="1" fill="#09090b" />
          <rect x="0.2" y="24" width="2" height="5.5" rx="1" fill="#09090b" />
          <rect x="19.8" y="24" width="2" height="5.5" rx="1" fill="#09090b" />

          <!-- Streamlined Car Body Silhouette (Screenshot 1) -->
          <path d="M2.5 12C2.5 4 4.5 1.5 11 1.5S19.5 4 19.5 12V25C19.5 32 17.5 34.5 11 34.5S2.5 32 2.5 25V12Z" fill="${carColor}" stroke="#18181b" stroke-width="0.6" />

          <!-- Front Hood Sculpting Curve -->
          <path d="M4.5 6C4.5 3.5 6.5 2.5 11 2.5S17.5 3.5 17.5 6" stroke="${hoodColor}" stroke-width="0.8" fill="none" />

          <!-- Front White Teardrop Headlights (Screenshot 1) -->
          <ellipse cx="5" cy="3.8" rx="1.6" ry="1" fill="#ffffff" transform="rotate(-15 5 3.8)" />
          <ellipse cx="17" cy="3.8" rx="1.6" ry="1" fill="#ffffff" transform="rotate(15 17 3.8)" />

          <!-- Curved Dark Front Windshield -->
          <path d="M4.2 8.5C5.8 7.5 8.2 7 11 7S16.2 7.5 17.8 8.5L17 13.5C15.5 12.8 13.5 12.5 11 12.5S6.5 12.8 5 13.5L4.2 8.5Z" fill="#18181b" />

          <!-- Side Windows Left & Right -->
          <path d="M3.8 14.5H4.8V22H3.8V14.5Z" fill="#18181b" rx="0.5" />
          <path d="M17.2 14.5H18.2V22H17.2V14.5Z" fill="#18181b" rx="0.5" />

          <!-- Curved Dark Rear Windshield -->
          <path d="M5 23C6.5 23.8 8.5 24.2 11 24.2S15.5 23.8 17 23L17.8 28C16.2 29 13.8 29.5 11 29.5S5.8 29 4.2 28L5 23Z" fill="#18181b" />

          <!-- Side Mirrors (Screenshot 1) -->
          <path d="M1 11.5C0.5 11.5 0 12 0 12.5C0 13.2 1.5 14 2.5 13.5V11.5H1Z" fill="${carColor}" />
          <path d="M21 11.5C21.5 11.5 22 12 22 12.5C22 13.2 20.5 14 19.5 13.5V11.5H21Z" fill="${carColor}" />

          <!-- Rear Red Tail Lamps (Screenshot 1) -->
          <ellipse cx="4.5" cy="33" rx="1.8" ry="0.9" fill="#dc2626" />
          <ellipse cx="17.5" cy="33" rx="1.8" ry="0.9" fill="#dc2626" />
        </svg>
      </div>
    `;
  }

  // 🏍️ Two-Wheeler Motorcycle (Screenshot 4: Classic Cruiser & Screenshot 5: Yellow Sports Bike)
  const isClassic = !isLite;
  const tankColor = isClassic ? '#D4A373' : '#FACC15'; // Tan/Beige for classic, Yellow for sports bike
  const accentColor = isClassic ? '#582F0E' : '#09090b';

  return `
    <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease-out; width: 28px; height: 40px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
      <svg width="28" height="40" viewBox="0 0 28 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 7px rgba(0,0,0,0.85));">
        <!-- Directional Road Shadow -->
        <ellipse cx="14" cy="21" rx="7" ry="15" fill="rgba(0,0,0,0.35)" />
        
        <!-- Front Tire & Rim -->
        <rect x="12.2" y="1" width="3.6" height="8" rx="1.8" fill="#09090b" stroke="#27272a" stroke-width="0.6" />
        <line x1="14" y1="3" x2="14" y2="7" stroke="#71717a" stroke-width="1.2" />

        <!-- Chrome/Black Handlebars -->
        <line x1="6" y1="8" x2="22" y2="8" stroke="${isClassic ? '#e4e4e7' : '#18181b'}" stroke-width="2.5" stroke-linecap="round" />
        <circle cx="5" cy="6" r="1.5" fill="#38bdf8" stroke="#18181b" stroke-width="0.8" />
        <circle cx="23" cy="6" r="1.5" fill="#38bdf8" stroke="#18181b" stroke-width="0.8" />

        <!-- Headlight / Fairing -->
        <circle cx="14" cy="8.5" r="${isClassic ? 2.2 : 3}" fill="${isClassic ? '#fef08a' : tankColor}" stroke="#18181b" stroke-width="0.6" />

        <!-- Fuel Tank -->
        <path d="M9.5 12h9l1.8 7.5h-12.6l1.8-7.5z" fill="${tankColor}" stroke="${accentColor}" stroke-width="1" />

        <!-- Rider Helmet -->
        <circle cx="14" cy="19.5" r="4.2" fill="#09090b" stroke="#3f3f46" stroke-width="0.8" />
        <circle cx="14" cy="19.5" r="3" fill="${tankColor}" />
        <path d="M11 17.5h6l-0.5 2.2h-5L11 17.5z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.4" />

        <!-- Seat (Brown Leather for Classic / Black for Sports) -->
        <rect x="10.5" y="24.5" width="7" height="8.5" rx="2" fill="${isClassic ? '#4A2810' : '#18181b'}" stroke="#27272a" stroke-width="0.6" />

        <!-- Rear Tire & Red LED Brake Light -->
        <rect x="12.2" y="33.5" width="3.6" height="6" rx="1.8" fill="#09090b" />
        <rect x="12" y="34.5" width="4" height="1.8" rx="0.9" fill="#ef4444" stroke="#991b1b" stroke-width="0.4" />
      </svg>
    </div>
  `;
};

const createVehicleMarkerIcon = (vehicleId = 'bike', heading = 0) => {
  const isAuto = vehicleId.includes('auto');
  const isCab = vehicleId.includes('cab');
  const size = isCab ? [20, 34] : isAuto ? [18, 26] : [30, 42];
  const anchor = isCab ? [10, 17] : isAuto ? [9, 13] : [15, 21];

  return L.divIcon({
    className: 'rapido-road-vehicle-marker',
    html: getTopDownVehicleSvg(vehicleId, heading),
    iconSize: size,
    iconAnchor: anchor
  });
};

// Dynamic Google / Rapido Material Blue Dot with Real-Time Rotating Directional Compass Cone
const getCompassUserIconHtml = (heading = 0) => `
  <div style="position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
    <!-- Rotating Compass Flashlight Cone / Beam (Rotates with phone orientation) -->
    <div id="user-compass-beam" style="position: absolute; width: 64px; height: 64px; top: 0; left: 0; pointer-events: none; transform: rotate(${heading}deg); transform-origin: 32px 32px; transition: transform 0.15s ease-out; will-change: transform;">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
        <defs>
          <radialGradient id="compassBeamGrad" cx="32" cy="32" r="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.65" />
            <stop offset="40%" stop-color="#60a5fa" stop-opacity="0.3" />
            <stop offset="85%" stop-color="#93c5fd" stop-opacity="0.08" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0" />
          </radialGradient>
        </defs>
        <path d="M32 32 L13 2 A32 32 0 0 1 51 2 Z" fill="url(#compassBeamGrad)" />
      </svg>
    </div>

    <!-- Soft Blue Accuracy Radar Pulse Wave -->
    <div class="google-live-pulse" style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: radial-gradient(circle, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0) 75%); pointer-events: none;"></div>

    <!-- Outer Accuracy Halo -->
    <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(59, 130, 246, 0.2); border: 1.2px solid rgba(147, 197, 253, 0.4); pointer-events: none;"></div>

    <!-- Core Blue Dot with Directional Pointer (Rotates with compass) -->
    <div id="user-compass-dot" style="position: relative; width: 18px; height: 18px; background: #1d4ed8; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.5), 0 0 10px rgba(59, 130, 246, 0.8); z-index: 2; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: center center; transition: transform 0.15s ease-out; will-change: transform;">
      <svg width="8" height="8" viewBox="0 0 12 12" fill="#ffffff" style="margin-top: -1px;">
        <path d="M6 1 L10 10 L6 8 L2 10 Z" />
      </svg>
    </div>
  </div>
`;

const PICKUP_PIN_BADGE_HTML = `
  <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
    <!-- Green "Pickup Point" Pill Badge -->
    <div style="background: #059669; color: #ffffff; font-size: 11px; font-weight: 800; font-family: system-ui, -apple-system, sans-serif; padding: 4px 10px; border-radius: 12px; white-space: nowrap; border: 1.5px solid #34d399; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></span>
      <span>Pickup Point</span>
    </div>
    <!-- Pin Needle / Stem -->
    <div style="width: 2.5px; height: 12px; background: #059669; margin-top: -1px;"></div>
    <!-- Pin Base Dot -->
    <div style="width: 8px; height: 8px; border-radius: 50%; background: #059669; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.5); margin-top: -2px;"></div>
  </div>
`;

const DROP_ICON_HTML = `
  <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
    <div style="background-color: #EF4444; border: 2.5px solid #ffffff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 8px rgba(0,0,0,0.45), 0 0 12px rgba(239, 68, 68, 0.6);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M4 4v16h2V4H4zm4 0v10h10l-3-5 3-5H8z"/>
      </svg>
    </div>
  </div>
`;

export const InteractiveMap = ({
  center = [23.2599, 77.4126], // Central MP Default
  zoom = 15,
  pickup = null,
  drop = null,
  driverLocation = null,
  nearbyDrivers = [],
  selectedVehicleId = 'bike',
  onLocationSelect = null,
  selectingMode = null,
  isCaptain = false,
  isServiceable = true,
  activeRide = null
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapType, setMapType] = useState('hybrid'); // Default to Google Hybrid
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const tileLayerRef = useRef(null);

  // Real-time hardware device compass orientation (0° - 360°)
  const deviceCompassHeading = useDeviceCompass();

  // Interactive Map Pin Picker state (for 'pickup' or 'drop' map selection)
  const [pickerCenter, setPickerCenter] = useState(null);
  const [pickerAddress, setPickerAddress] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // Real-time 60fps DOM compass orientation sync (Smooth rotate without triggering React / Leaflet re-renders)
  useEffect(() => {
    const beam = document.getElementById('user-compass-beam');
    const dot = document.getElementById('user-compass-dot');
    if (beam) beam.style.transform = `rotate(${deviceCompassHeading}deg)`;
    if (dot) dot.style.transform = `rotate(${deviceCompassHeading}deg)`;
  }, [deviceCompassHeading]);

  // Track map center & reverse geocode when selecting on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectingMode) {
      const c = map.getCenter();
      setPickerCenter(c);

      const onMove = () => {
        setIsMapMoving(true);
        setPickerCenter(map.getCenter());
      };

      let timer = null;
      const onMoveEnd = () => {
        setIsMapMoving(false);
        const centerCoords = map.getCenter();
        setPickerCenter(centerCoords);
        setIsResolvingAddress(true);

        if (timer) clearTimeout(timer);
        timer = setTimeout(async () => {
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${centerCoords.lat}&lon=${centerCoords.lng}&zoom=18&addressdetails=1`,
              { headers: { 'Accept-Language': 'en,hi' } }
            );
            const data = await res.json();
            if (data && data.display_name) {
              setPickerAddress(data.display_name.split(',').slice(0, 3).join(', '));
            } else {
              setPickerAddress(`Location (${centerCoords.lat.toFixed(4)}, ${centerCoords.lng.toFixed(4)})`);
            }
          } catch (e) {
            setPickerAddress(`Location (${centerCoords.lat.toFixed(4)}, ${centerCoords.lng.toFixed(4)})`);
          } finally {
            setIsResolvingAddress(false);
          }
        }, 300);
      };

      map.on('move', onMove);
      map.on('moveend', onMoveEnd);
      onMoveEnd();

      return () => {
        if (timer) clearTimeout(timer);
        map.off('move', onMove);
        map.off('moveend', onMoveEnd);
      };
    }
  }, [selectingMode]);

  const MAP_LAYERS = {
    hybrid: {
      id: 'hybrid',
      name: 'Google Hybrid',
      provider: 'Satellite + Labels',
      tag: 'Hindi/Eng Names',
      url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      options: {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Hybrid'
      }
    },
    arcgis: {
      id: 'arcgis',
      name: 'Crystal HD Satellite',
      provider: 'ArcGIS World Imagery',
      tag: 'Ultra Clear',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: '&copy; Esri &mdash; High-Resolution World Imagery'
      }
    },
    streets: {
      id: 'streets',
      name: 'Street RoadMap',
      provider: 'Google Standard',
      tag: 'Navigation',
      url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      options: {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Google Maps Streets'
      }
    }
  };

  const markersRef = useRef({
    pickup: null,
    drop: null,
    driver: null,
    nearby: [],
    polyline: null
  });

  const simFleetRef = useRef([]);
  const simMarkersRef = useRef([]);
  const realMarkersRef = useRef({});
  const animFrameRef = useRef(null);
  const lastAnchorRef = useRef(null);
  const hasInitiallyCenteredRef = useRef(false);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: false,
        attributionControl: false,
        minZoom: 4,
        maxBoundsViscosity: 1.0
      });

      // Default to Google Hybrid Layer
      const initialLayer = MAP_LAYERS['hybrid'];
      tileLayerRef.current = L.tileLayer(initialLayer.url, initialLayer.options).addTo(map);

      // Clean Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('click', (e) => {
        setShowLayerMenu(false);
        if (onLocationSelect && selectingMode) {
          onLocationSelect({
            lat: Number(e.latlng.lat.toFixed(6)),
            lng: Number(e.latlng.lng.toFixed(6)),
            type: selectingMode
          });
        }
      });

      mapInstanceRef.current = map;
    }
  }, []);

  // 3-Way Layer Switcher
  const handleSelectMapType = (typeKey) => {
    const map = mapInstanceRef.current;
    if (!map || !MAP_LAYERS[typeKey]) return;

    setMapType(typeKey);
    setShowLayerMenu(false);

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const cfg = MAP_LAYERS[typeKey];
    tileLayerRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
  };

  // Update Pickup Marker with Dynamic Compass Heading Cone (Screenshot 3 & 4)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickup && pickup.lat && pickup.lng) {
      const isCustomLocation = pickup.name && !pickup.name.includes('GPS') && !pickup.name.includes('Current Location');
      
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-icon',
        html: isCustomLocation ? PICKUP_PIN_BADGE_HTML : getCompassUserIconHtml(deviceCompassHeading),
        iconSize: isCustomLocation ? [40, 48] : [64, 64],
        iconAnchor: isCustomLocation ? [20, 48] : [32, 32]
      });

      if (markersRef.current.pickup) {
        markersRef.current.pickup.setLatLng([pickup.lat, pickup.lng]);
        markersRef.current.pickup.setIcon(pickupIcon);
      } else {
        markersRef.current.pickup = L.marker([pickup.lat, pickup.lng], {
          icon: pickupIcon,
          draggable: true
        })
          .addTo(map)
          .bindPopup('<b>Live Pickup Location</b> (Drag to adjust)');

        markersRef.current.pickup.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          if (onLocationSelect) {
            onLocationSelect({
              lat: Number(pos.lat.toFixed(6)),
              lng: Number(pos.lng.toFixed(6)),
              type: 'pickup'
            });
          }
        });
      }
      // Auto-center ONLY once on initial GPS fix, NEVER snap while selectingMode is active or when browsing
      if (!selectingMode && (!drop || !drop.lat) && !hasInitiallyCenteredRef.current) {
        hasInitiallyCenteredRef.current = true;
        const currentCenter = map.getCenter();
        const distMeters = currentCenter ? currentCenter.distanceTo([pickup.lat, pickup.lng]) : 999;
        if (distMeters > 15) {
          map.flyTo([pickup.lat, pickup.lng], 17, { duration: 1.0, easeLinearity: 0.25 });
        }
      }
    } else if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = null;
    }
  }, [pickup, drop, selectingMode]);

  // Update Drop Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drop && drop.lat && drop.lng) {
      const dropIcon = L.divIcon({
        className: 'custom-drop-icon',
        html: DROP_ICON_HTML,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (markersRef.current.drop) {
        markersRef.current.drop.setLatLng([drop.lat, drop.lng]);
        markersRef.current.drop.setIcon(dropIcon);
      } else {
        markersRef.current.drop = L.marker([drop.lat, drop.lng], {
          icon: dropIcon,
          draggable: true
        })
          .addTo(map)
          .bindPopup('<b>Drop Destination</b> (Drag to adjust)');

        markersRef.current.drop.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          if (onLocationSelect) {
            onLocationSelect({
              lat: Number(pos.lat.toFixed(6)),
              lng: Number(pos.lng.toFixed(6)),
              type: 'drop'
            });
          }
        });
      }
    } else if (markersRef.current.drop) {
      map.removeLayer(markersRef.current.drop);
      markersRef.current.drop = null;
    }
  }, [drop]);

  // Store real road network coordinates from OSRM
  const localRoadsRef = useRef([]);
  const currentRouteCoordsRef = useRef([]);
  const [roadBranches, setRoadBranches] = useState([]);

  // Fetch real physical road polylines around pickup location using OSRM
  useEffect(() => {
    if (!pickup?.lat || !pickup?.lng) return;

    const p = pickup;
    let isCancelled = false;

    const fetchRoads = async () => {
      const branches = [];
      // Probes in multiple directions (North, South, East, West, NW, SE along highways and streets)
      const testOffsets = [
        [0.009, 0.002],   // North highway corridor
        [-0.009, -0.002], // South highway corridor
        [0.002, 0.008],   // East cross avenue
        [-0.002, -0.008], // West connector road
        [0.007, -0.006],  // Northwest arterial
        [-0.007, 0.006]   // Southeast arterial
      ];

      for (const [dLat, dLng] of testOffsets) {
        if (isCancelled) break;
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${p.lng + dLng},${p.lat + dLat};${p.lng},${p.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]?.geometry?.coordinates) {
            const coords = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
            if (coords.length >= 2) {
              branches.push(coords);
            }
          }
        } catch (e) {
          // Ignore individual probe error
        }
      }

      if (!isCancelled && branches.length > 0) {
        localRoadsRef.current = branches;
        setRoadBranches(branches);
      }
    };

    fetchRoads();

    return () => {
      isCancelled = true;
    };
  }, [pickup]);

  // Real Road-Following Street Routing via Free OSRM Service
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || selectingMode) return;

    let routeOrigin = null;
    let routeDestination = null;
    let routeColor = '#3B82F6';

    // Route Selection based on Ride State
    if (activeRide) {
      if (activeRide.status === 'IN_PROGRESS') {
        // In-Trip: Driver / Pickup -> Drop
        routeOrigin = driverLocation && driverLocation.lat ? driverLocation : pickup;
        routeDestination = drop;
        routeColor = '#3B82F6';
      } else {
        // Approaching Pickup: Driver -> Pickup
        if (driverLocation && driverLocation.lat && pickup && pickup.lat) {
          routeOrigin = driverLocation;
          routeDestination = pickup;
          routeColor = '#F59E0B'; // Amber / Gold for approaching driver
        } else {
          routeOrigin = pickup;
          routeDestination = drop;
          routeColor = '#3B82F6';
        }
      }
    } else if (pickup && drop && pickup.lat && drop.lat) {
      // Standard Booking Mode: Pickup -> Drop
      routeOrigin = pickup;
      routeDestination = drop;
      routeColor = '#3B82F6';
    }

    if (routeOrigin && routeDestination && routeOrigin.lat && routeDestination.lat) {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${routeOrigin.lng},${routeOrigin.lat};${routeDestination.lng},${routeDestination.lat}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          if (data.routes && data.routes[0]) {
            const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            currentRouteCoordsRef.current = coordinates;

            if (markersRef.current.polyline) {
              markersRef.current.polyline.setLatLngs(coordinates);
              markersRef.current.polyline.setStyle({ color: routeColor, weight: 5, opacity: 0.95 });
            } else {
              markersRef.current.polyline = L.polyline(coordinates, {
                color: routeColor,
                weight: 5,
                opacity: 0.95,
                lineJoin: 'round'
              }).addTo(map);
            }

            const bounds = L.latLngBounds(coordinates);
            map.fitBounds(bounds, { paddingTopLeft: [35, 35], paddingBottomRight: [35, 270], maxZoom: 17 });
          } else {
            const fallback = [[routeOrigin.lat, routeOrigin.lng], [routeDestination.lat, routeDestination.lng]];
            currentRouteCoordsRef.current = fallback;
            if (markersRef.current.polyline) {
              markersRef.current.polyline.setLatLngs(fallback);
              markersRef.current.polyline.setStyle({ color: routeColor });
            } else {
              markersRef.current.polyline = L.polyline(fallback, { color: routeColor, weight: 4 }).addTo(map);
            }
            map.fitBounds(fallback, { paddingTopLeft: [35, 35], paddingBottomRight: [35, 270], maxZoom: 17 });
          }
        })
        .catch(() => {
          const fallback = [[routeOrigin.lat, routeOrigin.lng], [routeDestination.lat, routeDestination.lng]];
          currentRouteCoordsRef.current = fallback;
          if (markersRef.current.polyline) {
            markersRef.current.polyline.setLatLngs(fallback);
            markersRef.current.polyline.setStyle({ color: routeColor });
          } else {
            markersRef.current.polyline = L.polyline(fallback, { color: routeColor, weight: 4 }).addTo(map);
          }
          map.fitBounds(fallback, { paddingTopLeft: [35, 35], paddingBottomRight: [35, 270], maxZoom: 17 });
        });
    } else if (markersRef.current.polyline) {
      map.removeLayer(markersRef.current.polyline);
      markersRef.current.polyline = null;
      currentRouteCoordsRef.current = [];
    }
  }, [pickup, drop, driverLocation, activeRide]);

  // Update Active Driver Live GPS Location (Real Satellite GPS updates)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (driverLocation && driverLocation.lat && driverLocation.lng && isServiceable) {
      const vehId = activeRide?.vehicle_id || driverLocation.category?.toLowerCase() || selectedVehicleId;
      const heading = driverLocation.heading || 0;
      const activeVehicleIcon = createVehicleMarkerIcon(vehId, heading);

      const pLat = pickup?.lat;
      const pLng = pickup?.lng;
      let distMeters = 999;
      if (pLat && pLng) {
        const dLat = (driverLocation.lat - pLat) * 111320;
        const dLng = (driverLocation.lng - pLng) * 111320 * Math.cos((pLat * Math.PI) / 180);
        distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      }

      const driverName = activeRide?.driver_name || driverLocation.name || 'Captain Partner';
      const vehicleInfo = activeRide?.vehicle_model || driverLocation.model || 'RiderXO Vehicle';
      const plateInfo = activeRide?.vehicle_number || driverLocation.number || '';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 170px; padding: 2px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #111;">Captain ${driverName}</div>
          <div style="font-size: 11px; color: #4b5563; font-weight: 600;">${vehicleInfo} • ${plateInfo}</div>
          <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 3px; display: flex; align-items: center; gap: 4px;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
            ${distMeters <= 1000 ? `Live GPS (~${distMeters.toFixed(0)}m away)` : `Live GPS (~${(distMeters / 1000).toFixed(1)} km away)`}
          </div>
        </div>
      `;

      if (markersRef.current.driver) {
        markersRef.current.driver.setLatLng([driverLocation.lat, driverLocation.lng]);
        markersRef.current.driver.setIcon(activeVehicleIcon);
        markersRef.current.driver.setPopupContent(popupContent);
      } else {
        markersRef.current.driver = L.marker([driverLocation.lat, driverLocation.lng], {
          icon: activeVehicleIcon,
          zIndexOffset: 1000
        })
          .addTo(map)
          .bindPopup(popupContent);
      }

      // If in Captain mode and no active destination, center map on Captain GPS location
      if (isCaptain && (!drop || !drop.lat)) {
        const currentCenter = map.getCenter();
        const distFromCenter = currentCenter ? currentCenter.distanceTo([driverLocation.lat, driverLocation.lng]) : 999;
        if (distFromCenter > 20) {
          map.flyTo([driverLocation.lat, driverLocation.lng], 19, { duration: 1.0, easeLinearity: 0.25 });
        }
      }
    } else if (markersRef.current.driver) {
      map.removeLayer(markersRef.current.driver);
      markersRef.current.driver = null;
    }
  }, [driverLocation, selectedVehicleId, isCaptain, drop, isServiceable, activeRide, pickup]);

  // Authentic Vehicle Model & Captain Details Generator (Indistinguishable from real drivers)
  const getAuthenticDriverProfile = (category, index) => {
    const drivers = [
      { name: 'Vikram Singh', rating: '4.88', rides: '420+' },
      { name: 'Ramesh Patel', rating: '4.85', rides: '280+' },
      { name: 'Amit Sharma', rating: '4.92', rides: '510+' },
      { name: 'Sunil Verma', rating: '4.81', rides: '190+' },
      { name: 'Praveen Tiwari', rating: '4.90', rides: '340+' }
    ];
    const models = {
      bike: ['Honda Activa 6G', 'Bajaj Pulsar 150', 'Hero Splendor Plus', 'TVS Jupiter', 'Honda Shine'],
      bike_lite: ['Yamaha R15 V4', 'KTM Duke 200', 'Bajaj Pulsar NS200', 'TVS Apache RTR'],
      auto: ['Bajaj RE Compact Auto', 'Piaggio Ape City', 'Mahindra Treo Electric', 'Bajaj Maxima Z'],
      auto_lite: ['Piaggio Ape E-City', 'Mahindra Alfa DX', 'Bajaj Compact Auto'],
      cab_economy: ['Maruti Suzuki WagonR', 'Swift Dzire', 'Hyundai Aura', 'Tata Tigor'],
      cab_premium: ['Honda City VX', 'Hyundai Verna SX', 'Toyota Urban Cruiser', 'Maruti Ciaz Alpha']
    };
    const d = drivers[index % drivers.length];
    const modelList = models[category] || models.bike;
    const model = modelList[index % modelList.length];
    return { ...d, model };
  };

  // Distinct Realistic Continuous Street Circuits per Vehicle Option
  // (Each vehicle type has its own distinct road network, distance tier, and speed)
  const getContinuousStreetCircuits = (pLat, pLng, vehicleId = 'bike') => {
    if (vehicleId === 'bike') {
      // 🏍️ Classic Bike: Close inner neighborhood streets (~150m to ~320m)
      return [
        [
          [pLat + 0.0014, pLng + 0.0010],
          [pLat + 0.0024, pLng + 0.0020],
          [pLat + 0.0020, pLng + 0.0008],
          [pLat + 0.0012, pLng + 0.0002],
          [pLat + 0.0014, pLng + 0.0010]
        ],
        [
          [pLat - 0.0008, pLng - 0.0012],
          [pLat - 0.0018, pLng - 0.0024],
          [pLat - 0.0024, pLng - 0.0012],
          [pLat - 0.0014, pLng - 0.0004],
          [pLat - 0.0008, pLng - 0.0012]
        ],
        [
          [pLat + 0.0004, pLng + 0.0022],
          [pLat + 0.0012, pLng + 0.0032],
          [pLat + 0.0020, pLng + 0.0024],
          [pLat + 0.0010, pLng + 0.0015],
          [pLat + 0.0004, pLng + 0.0022]
        ],
        [
          [pLat - 0.0015, pLng + 0.0012],
          [pLat - 0.0025, pLng + 0.0022],
          [pLat - 0.0020, pLng + 0.0008],
          [pLat - 0.0015, pLng + 0.0012]
        ]
      ];
    }

    if (vehicleId === 'bike_lite') {
      // 🏍️ Sports Bike: Fast inner diagonal corridors (~200m to ~400m)
      return [
        [
          [pLat + 0.0018, pLng - 0.0015],
          [pLat + 0.0030, pLng - 0.0028],
          [pLat + 0.0038, pLng - 0.0018],
          [pLat + 0.0026, pLng - 0.0005],
          [pLat + 0.0018, pLng - 0.0015]
        ],
        [
          [pLat - 0.0015, pLng + 0.0018],
          [pLat - 0.0028, pLng + 0.0032],
          [pLat - 0.0035, pLng + 0.0020],
          [pLat - 0.0022, pLng + 0.0008],
          [pLat - 0.0015, pLng + 0.0018]
        ],
        [
          [pLat + 0.0022, pLng + 0.0020],
          [pLat + 0.0035, pLng + 0.0035],
          [pLat + 0.0042, pLng + 0.0022],
          [pLat + 0.0022, pLng + 0.0020]
        ],
        [
          [pLat - 0.0020, pLng - 0.0022],
          [pLat - 0.0034, pLng - 0.0035],
          [pLat - 0.0040, pLng - 0.0018],
          [pLat - 0.0020, pLng - 0.0022]
        ]
      ];
    }

    if (vehicleId === 'auto') {
      // 🛺 Green & Yellow Auto: Local market & auto stand intersections (~300m to ~550m)
      return [
        [
          [pLat + 0.0025, pLng + 0.0028],
          [pLat + 0.0042, pLng + 0.0045],
          [pLat + 0.0050, pLng + 0.0030],
          [pLat + 0.0035, pLng + 0.0012],
          [pLat + 0.0025, pLng + 0.0028]
        ],
        [
          [pLat - 0.0022, pLng - 0.0025],
          [pLat - 0.0038, pLng - 0.0042],
          [pLat - 0.0048, pLng - 0.0030],
          [pLat - 0.0030, pLng - 0.0010],
          [pLat - 0.0022, pLng - 0.0025]
        ],
        [
          [pLat + 0.0032, pLng - 0.0020],
          [pLat + 0.0048, pLng - 0.0038],
          [pLat + 0.0055, pLng - 0.0022],
          [pLat + 0.0032, pLng - 0.0020]
        ],
        [
          [pLat - 0.0018, pLng + 0.0032],
          [pLat - 0.0032, pLng + 0.0050],
          [pLat - 0.0042, pLng + 0.0035],
          [pLat - 0.0018, pLng + 0.0032]
        ]
      ];
    }

    if (vehicleId === 'auto_lite') {
      // 🛺 White & Blue Auto: Commercial transit rings (~380m to ~680m)
      return [
        [
          [pLat + 0.0035, pLng + 0.0032],
          [pLat + 0.0052, pLng + 0.0050],
          [pLat + 0.0062, pLng + 0.0032],
          [pLat + 0.0045, pLng + 0.0015],
          [pLat + 0.0035, pLng + 0.0032]
        ],
        [
          [pLat - 0.0030, pLng - 0.0035],
          [pLat - 0.0048, pLng - 0.0055],
          [pLat - 0.0058, pLng - 0.0038],
          [pLat - 0.0038, pLng - 0.0018],
          [pLat - 0.0030, pLng - 0.0035]
        ],
        [
          [pLat + 0.0015, pLng - 0.0040],
          [pLat + 0.0030, pLng - 0.0062],
          [pLat + 0.0045, pLng - 0.0045],
          [pLat + 0.0015, pLng - 0.0040]
        ],
        [
          [pLat - 0.0025, pLng + 0.0042],
          [pLat - 0.0040, pLng + 0.0065],
          [pLat - 0.0052, pLng + 0.0048],
          [pLat - 0.0025, pLng + 0.0042]
        ]
      ];
    }

    if (vehicleId === 'cab_economy') {
      // 🚗 Orange 4-Wheeler Car: Main avenue corridors & city blocks (~450m to ~850m)
      return [
        [
          [pLat + 0.0042, pLng + 0.0038],
          [pLat + 0.0065, pLng + 0.0058],
          [pLat + 0.0078, pLng + 0.0038],
          [pLat + 0.0055, pLng + 0.0018],
          [pLat + 0.0042, pLng + 0.0038]
        ],
        [
          [pLat - 0.0038, pLng - 0.0042],
          [pLat - 0.0060, pLng - 0.0065],
          [pLat - 0.0072, pLng - 0.0045],
          [pLat - 0.0048, pLng - 0.0022],
          [pLat - 0.0038, pLng - 0.0042]
        ],
        [
          [pLat + 0.0028, pLng - 0.0050],
          [pLat + 0.0048, pLng - 0.0075],
          [pLat + 0.0065, pLng - 0.0055],
          [pLat + 0.0028, pLng - 0.0050]
        ],
        [
          [pLat - 0.0035, pLng + 0.0052],
          [pLat - 0.0055, pLng + 0.0078],
          [pLat - 0.0068, pLng + 0.0055],
          [pLat - 0.0035, pLng + 0.0052]
        ]
      ];
    }

    // 🚗 Lime Green Cab Premium: Major arterial roads & outer expressways (~650m to ~1300m)
    return [
      [
        [pLat + 0.0060, pLng + 0.0055],
        [pLat + 0.0090, pLng + 0.0085],
        [pLat + 0.0105, pLng + 0.0055],
        [pLat + 0.0075, pLng + 0.0025],
        [pLat + 0.0060, pLng + 0.0055]
      ],
      [
        [pLat - 0.0055, pLng - 0.0060],
        [pLat - 0.0085, pLng - 0.0090],
        [pLat - 0.0100, pLng - 0.0065],
        [pLat - 0.0068, pLng - 0.0032],
        [pLat - 0.0055, pLng - 0.0060]
      ],
      [
        [pLat + 0.0045, pLng - 0.0075],
        [pLat + 0.0072, pLng - 0.0110],
        [pLat + 0.0095, pLng - 0.0080],
        [pLat + 0.0045, pLng - 0.0075]
      ],
      [
        [pLat - 0.0050, pLng + 0.0075],
        [pLat - 0.0078, pLng + 0.0110],
        [pLat - 0.0095, pLng + 0.0080],
        [pLat - 0.0050, pLng + 0.0075]
      ]
    ];
  };

  // 1. Sync Real Online Drivers on Map (Authentic Live Captain Cards)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isServiceable || isCaptain || activeRide) {
      Object.values(realMarkersRef.current).forEach((m) => map.removeLayer(m));
      realMarkersRef.current = {};
      return;
    }

    const getCategoryGroup = (vId = '') => {
      const lower = String(vId).toLowerCase();
      if (lower.includes('auto')) return 'auto';
      if (lower.includes('cab') || lower.includes('car')) return 'cab';
      return 'bike';
    };

    const activeCategory = getCategoryGroup(selectedVehicleId);
    const currentDriverIds = new Set();
    const pLat = pickup?.lat || center[0];
    const pLng = pickup?.lng || center[1];

    if (Array.isArray(nearbyDrivers)) {
      nearbyDrivers.forEach((d) => {
        if (!d.lat || !d.lng || d.is_online === false) return;

        const driverCategory = getCategoryGroup(d.vehicle_category || d.vehicle_id || 'bike');
        if (driverCategory !== activeCategory) return;

        const dId = d.id || `${d.lat}_${d.lng}`;
        currentDriverIds.add(dId);

        const dLat = Number(d.lat);
        const dLng = Number(d.lng);
        const distM = Math.hypot((dLat - pLat) * 111320, (dLng - pLng) * 111320 * Math.cos(((pLat + dLat) / 2 * Math.PI) / 180));
        const etaMins = Math.max(1, Math.round(distM / 350));

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 175px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <b style="font-size: 12.5px; color: #111;">Captain ${d.name || 'Partner'}</b>
              <span style="font-size: 10.5px; font-weight: 800; color: #d97706; background: #fef3c7; padding: 1px 5px; border-radius: 4px;">★ ${d.rating || '4.85'}</span>
            </div>
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 3px;">${d.vehicle_model || (activeCategory === 'auto' ? 'Auto Rickshaw' : activeCategory === 'cab' ? 'Cab Sedan' : 'RiderXO Bike')}</div>
            <div style="font-size: 10px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
              Available • ${etaMins} min away
            </div>
          </div>
        `;

        if (realMarkersRef.current[dId]) {
          realMarkersRef.current[dId].setLatLng([dLat, dLng]);
          realMarkersRef.current[dId].setIcon(createVehicleMarkerIcon(selectedVehicleId, d.heading || 0));
          realMarkersRef.current[dId].setPopupContent(popupHtml);
        } else {
          const m = L.marker([dLat, dLng], {
            icon: createVehicleMarkerIcon(selectedVehicleId, d.heading || 0)
          })
            .addTo(map)
            .bindPopup(popupHtml);
          realMarkersRef.current[dId] = m;
        }
      });
    }

    Object.keys(realMarkersRef.current).forEach((id) => {
      if (!currentDriverIds.has(id)) {
        map.removeLayer(realMarkersRef.current[id]);
        delete realMarkersRef.current[id];
      }
    });
  }, [nearbyDrivers, isServiceable, isCaptain, activeRide, selectedVehicleId, pickup, center]);

  // Active Live Driver Smooth 60fps Road Driving Animation State
  const activeDriverSimRef = useRef({
    lat: 0,
    lng: 0,
    heading: 0,
    segmentIndex: 0,
    progress: 0.0,
    speed: 0.000080, // ~30 km/h smooth cruising speed
    lastUpdateTime: 0,
    routeCoords: []
  });

  // 2. Persistent, Organic Simulated Fleet & Smooth Continuous Animation Loop
  // (SPAWNS UNIQUE ROAD POSITIONS & REALISTIC DISTANCES FOR EACH VEHICLE OPTION)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const getCategoryGroup = (vId = '') => {
      const lower = String(vId).toLowerCase();
      if (lower.includes('auto')) return 'auto';
      if (lower.includes('cab') || lower.includes('car')) return 'cab';
      return 'bike';
    };

    const activeCategory = getCategoryGroup(selectedVehicleId);

    // Count real online drivers matching this specific selected category
    const realDriversCount = Array.isArray(nearbyDrivers)
      ? nearbyDrivers.filter((d) => {
          if (!d.lat || !d.lng || d.is_online === false) return false;
          const driverCategory = getCategoryGroup(d.vehicle_category || d.vehicle_id || 'bike');
          return driverCategory === activeCategory;
        }).length
      : 0;

    const targetSimCount = Math.max(0, 4 - realDriversCount);

    // If not serviceable, in Captain mode, or on an active ride, stop simulation
    if (!isServiceable || isCaptain || activeRide || targetSimCount === 0) {
      simMarkersRef.current.forEach((m) => map.removeLayer(m));
      simMarkersRef.current = [];
      simFleetRef.current = [];
      lastAnchorRef.current = null;
    } else {
      const pLat = pickup?.lat || center[0];
      const pLng = pickup?.lng || center[1];

      // Always clear previous vehicle markers when switching vehicle type so new distinct positions appear
      simMarkersRef.current.forEach((m) => map.removeLayer(m));
      simMarkersRef.current = [];

      lastAnchorRef.current = { lat: pLat, lng: pLng, vehicleId: selectedVehicleId };

      // Dedicated road circuits specifically configured for this vehicle option
      const vehicleCircuits = getContinuousStreetCircuits(pLat, pLng, selectedVehicleId);

      const newFleet = [];
      const newMarkers = [];

      for (let i = 0; i < targetSimCount; i++) {
        const path = vehicleCircuits[i % vehicleCircuits.length];
        if (!path || path.length < 2) continue;

        const profile = getAuthenticDriverProfile(selectedVehicleId, i);
        const segIdx = Math.min(i, path.length - 2);
        const p1 = path[segIdx];
        const p2 = path[segIdx + 1];
        const dLat = p2[0] - p1[0];
        const dLng = p2[1] - p1[1];
        const initialHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

        const initialProgress = 0.15 + (i * 0.28) % 0.7;
        const initialLat = p1[0] + dLat * initialProgress;
        const initialLng = p1[1] + dLng * initialProgress;
        const distM = Math.hypot((initialLat - pLat) * 111320, (initialLng - pLng) * 111320 * Math.cos(((pLat + initialLat) / 2 * Math.PI) / 180));
        const etaMins = Math.max(2, Math.round(distM / 350) || 3);

        const vehicle = {
          id: `driver_${selectedVehicleId}_${i}`,
          name: profile.name,
          rating: profile.rating,
          vehicleModel: profile.model,
          path: path,
          segmentIndex: segIdx,
          progress: initialProgress,
          direction: i % 2 === 0 ? 1 : -1,
          speed: 0.000055 + (i % 3) * 0.000014, // Realistic road cruising speed
          pauseRemaining: 0,
          distM: distM,
          lat: initialLat,
          lng: initialLng,
          heading: initialHeading
        };

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 175px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
              <b style="font-size: 12.5px; color: #111;">Captain ${vehicle.name}</b>
              <span style="font-size: 10.5px; font-weight: 800; color: #d97706; background: #fef3c7; padding: 1px 5px; border-radius: 4px;">★ ${vehicle.rating}</span>
            </div>
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 3px;">${vehicle.vehicleModel}</div>
            <div style="font-size: 10px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
              Available • ${etaMins} min away
            </div>
          </div>
        `;

        const marker = L.marker([initialLat, initialLng], {
          icon: createVehicleMarkerIcon(selectedVehicleId, initialHeading)
        })
          .addTo(map)
          .bindPopup(popupHtml);

        newFleet.push(vehicle);
        newMarkers.push(marker);
      }

      simFleetRef.current = newFleet;
      simMarkersRef.current = newMarkers;
    }

    // 3. Unified 60fps Animation Loop for Both Nearby Fleet AND Live Active Driver Driving Smoothly on the Road
    if (!animFrameRef.current) {
      let lastTime = performance.now();

      const animateLoop = (now) => {
        const dt = Math.min((now - lastTime) / 1000, 0.05); // Capped delta-time for buttery smooth 60fps
        lastTime = now;

        // A. Animate Simulated Nearby Fleet Vehicles (when idle / booking)
        const fleet = simFleetRef.current;
        const markers = simMarkersRef.current;

        fleet.forEach((v, index) => {
          const path = v.path;
          if (!path || path.length < 2) return;

          if (v.pauseRemaining > 0) {
            v.pauseRemaining -= dt;
            return;
          }

          const curDir = v.direction > 0 ? 1 : -1;
          const pFrom = curDir > 0 ? path[v.segmentIndex] : path[v.segmentIndex + 1];
          const pTo = curDir > 0 ? path[v.segmentIndex + 1] : path[v.segmentIndex];

          if (!pFrom || !pTo) return;

          const dLat = pTo[0] - pFrom[0];
          const dLng = pTo[1] - pFrom[1];
          const segDist = Math.max(0.00005, Math.hypot(dLat, dLng));

          v.progress += (v.speed / segDist) * dt;

          if (v.progress >= 1.0) {
            v.progress = 0.0;
            if (v.direction > 0) {
              if (v.segmentIndex >= path.length - 2) {
                v.direction = -1;
                if (Math.random() < 0.25) v.pauseRemaining = 2.0 + Math.random() * 2.5;
              } else {
                v.segmentIndex++;
              }
            } else {
              if (v.segmentIndex <= 0) {
                v.direction = 1;
                if (Math.random() < 0.25) v.pauseRemaining = 2.0 + Math.random() * 2.5;
              } else {
                v.segmentIndex--;
              }
            }
          }

          const activeFrom = v.direction > 0 ? path[v.segmentIndex] : path[v.segmentIndex + 1];
          const activeTo = v.direction > 0 ? path[v.segmentIndex + 1] : path[v.segmentIndex];

          if (activeFrom && activeTo) {
            v.lat = activeFrom[0] + (activeTo[0] - activeFrom[0]) * v.progress;
            v.lng = activeFrom[1] + (activeTo[1] - activeFrom[1]) * v.progress;

            const curDLat = activeTo[0] - activeFrom[0];
            const curDLng = activeTo[1] - activeFrom[1];
            const targetHeading = ((Math.atan2(curDLng, curDLat) * 180) / Math.PI + 360) % 360;

            const diff = ((targetHeading - v.heading) % 360 + 540) % 360 - 180;
            const maxTurnStep = 80 * dt;
            const turnDelta = Math.sign(diff) * Math.min(Math.abs(diff * 3.5 * dt), maxTurnStep);
            v.heading += turnDelta;

            const marker = markers[index];
            if (marker) {
              marker.setLatLng([v.lat, v.lng]);
              const iconEl = marker.getElement();
              if (iconEl && iconEl.firstElementChild) {
                iconEl.firstElementChild.style.transform = `rotate(${v.heading.toFixed(1)}deg)`;
              }
            }
          }
        });

        // B. Animate Live Active Driver Smoothly Along the Road Geometry (Screenshot 4 Parity)
        if (markersRef.current.driver && activeRide) {
          const route = currentRouteCoordsRef.current;
          const ad = activeDriverSimRef.current;

          if (route && route.length >= 2) {
            // Update route reference if changed
            if (ad.routeCoords !== route) {
              ad.routeCoords = route;
              ad.segmentIndex = 0;
              ad.progress = 0.0;
              ad.lat = route[0][0];
              ad.lng = route[0][1];
            }

            const p1 = route[ad.segmentIndex];
            const p2 = route[Math.min(ad.segmentIndex + 1, route.length - 1)];

            if (p1 && p2) {
              const segDLat = p2[0] - p1[0];
              const segDLng = p2[1] - p1[1];
              const segDist = Math.max(0.00003, Math.hypot(segDLat, segDLng));

              // Smoothly progress vehicle along road geometry
              ad.progress += (ad.speed / segDist) * dt;

              if (ad.progress >= 1.0) {
                ad.progress = 0.0;
                if (ad.segmentIndex < route.length - 2) {
                  ad.segmentIndex++;
                }
              }

              const curP1 = route[ad.segmentIndex];
              const curP2 = route[Math.min(ad.segmentIndex + 1, route.length - 1)];

              if (curP1 && curP2) {
                ad.lat = curP1[0] + (curP2[0] - curP1[0]) * ad.progress;
                ad.lng = curP1[1] + (curP2[1] - curP1[1]) * ad.progress;

                const dLat = curP2[0] - curP1[0];
                const dLng = curP2[1] - curP1[1];
                const targetHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

                const diff = ((targetHeading - ad.heading) % 360 + 540) % 360 - 180;
                const maxTurnStep = 90 * dt;
                ad.heading += Math.sign(diff) * Math.min(Math.abs(diff * 4.0 * dt), maxTurnStep);

                markersRef.current.driver.setLatLng([ad.lat, ad.lng]);
                const driverEl = markersRef.current.driver.getElement();
                if (driverEl && driverEl.firstElementChild) {
                  driverEl.firstElementChild.style.transform = `rotate(${ad.heading.toFixed(1)}deg)`;
                }
              }
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(animateLoop);
      };

      animFrameRef.current = requestAnimationFrame(animateLoop);
    }
  }, [isServiceable, isCaptain, activeRide, pickup, center, nearbyDrivers, selectedVehicleId]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, []);

  // GPS Locate Me Button Handler - Zooms to 50-meter street-level precision (Zoom 19)
  const handleLocateMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if ('geolocation' in navigator) {
      // Tier 1: Fast fix immediately (< 100ms)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          map.flyTo([lat, lng], 19, { duration: 0.8, easeLinearity: 0.25 });
          if (onLocationSelect) {
            onLocationSelect({ lat, lng, type: isCaptain ? 'driver' : 'pickup', name: 'My Current Location' });
          }
        },
        null,
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );

      // Tier 2: Refined High Accuracy Fix
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(6));
          const lng = Number(position.coords.longitude.toFixed(6));
          map.flyTo([lat, lng], 19, { duration: 0.6, easeLinearity: 0.25 });
          if (onLocationSelect) {
            onLocationSelect({ lat, lng, type: isCaptain ? 'driver' : 'pickup', name: 'My Current Location' });
          }
        },
        (err) => {
          const targetLat = pickup?.lat || driverLocation?.lat || center[0];
          const targetLng = pickup?.lng || driverLocation?.lng || center[1];
          map.flyTo([targetLat, targetLng], 19, { duration: 0.8, easeLinearity: 0.25 });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      const targetLat = pickup?.lat || driverLocation?.lat || center[0];
      const targetLng = pickup?.lng || driverLocation?.lng || center[1];
      map.flyTo([targetLat, targetLng], 19, { duration: 0.8, easeLinearity: 0.25 });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Action Controls (Top Right: Location Icon + Layer Icon vertically stacked) */}
      <div className="absolute top-24 right-3 z-30 flex flex-col items-end gap-2 pointer-events-auto">
        {/* 1. GPS Locate Button */}
        <button
          onClick={handleLocateMe}
          className="w-8 h-8 bg-gray-900/95 backdrop-blur-md border border-gray-750 rounded-xl text-brand-yellow hover:text-white shadow-xl active:scale-90 transition flex items-center justify-center"
          title="Use My Real Device GPS Location"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* 2. 3-Way Map Layer Switcher Button (Just right side of location icon) */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`w-8 h-8 rounded-xl border backdrop-blur-md shadow-xl active:scale-90 transition flex items-center justify-center ${
              showLayerMenu
                ? 'bg-brand-yellow text-gray-950 border-brand-yellow font-black'
                : 'bg-gray-900/95 text-brand-yellow border-gray-750 hover:text-white'
            }`}
            title="Switch Map Layers (Crystal HD Satellite / Google Hybrid / Streets)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* 3-Way Layer Popover Menu - Sleek & Ultra-Compact for Mobile */}
          {showLayerMenu && (
            <div className="absolute top-9 right-0 w-40 bg-gray-900/95 backdrop-blur-2xl border border-gray-750 p-1.5 rounded-xl shadow-2xl space-y-1 animate-in fade-in-50 zoom-in-95 duration-150 z-30">
              <div className="text-[8.5px] font-bold uppercase text-gray-400 px-1 py-0.5 flex items-center justify-between">
                <span>Map Views</span>
                <span className="text-brand-yellow font-bold">1-Tap</span>
              </div>

              {/* Option 1: Crystal HD Satellite */}
              <button
                onClick={() => handleSelectMapType('arcgis')}
                className={`w-full text-left py-1.5 px-2 rounded-lg border transition flex items-center justify-between ${
                  mapType === 'arcgis'
                    ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                    : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center text-brand-yellow shrink-0">
                    <Sparkles className="w-3 h-3 text-brand-yellow" />
                  </div>
                  <span className="text-[10px] font-bold text-white truncate">Crystal HD</span>
                </div>
                {mapType === 'arcgis' && <Check className="w-3 h-3 text-brand-yellow shrink-0" />}
              </button>

              {/* Option 2: Google Hybrid */}
              <button
                onClick={() => handleSelectMapType('hybrid')}
                className={`w-full text-left py-1.5 px-2 rounded-lg border transition flex items-center justify-between ${
                  mapType === 'hybrid'
                    ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                    : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center text-emerald-400 shrink-0">
                    <Satellite className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold text-white truncate">Google Hybrid</span>
                </div>
                {mapType === 'hybrid' && <Check className="w-3 h-3 text-brand-yellow shrink-0" />}
              </button>

              {/* Option 3: Street RoadMap */}
              <button
                onClick={() => handleSelectMapType('streets')}
                className={`w-full text-left py-1.5 px-2 rounded-lg border transition flex items-center justify-between ${
                  mapType === 'streets'
                    ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                    : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center text-blue-400 shrink-0">
                    <MapIcon className="w-3 h-3 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-white truncate">Street RoadMap</span>
                </div>
                {mapType === 'streets' && <Check className="w-3 h-3 text-brand-yellow shrink-0" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full Interactive "Pick from Map" Overlay (Rapido / Uber Parity) */}
      {selectingMode && (
        <>
          {/* 1. Top Floating Navigation Header */}
          <div className="absolute top-4 left-3.5 right-3.5 z-[1000] flex items-center justify-between bg-gray-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-gray-700 shadow-2xl animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onLocationSelect && onLocationSelect({ type: null })}
                className="p-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white transition active:scale-95 border border-gray-600 shadow cursor-pointer"
                title="Cancel and return"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="text-xs font-black text-white">
                  {selectingMode === 'pickup' ? 'Choose Pickup on Map' : 'Choose Drop Destination'}
                </div>
                <div className="text-[10px] text-gray-400 font-medium">
                  Pan & drag map to position exact door / gate
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                selectingMode === 'pickup'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              }`}
            >
              {selectingMode === 'pickup' ? 'Pickup' : 'Drop'}
            </span>
          </div>

          {/* 2. Center-Screen Floating Animated Map Pin (Points to map center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[999] flex flex-col items-center select-none">
            {/* Dynamic Status Badge above Pin */}
            <div
              className={`px-3 py-1 rounded-xl text-[10px] font-extrabold shadow-2xl border flex items-center gap-1.5 mb-1 transition-all duration-200 ${
                isMapMoving ? 'scale-110 -translate-y-1 opacity-90' : 'scale-100 opacity-100'
              } ${
                selectingMode === 'pickup'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/40'
                  : 'bg-brand-yellow text-gray-950 border-yellow-300 shadow-brand-yellow/40'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span>{selectingMode === 'pickup' ? 'Pickup Point' : 'Drop Point'}</span>
            </div>

            {/* 3D Map Pin SVG with bounce movement */}
            <div
              className={`transition-transform duration-150 ${
                isMapMoving ? '-translate-y-2 scale-110' : 'translate-y-0'
              }`}
            >
              <MapPin
                className={`w-9 h-9 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] ${
                  selectingMode === 'pickup'
                    ? 'text-emerald-400 fill-emerald-500'
                    : 'text-brand-yellow fill-amber-500'
                }`}
              />
            </div>

            {/* Ground Contact Shadow */}
            <div className="w-3.5 h-1.5 bg-black/50 rounded-full blur-[1px] -mt-1"></div>
          </div>

          {/* 3. Bottom Floating Location Confirmation Card */}
          <div className="absolute bottom-6 left-3.5 right-3.5 z-[1000] bg-gray-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-gray-700 shadow-2xl space-y-2.5 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start gap-2.5">
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                  selectingMode === 'pickup'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-brand-yellow/20 text-brand-yellow border-brand-yellow/40'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9.5px] uppercase font-bold text-gray-400 tracking-wider">
                  {selectingMode === 'pickup' ? 'Selected Pickup Point' : 'Selected Drop Destination'}
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">
                  {isResolvingAddress ? (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin text-brand-yellow" />
                      Locating address...
                    </span>
                  ) : (
                    pickerAddress || 'Point on Map'
                  )}
                </div>
              </div>
            </div>

            {/* Confirm Selection CTA Button */}
            <button
              type="button"
              onClick={() => {
                if (pickerCenter && onLocationSelect) {
                  onLocationSelect({
                    lat: Number(pickerCenter.lat.toFixed(6)),
                    lng: Number(pickerCenter.lng.toFixed(6)),
                    type: selectingMode,
                    name: pickerAddress || `Location (${pickerCenter.lat.toFixed(4)}, ${pickerCenter.lng.toFixed(4)})`
                  });
                }
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                selectingMode === 'pickup'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-emerald-500/30'
                  : 'bg-brand-yellow hover:bg-yellow-400 text-gray-950 shadow-brand-yellow/30'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                Confirm {selectingMode === 'pickup' ? 'Pickup Location' : 'Drop Destination'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
