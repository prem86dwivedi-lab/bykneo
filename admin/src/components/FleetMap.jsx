import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Satellite, Map as MapIcon, Layers, Sparkles, Check } from 'lucide-react';

const BIKE_ICON_HTML = (name, isBusy) => `
  <div style="background-color: ${isBusy ? '#EF4444' : '#FFC800'}; border: 2.5px solid #111827; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.7); transition: all 0.5s ease;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.3">
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <circle cx="15" cy="5" r="1"/>
      <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
    </svg>
  </div>
`;

export const FleetMap = ({ drivers = [], activeRides = [] }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapType, setMapType] = useState('arcgis'); // 'arcgis' | 'hybrid' | 'streets'
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const tileLayerRef = useRef(null);
  const driverMarkersRef = useRef({});

  const MAP_LAYERS = {
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090], // Connaught Place, New Delhi
        zoom: 13,
        zoomControl: false,
        minZoom: 4
      });

      const initialLayer = MAP_LAYERS['arcgis'];
      tileLayerRef.current = L.tileLayer(initialLayer.url, initialLayer.options).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }
  }, []);

  // Switch Map Layer
  const handleSelectMapType = (typeKey) => {
    const map = mapInstanceRef.current;
    if (!map || !MAP_LAYERS[typeKey]) return;

    setMapType(typeKey);
    setShowLayerMenu(false);

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);

    const cfg = MAP_LAYERS[typeKey];
    tileLayerRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
  };

  // Update Driver Markers in Real Time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    drivers.forEach(d => {
      if (!d.lat || !d.lng) return;

      const isBusy = activeRides.some(r => r.driver_id === d.id);
      const icon = L.divIcon({
        className: 'admin-bike-icon',
        html: BIKE_ICON_HTML(d.name, isBusy),
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (driverMarkersRef.current[d.id]) {
        driverMarkersRef.current[d.id].setLatLng([d.lat, d.lng]);
      } else {
        const marker = L.marker([d.lat, d.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="color: #111; font-family: Inter, sans-serif; padding: 4px;">
              <b style="font-size: 13px;">Captain ${d.name}</b><br/>
              <span style="font-size: 11px; color: #555;">${d.vehicle_model} (${d.vehicle_number})</span><br/>
              <span style="font-size: 11px; font-weight: bold; color: ${isBusy ? '#d97706' : '#059669'};">
                ${isBusy ? '● On Active Trip' : '● Available'}
              </span>
            </div>
          `);
        driverMarkersRef.current[d.id] = marker;
      }
    });
  }, [drivers, activeRides]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Left Stats Badge */}
      <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 font-semibold flex items-center gap-3 z-10 shadow-lg pointer-events-none">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow"></span>
          Available Online ({drivers.length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
          On Trip ({activeRides.length})
        </span>
      </div>

      {/* Top Right 3-Way Layer Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowLayerMenu(!showLayerMenu)}
          className={`p-2.5 rounded-2xl border backdrop-blur-md shadow-2xl active:scale-90 transition flex items-center gap-1.5 text-xs font-bold ${
            showLayerMenu
              ? 'bg-brand-yellow text-gray-950 border-brand-yellow'
              : 'bg-gray-900/95 text-brand-yellow border-gray-700 hover:text-white'
          }`}
          title="Switch Map Layer (Crystal HD Satellite / Google Hybrid / Streets)"
        >
          <Layers className="w-4 h-4" />
          <span>Views</span>
        </button>

        {showLayerMenu && (
          <div className="absolute top-12 right-0 w-60 bg-gray-900/95 backdrop-blur-2xl border border-gray-750 p-2 rounded-2xl shadow-2xl space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="text-[10px] font-bold uppercase text-gray-400 px-2 py-0.5">
              Select Map Layer
            </div>

            {/* Option 1: Crystal HD Satellite [ArcGIS] */}
            <button
              onClick={() => handleSelectMapType('arcgis')}
              className={`w-full text-left p-2 rounded-xl border transition flex items-start gap-2 ${
                mapType === 'arcgis'
                  ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                  : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-brand-yellow mt-0.5 shrink-0" />
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Crystal HD Satellite</span>
                  {mapType === 'arcgis' && <Check className="w-3 h-3 text-brand-yellow" />}
                </div>
                <div className="text-[10px] text-gray-400">ArcGIS World Imagery</div>
              </div>
            </button>

            {/* Option 2: Google Hybrid [Labels] */}
            <button
              onClick={() => handleSelectMapType('hybrid')}
              className={`w-full text-left p-2 rounded-xl border transition flex items-start gap-2 ${
                mapType === 'hybrid'
                  ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                  : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Satellite className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Google Hybrid</span>
                  {mapType === 'hybrid' && <Check className="w-3 h-3 text-brand-yellow" />}
                </div>
                <div className="text-[10px] text-gray-400">Satellite + Hindi/Eng Names</div>
              </div>
            </button>

            {/* Option 3: Street RoadMap */}
            <button
              onClick={() => handleSelectMapType('streets')}
              className={`w-full text-left p-2 rounded-xl border transition flex items-start gap-2 ${
                mapType === 'streets'
                  ? 'bg-brand-yellow/15 border-brand-yellow text-white'
                  : 'bg-gray-850/80 border-transparent text-gray-300 hover:bg-gray-800'
              }`}
            >
              <MapIcon className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="flex-1 truncate">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Street RoadMap</span>
                  {mapType === 'streets' && <Check className="w-3 h-3 text-brand-yellow" />}
                </div>
                <div className="text-[10px] text-gray-400">Standard Navigation</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
