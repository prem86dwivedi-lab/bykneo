import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Crosshair, Satellite, Map as MapIcon, Layers, Sparkles, Check } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;

// High-Visibility 3D Top-Down Road Vehicle SVG Generator (Rapido / Uber Parity)
const getTopDownVehicleSvg = (vehicleId = 'bike', heading = 0) => {
  const isAuto = vehicleId.includes('auto');
  const isCab = vehicleId.includes('cab');
  const isPremium = vehicleId === 'cab_premium';
  const isLite = vehicleId.includes('lite');

  if (isAuto) {
    // 🛺 High-Visibility Indian Auto-Rickshaw Top View (Breadth reduced to 18px)
    return `
      <div style="transform: rotate(${heading}deg); width: 18px; height: 26px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 5px rgba(0,0,0,0.85));">
          <!-- Directional Road Shadow -->
          <ellipse cx="9" cy="14" rx="7" ry="10" fill="rgba(0,0,0,0.4)" />

          <!-- Front Wheel Mudguard & Nose -->
          <path d="M7.8 0.8h2.4l1 2.8h-4.4l1-2.8z" fill="#09090b" />
          <circle cx="9" cy="2.2" r="1" fill="#71717a" />
          <circle cx="9" cy="1" r="0.8" fill="#fef08a" />

          <!-- Wide Curved Windshield Frame -->
          <path d="M3.8 4.5h10.4l-1 3.2H4.8L3.8 4.5z" fill="#38bdf8" fill-opacity="0.9" stroke="#09090b" stroke-width="0.6" />
          <line x1="9" y1="4.5" x2="9" y2="7.7" stroke="#0284c7" stroke-width="0.5" />

          <!-- Auto Driver (Helmet) -->
          <circle cx="9" cy="8.8" r="1.8" fill="#18181b" stroke="#3f3f46" stroke-width="0.4" />

          <!-- Iconic Indian Yellow Canopy Roof -->
          <rect x="2.5" y="7" width="13" height="15.5" rx="2.5" fill="#FACC15" stroke="#854d0e" stroke-width="0.8" />

          <!-- Vibrant Green Lower Body & Doors -->
          <rect x="2.5" y="18" width="13" height="4.5" rx="1.2" fill="#15803d" stroke="#14532d" stroke-width="0.6" />
          <line x1="2.5" y1="19.2" x2="15.5" y2="19.2" stroke="#facc15" stroke-width="0.5" />

          <!-- Roof Aerodynamic Ribs & Creases -->
          <line x1="5" y1="10" x2="13" y2="10" stroke="#eab308" stroke-width="1.1" stroke-linecap="round" />
          <line x1="5" y1="13.5" x2="13" y2="13.5" stroke="#eab308" stroke-width="1.1" stroke-linecap="round" />
          <line x1="5" y1="17" x2="13" y2="17" stroke="#eab308" stroke-width="1.1" stroke-linecap="round" />

          <!-- Side Mirrors -->
          <rect x="1" y="5.2" width="1.6" height="1.2" rx="0.4" fill="#09090b" />
          <rect x="15.4" y="5.2" width="1.6" height="1.2" rx="0.4" fill="#09090b" />

          <!-- Rear Hazard & Brake Lamps -->
          <circle cx="4.2" cy="21.5" r="0.9" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.3" />
          <circle cx="13.8" cy="21.5" r="0.9" fill="#ef4444" stroke="#7f1d1d" stroke-width="0.3" />
        </svg>
      </div>
    `;
  }

  if (isCab) {
    // 🚗 Sleek High-Visibility Cab / Sedan Top View (Breadth reduced to 20px)
    const bodyColor = isPremium ? '#F59E0B' : '#FBBF24';
    const roofColor = isPremium ? '#09090b' : '#18181b';
    return `
      <div style="transform: rotate(${heading}deg); width: 20px; height: 34px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
        <svg width="20" height="34" viewBox="0 0 20 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.9));">
          <!-- Directional Road Shadow -->
          <ellipse cx="10" cy="18" rx="8" ry="13" fill="rgba(0,0,0,0.45)" />

          <!-- 4 Wide Road Wheels -->
          <rect x="0.2" y="5" width="2" height="5" rx="1" fill="#09090b" />
          <rect x="17.8" y="5" width="2" height="5" rx="1" fill="#09090b" />
          <rect x="0.2" y="22" width="2" height="5" rx="1" fill="#09090b" />
          <rect x="17.8" y="22" width="2" height="5" rx="1" fill="#09090b" />

          <!-- Car Body Silhouette -->
          <rect x="1.8" y="1" width="16.4" height="31" rx="4" fill="${bodyColor}" stroke="#09090b" stroke-width="1" />

          <!-- Front Hood Sculpting -->
          <path d="M3 5c0-2.2 2-3.4 7-3.4s7 1.2 7 3.4v2H3V5z" fill="${isPremium ? '#D97706' : '#F59E0B'}" />

          <!-- Front Windshield (Dark Glossy Glass) -->
          <path d="M3.8 7.2h12.4l-1.3 4H5.1L3.8 7.2z" fill="#09090b" stroke="#38bdf8" stroke-width="0.4" />

          <!-- Roof Panel -->
          <rect x="4.4" y="11.5" width="11.2" height="10.5" rx="1.8" fill="${roofColor}" stroke="#27272a" stroke-width="0.6" />

          <!-- Illuminated Roof Taxi Badge or Sunroof -->
          ${
            !isPremium
              ? `<rect x="6.8" y="15" width="6.4" height="3.2" rx="0.8" fill="#FACC15" stroke="#78350f" stroke-width="0.4" />
                 <text x="10" y="17.4" font-size="2" font-weight="900" text-anchor="middle" fill="#000" font-family="sans-serif">TAXI</text>`
              : `<rect x="6.5" y="13.5" width="7" height="5.5" rx="1" fill="#1e293b" stroke="#38bdf8" stroke-width="0.4" />
                 <circle cx="10" cy="16.2" r="1.3" fill="#facc15" />`
          }

          <!-- Rear Windshield -->
          <path d="M4.8 22.3h10.4l1.1 3.7H3.7l1.1-3.7z" fill="#09090b" stroke="#38bdf8" stroke-width="0.4" />

          <!-- Side Mirrors -->
          <rect x="0.4" y="8" width="1.6" height="2" rx="0.6" fill="#09090b" />
          <rect x="18" y="8" width="1.6" height="2" rx="0.6" fill="#09090b" />

          <!-- Headlights -->
          <circle cx="4.5" cy="2.2" r="1.2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.3" />
          <circle cx="15.5" cy="2.2" r="1.2" fill="#fef08a" stroke="#ca8a04" stroke-width="0.3" />

          <!-- Red Tail Lamps -->
          <rect x="3.8" y="30.5" width="2.8" height="1.2" rx="0.6" fill="#ef4444" />
          <rect x="13.4" y="30.5" width="2.8" height="1.2" rx="0.6" fill="#ef4444" />
        </svg>
      </div>
    `;
  }

  // 🏍️ High-Visibility Sports Motorcycle Top View
  const mainColor = isLite ? '#10B981' : '#FACC15';
  const accentColor = isLite ? '#059669' : '#EAB308';
  return `
    <div style="transform: rotate(${heading}deg); width: 30px; height: 42px; display: flex; align-items: center; justify-content: center; pointer-events: auto; will-change: transform;">
      <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 7px rgba(0,0,0,0.85));">
        <!-- Directional Road Shadow -->
        <ellipse cx="15" cy="22" rx="7" ry="16" fill="rgba(0,0,0,0.35)" />
        
        <!-- Front Tire & Rim -->
        <rect x="13.2" y="1" width="3.6" height="8.5" rx="1.8" fill="#09090b" stroke="#27272a" stroke-width="0.6" />
        <line x1="15" y1="3" x2="15" y2="7" stroke="#71717a" stroke-width="1.2" />

        <!-- Front Fork & Chrome Handlebars -->
        <line x1="6.5" y1="8" x2="23.5" y2="8" stroke="#e4e4e7" stroke-width="2.6" stroke-linecap="round" />
        <rect x="5.5" y="6.8" width="3" height="2.4" rx="1.2" fill="#18181b" />
        <rect x="21.5" y="6.8" width="3" height="2.4" rx="1.2" fill="#18181b" />
        <!-- Rearview Mirrors -->
        <circle cx="5" cy="6" r="1.5" fill="#38bdf8" stroke="#18181b" stroke-width="0.8" />
        <circle cx="25" cy="6" r="1.5" fill="#38bdf8" stroke="#18181b" stroke-width="0.8" />

        <!-- Aerodynamic Front Fairing / Headlight -->
        <path d="M11 9.5h8l1.5 4h-11L11 9.5z" fill="${mainColor}" stroke="#0f172a" stroke-width="0.8" />
        <circle cx="15" cy="9.5" r="1.8" fill="#fef08a" />

        <!-- Fuel Tank (Bold Bright Shape) -->
        <path d="M10 13.5h10l2 7h-14l2-7z" fill="${mainColor}" stroke="${accentColor}" stroke-width="1" />
        <rect x="13.8" y="15" width="2.4" height="4" rx="1.2" fill="#18181b" />

        <!-- Rider Helmet (Top View with Tinted Visor) -->
        <circle cx="15" cy="20.5" r="4.5" fill="#09090b" stroke="#3f3f46" stroke-width="0.8" />
        <circle cx="15" cy="20.5" r="3.2" fill="${mainColor}" />
        <path d="M12 18.5h6l-0.5 2.2h-5L12 18.5z" fill="#38bdf8" stroke="#0284c7" stroke-width="0.4" />

        <!-- Rider Shoulders / Jacket -->
        <path d="M8 25c0-2.5 3-4 7-4s7 1.5 7 4v3.5H8V25z" fill="#18181b" stroke="#27272a" stroke-width="0.6" />
        <rect x="11.5" y="24" width="7" height="4" rx="1.5" fill="#3f3f46" />

        <!-- Long Pillion Seat -->
        <rect x="11.5" y="28.5" width="7" height="7.5" rx="2" fill="#09090b" stroke="#27272a" stroke-width="0.8" />

        <!-- Rear Tire & Exhaust -->
        <rect x="13.2" y="34.5" width="3.6" height="6.5" rx="1.8" fill="#09090b" />
        <rect x="19" y="30" width="1.8" height="7" rx="0.9" fill="#a1a1aa" />

        <!-- Bright Red Tail Brake LED -->
        <rect x="13" y="35.5" width="4" height="1.8" rx="0.9" fill="#ef4444" stroke="#991b1b" stroke-width="0.4" />
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

const PICKUP_ICON_HTML = `
  <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; pointer-events: auto;">
    <!-- Directional Soft Blue Accuracy Beam (Pointing upward / forward) -->
    <div style="position: absolute; width: 56px; height: 56px; top: 0; left: 0; pointer-events: none;">
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
        <defs>
          <radialGradient id="gmBeamGrad" cx="28" cy="28" r="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#4285F4" stop-opacity="0.45" />
            <stop offset="60%" stop-color="#4285F4" stop-opacity="0.18" />
            <stop offset="100%" stop-color="#4285F4" stop-opacity="0" />
          </radialGradient>
        </defs>
        <path d="M28 28 L14 4 A28 28 0 0 1 42 4 Z" fill="url(#gmBeamGrad)" />
      </svg>
    </div>

    <!-- Soft Blue Accuracy Outer Circle -->
    <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(66, 133, 244, 0.16); border: 1px solid rgba(66, 133, 244, 0.32);"></div>

    <!-- Soft Blue Pulsing Radar Wave -->
    <div class="google-live-pulse" style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: radial-gradient(circle, rgba(66, 133, 244, 0.4) 0%, rgba(66, 133, 244, 0) 75%);"></div>

    <!-- Core Google Material Blue Dot with Crisp White Ring -->
    <div style="position: relative; width: 15px; height: 15px; background-color: #1a73e8; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.45), 0 0 8px rgba(26,115,232,0.6); z-index: 2;"></div>
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

  // Update Pickup Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickup && pickup.lat && pickup.lng) {
      const pickupIcon = L.divIcon({
        className: 'custom-pickup-icon',
        html: PICKUP_ICON_HTML,
        iconSize: [56, 56],
        iconAnchor: [28, 28]
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
      if (!drop || !drop.lat) {
        const currentCenter = map.getCenter();
        const distMeters = currentCenter ? currentCenter.distanceTo([pickup.lat, pickup.lng]) : 999;
        if (distMeters > 15) {
          map.flyTo([pickup.lat, pickup.lng], 19, { duration: 1.0, easeLinearity: 0.25 });
        }
      }
    } else if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = null;
    }
  }, [pickup, drop]);

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
    if (!map) return;

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
            map.fitBounds(bounds, { padding: [70, 70] });
          } else {
            const fallback = [[routeOrigin.lat, routeOrigin.lng], [routeDestination.lat, routeDestination.lng]];
            currentRouteCoordsRef.current = fallback;
            if (markersRef.current.polyline) {
              markersRef.current.polyline.setLatLngs(fallback);
              markersRef.current.polyline.setStyle({ color: routeColor });
            } else {
              markersRef.current.polyline = L.polyline(fallback, { color: routeColor, weight: 4 }).addTo(map);
            }
            map.fitBounds(fallback, { padding: [70, 70] });
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
          map.fitBounds(fallback, { padding: [70, 70] });
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
      const vehicleInfo = activeRide?.vehicle_model || driverLocation.model || 'Bykneo Vehicle';
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
      auto: ['Bajaj RE Compact Auto', 'Piaggio Ape City', 'Mahindra Treo Electric', 'Bajaj Maxima Z'],
      cab_economy: ['Maruti Suzuki WagonR', 'Swift Dzire', 'Hyundai Aura', 'Tata Tigor'],
      cab_premium: ['Honda City VX', 'Hyundai Verna SX', 'Toyota Urban Cruiser', 'Maruti Ciaz Alpha']
    };
    const d = drivers[index % drivers.length];
    const catKey = category.includes('cab_premium')
      ? 'cab_premium'
      : category.includes('cab')
      ? 'cab_economy'
      : category.includes('auto')
      ? 'auto'
      : 'bike';
    const modelList = models[catKey] || models.bike;
    const model = modelList[index % modelList.length];
    return { ...d, model };
  };

  // Realistic Continuous Street Circuits (Closed loops around city blocks — NO ping-pong / NO snapping)
  const getContinuousStreetCircuits = (pLat, pLng) => {
    return [
      // Circuit 1: Northeast Urban Block (~200m to ~600m) - Continuous 6-waypoint loop
      [
        [pLat + 0.0018, pLng + 0.0015],
        [pLat + 0.0035, pLng + 0.0032],
        [pLat + 0.0048, pLng + 0.0022],
        [pLat + 0.0042, pLng + 0.0005],
        [pLat + 0.0028, pLng + 0.0002],
        [pLat + 0.0018, pLng + 0.0015]
      ],
      // Circuit 2: Southwest Commercial Sector (~180m to ~550m) - Continuous 6-waypoint loop
      [
        [pLat - 0.0012, pLng - 0.0015],
        [pLat - 0.0028, pLng - 0.0038],
        [pLat - 0.0045, pLng - 0.0032],
        [pLat - 0.0040, pLng - 0.0010],
        [pLat - 0.0025, pLng - 0.0002],
        [pLat - 0.0012, pLng - 0.0015]
      ],
      // Circuit 3: East Arterial Boulevard (~350m to ~800m) - Continuous 6-waypoint loop
      [
        [pLat + 0.0005, pLng + 0.0030],
        [pLat + 0.0015, pLng + 0.0060],
        [pLat + 0.0028, pLng + 0.0055],
        [pLat + 0.0022, pLng + 0.0025],
        [pLat + 0.0012, pLng + 0.0018],
        [pLat + 0.0005, pLng + 0.0030]
      ],
      // Circuit 4: Northwest Residential Avenue (~300m to ~700m) - Continuous 6-waypoint loop
      [
        [pLat + 0.0028, pLng - 0.0010],
        [pLat + 0.0048, pLng - 0.0030],
        [pLat + 0.0058, pLng - 0.0045],
        [pLat + 0.0065, pLng - 0.0025],
        [pLat + 0.0045, pLng - 0.0002],
        [pLat + 0.0028, pLng - 0.0010]
      ],
      // Circuit 5: Southeast Transit Ring (~380m to ~850m) - Continuous 6-waypoint loop
      [
        [pLat - 0.0022, pLng + 0.0020],
        [pLat - 0.0040, pLng + 0.0045],
        [pLat - 0.0055, pLng + 0.0038],
        [pLat - 0.0050, pLng + 0.0015],
        [pLat - 0.0032, pLng + 0.0008],
        [pLat - 0.0022, pLng + 0.0020]
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

        // ONLY show real drivers that match the currently selected vehicle category (Rapido / Uber parity)
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
            <div style="font-size: 11px; color: #4b5563; margin-bottom: 3px;">${d.vehicle_model || (activeCategory === 'auto' ? 'Auto Rickshaw' : activeCategory === 'cab' ? 'Cab Sedan' : 'Bykneo Bike')}</div>
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

    // Remove any offline or non-matching category real drivers
    Object.keys(realMarkersRef.current).forEach((id) => {
      if (!currentDriverIds.has(id)) {
        map.removeLayer(realMarkersRef.current[id]);
        delete realMarkersRef.current[id];
      }
    });
  }, [nearbyDrivers, isServiceable, isCaptain, activeRide, selectedVehicleId, pickup, center]);

  // 2. Update Simulation Vehicle Icons & Popups when selected vehicle type changes
  useEffect(() => {
    if (simMarkersRef.current.length > 0 && simFleetRef.current.length > 0) {
      simMarkersRef.current.forEach((marker, i) => {
        const v = simFleetRef.current[i];
        if (marker && v) {
          const profile = getAuthenticDriverProfile(selectedVehicleId, i);
          v.vehicleModel = profile.model;
          marker.setIcon(createVehicleMarkerIcon(selectedVehicleId, v.heading || 0));

          const etaMins = Math.max(2, Math.round(v.distM / 350) || 3);
          marker.setPopupContent(`
            <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 175px; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
                <b style="font-size: 12.5px; color: #111;">Captain ${v.name}</b>
                <span style="font-size: 10.5px; font-weight: 800; color: #d97706; background: #fef3c7; padding: 1px 5px; border-radius: 4px;">★ ${v.rating}</span>
              </div>
              <div style="font-size: 11px; color: #4b5563; margin-bottom: 3px;">${v.vehicleModel}</div>
              <div style="font-size: 10px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
                Available • ${etaMins} min away
              </div>
            </div>
          `);
        }
      });
    }
  }, [selectedVehicleId]);

  // 3. Persistent, Organic Simulated Fleet & Smooth Continuous Animation Loop
  // (VEHICLES DRIVE STRICTLY ON REAL ASPHALT ROADS & HIGHWAYS FETCHED VIA OSRM)
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

    // Target total fleet on screen = 4 of the selected vehicle type.
    const targetSimCount = Math.max(0, 4 - realDriversCount);

    // If not serviceable, in Captain mode, actively on a ride, or full real drivers available, stop simulation
    if (!isServiceable || isCaptain || activeRide || targetSimCount === 0) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      simMarkersRef.current.forEach((m) => map.removeLayer(m));
      simMarkersRef.current = [];
      simFleetRef.current = [];
      lastAnchorRef.current = null;
      return;
    }

    const pLat = pickup?.lat || center[0];
    const pLng = pickup?.lng || center[1];

    // Check if we need to initialize or re-anchor simulation (initial start or relocation > 2km or new road branches)
    let needsReanchor = false;
    if (!lastAnchorRef.current || simFleetRef.current.length !== targetSimCount) {
      needsReanchor = true;
    } else {
      const distFromAnchor = Math.hypot(
        (pLat - lastAnchorRef.current.lat) * 111320,
        (pLng - lastAnchorRef.current.lng) * 111320
      );
      if (distFromAnchor > 2000) {
        needsReanchor = true;
      }
    }

    // Prefer real OSRM road branches around the pickup point
    const activeRoadBranches = roadBranches.length >= 2 ? roadBranches : localRoadsRef.current;

    if (needsReanchor || (activeRoadBranches.length > 0 && simFleetRef.current.some(v => !v.isOsrmRoad))) {
      // Clean previous simulation markers
      simMarkersRef.current.forEach((m) => map.removeLayer(m));
      simMarkersRef.current = [];

      lastAnchorRef.current = { lat: pLat, lng: pLng };

      // Use real OSRM road branches or snap fallback
      const availableRoads = activeRoadBranches.length > 0
        ? activeRoadBranches
        : getContinuousStreetCircuits(pLat, pLng);

      const newFleet = [];
      const newMarkers = [];

      for (let i = 0; i < targetSimCount; i++) {
        const path = availableRoads[i % availableRoads.length];
        if (!path || path.length < 2) continue;

        const profile = getAuthenticDriverProfile(selectedVehicleId, i);
        const segIdx = Math.min(i, path.length - 2);
        const p1 = path[segIdx];
        const p2 = path[segIdx + 1];
        const dLat = p2[0] - p1[0];
        const dLng = p2[1] - p1[1];
        const initialHeading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;

        const initialProgress = 0.2 + (i * 0.25) % 0.6;
        const initialLat = p1[0] + dLat * initialProgress;
        const initialLng = p1[1] + dLng * initialProgress;
        const distM = Math.hypot((initialLat - pLat) * 111320, (initialLng - pLng) * 111320 * Math.cos(((pLat + initialLat) / 2 * Math.PI) / 180));
        const etaMins = Math.max(2, Math.round(distM / 350) || 3);

        const vehicle = {
          id: `driver_${profile.name.toLowerCase().replace(/\s+/g, '_')}_${i}`,
          name: profile.name,
          rating: profile.rating,
          vehicleModel: profile.model,
          path: path,
          segmentIndex: segIdx,
          progress: initialProgress,
          direction: i % 2 === 0 ? 1 : -1,
          speed: 0.000055 + (i % 3) * 0.000012, // Realistic city cruising speed (~20-26 km/h)
          pauseRemaining: 0,
          distM: distM,
          lat: initialLat,
          lng: initialLng,
          heading: initialHeading,
          isOsrmRoad: activeRoadBranches.length > 0
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

    // Start continuous animation loop if not already running
    if (!animFrameRef.current) {
      let lastTime = performance.now();

      const animateLoop = (now) => {
        const dt = Math.min((now - lastTime) / 1000, 0.05); // Capped delta-time for buttery smooth 60fps
        lastTime = now;

        const fleet = simFleetRef.current;
        const markers = simMarkersRef.current;

        fleet.forEach((v, index) => {
          const path = v.path;
          if (!path || path.length < 2) return;

          // If vehicle is paused at traffic signal / intersection
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

          // Seamless transition along road waypoints
          if (v.progress >= 1.0) {
            v.progress = 0.0;
            if (v.direction > 0) {
              if (v.segmentIndex >= path.length - 2) {
                v.direction = -1; // Smoothly reverse along the road
                if (Math.random() < 0.30) v.pauseRemaining = 2.5 + Math.random() * 3.0;
              } else {
                v.segmentIndex++;
              }
            } else {
              if (v.segmentIndex <= 0) {
                v.direction = 1; // Smoothly forward along the road
                if (Math.random() < 0.30) v.pauseRemaining = 2.5 + Math.random() * 3.0;
              } else {
                v.segmentIndex--;
              }
            }
          }

          // Smooth coordinate interpolation strictly on real road asphalt
          const activeFrom = v.direction > 0 ? path[v.segmentIndex] : path[v.segmentIndex + 1];
          const activeTo = v.direction > 0 ? path[v.segmentIndex + 1] : path[v.segmentIndex];

          if (activeFrom && activeTo) {
            v.lat = activeFrom[0] + (activeTo[0] - activeFrom[0]) * v.progress;
            v.lng = activeFrom[1] + (activeTo[1] - activeFrom[1]) * v.progress;

            // Smooth shortest-path heading calculation (NO 360-degree spins, natural steering)
            const curDLat = activeTo[0] - activeFrom[0];
            const curDLng = activeTo[1] - activeFrom[1];
            const targetHeading = ((Math.atan2(curDLng, curDLat) * 180) / Math.PI + 360) % 360;

            // Shortest-turn angular difference (always between -180 and +180 deg)
            const diff = ((targetHeading - v.heading) % 360 + 540) % 360 - 180;

            // Natural realistic steering rate (max 75 deg/sec turn rate)
            const maxTurnStep = 75 * dt;
            const turnDelta = Math.sign(diff) * Math.min(Math.abs(diff * 3.5 * dt), maxTurnStep);
            v.heading += turnDelta;

            const marker = markers[index];
            if (marker) {
              marker.setLatLng([v.lat, v.lng]);

              const iconEl = marker.getElement();
              if (iconEl) {
                const innerDiv = iconEl.firstElementChild;
                if (innerDiv) {
                  innerDiv.style.transform = `rotate(${v.heading.toFixed(1)}deg)`;
                }
              }
            }
          }
        });

        animFrameRef.current = requestAnimationFrame(animateLoop);
      };

      animFrameRef.current = requestAnimationFrame(animateLoop);
    }
  }, [isServiceable, isCaptain, activeRide, pickup, center, nearbyDrivers, roadBranches]);

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

      {/* Tapping selection tooltip */}
      {selectingMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-brand-yellow text-brand-yellow text-xs font-bold shadow-2xl flex items-center gap-2 z-10 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-brand-yellow animate-ping"></span>
          Tap anywhere on map or drag pin to set {selectingMode.toUpperCase()}
        </div>
      )}
    </div>
  );
};
