import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { X, Crosshair, MapPin, Satellite, Map as MapIcon, Maximize2 } from 'lucide-react';

export const AddCityModal = ({ isOpen, onClose, onCitySaved, BACKEND_URL }) => {
  const [cityName, setCityName] = useState('');
  const [lat, setLat] = useState(23.238911); // Default Bhopal center as in user screenshot
  const [lng, setLng] = useState(77.499530);
  const [radiusKm, setRadiusKm] = useState(5.533); // in KMs
  const [mapType, setMapType] = useState('satellite'); // default to high-res Satellite as requested
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const radiusLineRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Map when modal opens
  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 13,
          zoomControl: false,
          attributionControl: false,
          maxBoundsViscosity: 1.0
        });

        // High-Definition Google Hybrid Satellite Layer (Satellite + City Roads & English/Hindi Landmark Labels)
        tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '&copy; Leaflet | Google Maps'
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Center Pin
        const centerIcon = L.divIcon({
          className: 'custom-city-pin',
          html: `
            <div style="background-color: #EF4444; border: 3px solid #ffffff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px rgba(239,68,68,0.8);">
              <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        markerRef.current = L.marker([lat, lng], { icon: centerIcon, draggable: true }).addTo(map);

        markerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setLat(Number(pos.lat.toFixed(6)));
          setLng(Number(pos.lng.toFixed(6)));
        });

        // Radius Geofence Circle (Blue dashed matching Screenshot 4)
        circleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#3B82F6',
          weight: 2.5,
          dashArray: '6, 6',
          fillColor: '#3B82F6',
          fillOpacity: 0.15
        }).addTo(map);

        // Measured red dashed radius line (as shown in Screenshot 4)
        const edgePoint = [lat + (radiusKm / 111.32) * 0.7, lng + (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))) * 0.7];
        radiusLineRef.current = L.polyline([[lat, lng], edgePoint], {
          color: '#EF4444',
          weight: 3.5,
          dashArray: '6, 6'
        }).addTo(map);

        map.on('click', (e) => {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
        });

        mapInstanceRef.current = map;
        map.invalidateSize();
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Update Pin and Circle when Lat, Lng, Radius change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radiusKm * 1000);
    }
    if (radiusLineRef.current) {
      const edgePoint = [lat + (radiusKm / 111.32) * 0.7, lng + (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))) * 0.7];
      radiusLineRef.current.setLatLngs([[lat, lng], edgePoint]);
    }
  }, [lat, lng, radiusKm]);

  // Toggle Map Type (Satellite Hybrid vs Google Roadmap)
  const handleToggleMapType = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const nextType = mapType === 'satellite' ? 'streets' : 'satellite';
    setMapType(nextType);

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (nextType === 'satellite') {
      // Google Hybrid Satellite
      tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Leaflet | Google Maps'
      }).addTo(map);
    } else {
      // Google Standard Roadmap
      tileLayerRef.current = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: '&copy; Leaflet | Google Maps'
      }).addTo(map);
    }
  };

  // Search and Geocode City Name
  const handleSearchCity = async () => {
    if (!cityName || cityName.trim().length < 2) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cityName
      )}&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (data && data[0]) {
        const newLat = Number(Number(data[0].lat).toFixed(6));
        const newLng = Number(Number(data[0].lon).toFixed(6));
        setLat(newLat);
        setLng(newLng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 13);
        }
      } else {
        alert('City not found. You can drag the pin on the map to set the exact center.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // Save City Geofence
  const handleSaveCity = async () => {
    if (!cityName || !cityName.trim()) {
      alert('Please enter a City Name (e.g. Bhopal, MP)');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cityName.trim(),
          lat,
          lng,
          radius_km: Number(radiusKm),
          is_active: true
        })
      });
      const data = await res.json();
      if (data.success) {
        if (onCitySaved) onCitySaved(data.city);
        onClose();
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save city geofence.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      {/* Modal Card matching Screenshot 4 */}
      <div className="bg-white text-gray-900 rounded-[28px] p-6 max-w-md w-full shadow-2xl space-y-4 my-auto relative animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-950 tracking-tight font-serif">
            ADD NEW CITY
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Name & Get Location Button */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            LOCATION NAME
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="e.g. Bhopal, MP"
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-2xl py-3 px-4 text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none pr-32"
            />
            <button
              onClick={handleSearchCity}
              disabled={searching}
              className="absolute right-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[11px] rounded-xl flex items-center gap-1 transition active:scale-95"
            >
              <Crosshair className="w-3.5 h-3.5" />
              {searching ? 'Locating...' : 'GET LOCATION'}
            </button>
          </div>
        </div>

        {/* Embedded Satellite Map Container */}
        <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Measured Distance / Use As Radius Badge */}
          <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-200 shadow-lg flex items-center gap-2">
            <div>
              <span className="text-[9px] font-bold text-blue-600 uppercase block leading-none">
                MEASURED DISTANCE
              </span>
              <span className="text-xs font-black text-gray-900 leading-none">
                {radiusKm} kms
              </span>
            </div>
            <button
              onClick={() => {}}
              className="px-2.5 py-1 bg-blue-600 text-white font-bold text-[10px] rounded-xl shadow active:scale-95"
            >
              USE AS RADIUS
            </button>
          </div>

          {/* Layer Switcher */}
          <button
            onClick={handleToggleMapType}
            className="absolute top-3 right-3 z-10 p-2 bg-white/95 text-gray-850 hover:bg-white rounded-xl shadow-lg border border-gray-200"
            title="Toggle Satellite / Streets"
          >
            {mapType === 'satellite' ? <MapIcon className="w-4 h-4 text-blue-600" /> : <Satellite className="w-4 h-4 text-gray-700" />}
          </button>
        </div>

        {/* Latitude & Longitude Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              LATITUDE
            </label>
            <input
              type="text"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs text-gray-900 font-mono font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              LONGITUDE
            </label>
            <input
              type="text"
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs text-gray-900 font-mono font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* Radius in Meters / Kilometers */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
            RADIUS (KILOMETERS)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              step="0.5"
              min="1"
              max="1000"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs text-gray-900 font-bold focus:outline-none"
            />
            <span className="text-xs font-bold text-gray-600 shrink-0">
              = {Math.round(radiusKm * 1000)} meters
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition active:scale-95"
          >
            CANCEL
          </button>

          <button
            type="button"
            onClick={handleSaveCity}
            disabled={saving}
            className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition active:scale-95"
          >
            {saving ? 'SAVING...' : 'SAVE MAPPING'}
          </button>
        </div>
      </div>
    </div>
  );
};
