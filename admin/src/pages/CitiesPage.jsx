import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Plus,
  Trash2,
  Power,
  Satellite,
  Map as MapIcon,
  Crosshair,
  X,
  Check,
  Search,
  Sliders,
  Globe2,
  Layers,
  Sparkles,
  Edit3,
  Radio,
  Navigation,
  Bike,
  Users,
  CreditCard,
  AlertCircle,
  ChevronDown
} from 'lucide-react';

export const CitiesPage = ({
  BACKEND_URL,
  selectedCityId = 'all',
  setSelectedCityId,
  cityStats = {},
  onNavigateTab
}) => {
  const [cities, setCities] = useState([]);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingCityId, setEditingCityId] = useState(null); // null for new city, or city.id when editing
  const [focusedCityId, setFocusedCityId] = useState(selectedCityId !== 'all' ? selectedCityId : null);
  const [mapType, setMapType] = useState('arcgis'); // 'arcgis' | 'hybrid' | 'streets'
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const cityDropdownRef = useRef(null);

  // Close city selector dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // New/Editing City Form State (Controls on the Big Map)
  const [cityName, setCityName] = useState('');
  const [lat, setLat] = useState(23.238911); // Default Bhopal center
  const [lng, setLng] = useState(77.499530);
  const [radiusKm, setRadiusKm] = useState(30); // 30 KM radius
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const savedCirclesRef = useRef([]);
  const savedMarkersRef = useRef([]);

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

  // Active Draft Geofence refs (when adding a city on the big map)
  const draftMarkerRef = useRef(null);
  const draftCircleRef = useRef(null);
  const draftLineRef = useRef(null);

  const fetchCities = () => {
    fetch(`${BACKEND_URL}/api/admin/cities`)
      .then(res => res.json())
      .then(data => setCities(data.cities || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // 1. Initialize Big Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.2599, 77.4126], // Centered around Bhopal / Central India
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
        minZoom: 4
      });

      // Default to Crystal HD ArcGIS World Imagery Layer
      const initialLayer = MAP_LAYERS['arcgis'];
      tileLayerRef.current = L.tileLayer(initialLayer.url, initialLayer.options).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      map.on('click', (e) => {
        setShowLayerMenu(false);
        if (showAddPanel) {
          const newLat = Number(e.latlng.lat.toFixed(6));
          const newLng = Number(e.latlng.lng.toFixed(6));
          setLat(newLat);
          setLng(newLng);
        }
      });

      mapInstanceRef.current = map;
    }
  }, []);

  // 2. Render Saved Geofenced Cities on Big Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old saved layers
    savedCirclesRef.current.forEach(c => map.removeLayer(c));
    savedCirclesRef.current = [];
    savedMarkersRef.current.forEach(m => map.removeLayer(m));
    savedMarkersRef.current = [];

    const bounds = [];

    cities.forEach(city => {
      if (!city.lat || !city.lng) return;

      const circle = L.circle([city.lat, city.lng], {
        radius: (city.radius_km || 30) * 1000,
        color: city.is_active ? '#3B82F6' : '#9CA3AF',
        weight: 2.5,
        dashArray: '6, 6',
        fillColor: city.is_active ? '#3B82F6' : '#9CA3AF',
        fillOpacity: 0.18
      }).addTo(map);

      const marker = L.marker([city.lat, city.lng]).addTo(map);

      const popupContent = `
        <div style="font-family: Inter, sans-serif; color: #111; padding: 4px;">
          <b style="font-size: 14px; color: #1e3a8a;">${city.name}</b><br/>
          <span style="font-size: 12px; color: #374151;">Operating Radius: <b>${city.radius_km} KM</b></span><br/>
          <span style="font-size: 11px; font-weight: bold; color: ${city.is_active ? '#059669' : '#DC2626'};">
            ${city.is_active ? '● LIVE OPERATING' : '○ DISABLED'}
          </span>
        </div>
      `;

      circle.bindPopup(popupContent);
      marker.bindPopup(popupContent);

      savedCirclesRef.current.push(circle);
      savedMarkersRef.current.push(marker);
      bounds.push([city.lat, city.lng]);
    });

    if (!showAddPanel && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
    }
  }, [cities, showAddPanel]);

  // 3. Draft Geofence on Big Map when Add Panel is Open
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showAddPanel) {
      // Create or update draft pin
      if (!draftMarkerRef.current) {
        const pinIcon = L.divIcon({
          className: 'draft-center-pin',
          html: `
            <div style="background-color: #EF4444; border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(239,68,68,0.9);">
              <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%;"></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        draftMarkerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);

        draftMarkerRef.current.on('dragend', (e) => {
          const pos = e.target.getLatLng();
          setLat(Number(pos.lat.toFixed(6)));
          setLng(Number(pos.lng.toFixed(6)));
        });
      } else {
        draftMarkerRef.current.setLatLng([lat, lng]);
      }

      // Create or update draft geofence circle
      if (!draftCircleRef.current) {
        draftCircleRef.current = L.circle([lat, lng], {
          radius: radiusKm * 1000,
          color: '#3B82F6',
          weight: 3,
          dashArray: '6, 6',
          fillColor: '#3B82F6',
          fillOpacity: 0.2
        }).addTo(map);
      } else {
        draftCircleRef.current.setLatLng([lat, lng]);
        draftCircleRef.current.setRadius(radiusKm * 1000);
      }

      // Create or update red dashed measured radius line
      const edgePoint = [
        lat + (radiusKm / 111.32) * 0.7,
        lng + (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * 0.7
      ];

      if (!draftLineRef.current) {
        draftLineRef.current = L.polyline([[lat, lng], edgePoint], {
          color: '#EF4444',
          weight: 3.5,
          dashArray: '6, 6'
        }).addTo(map);
      } else {
        draftLineRef.current.setLatLngs([[lat, lng], edgePoint]);
      }

      map.setView([lat, lng], 12);
    } else {
      // Remove draft layers when panel is closed
      if (draftMarkerRef.current) {
        map.removeLayer(draftMarkerRef.current);
        draftMarkerRef.current = null;
      }
      if (draftCircleRef.current) {
        map.removeLayer(draftCircleRef.current);
        draftCircleRef.current = null;
      }
      if (draftLineRef.current) {
        map.removeLayer(draftLineRef.current);
        draftLineRef.current = null;
      }
    }
  }, [showAddPanel, lat, lng, radiusKm]);

  // 3-Way Layer Switcher
  const handleSelectMapType = (typeKey) => {
    const map = mapInstanceRef.current;
    if (!map || !MAP_LAYERS[typeKey]) return;

    setMapType(typeKey);
    setShowLayerMenu(false);

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);

    const cfg = MAP_LAYERS[typeKey];
    tileLayerRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
  };

  // Search City Geocoding
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
          mapInstanceRef.current.setView([newLat, newLng], 12);
        }
      } else {
        alert('City not found. You can tap anywhere directly on the big map to set the center point.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // Open Add New City Panel
  const handleOpenAddCity = () => {
    setEditingCityId(null);
    setCityName('Bhopal, MP');
    setLat(23.238911);
    setLng(77.499530);
    setRadiusKm(30);
    setShowAddPanel(true);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([23.238911, 77.499530], 11);
    }
  };

  // Open Edit City Panel for an existing city
  const handleEditCity = (city) => {
    setEditingCityId(city.id);
    setCityName(city.name);
    setLat(Number(city.lat));
    setLng(Number(city.lng));
    setRadiusKm(Number(city.radius_km || 30));
    setShowAddPanel(true);
    if (mapInstanceRef.current && city.lat && city.lng) {
      mapInstanceRef.current.setView([Number(city.lat), Number(city.lng)], 11);
    }
  };

  // Save / Update City Geofence
  const handleSaveCity = async () => {
    if (!cityName || !cityName.trim()) {
      alert('Please enter a City Name (e.g. Bhopal, MP)');
      return;
    }

    setSaving(true);
    try {
      if (editingCityId) {
        // UPDATE existing city
        const res = await fetch(`${BACKEND_URL}/api/admin/cities/${editingCityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cityName.trim(),
            lat: Number(lat),
            lng: Number(lng),
            radius_km: Number(radiusKm)
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchCities();
          setShowAddPanel(false);
          setEditingCityId(null);
        }
      } else {
        // CREATE new city
        const res = await fetch(`${BACKEND_URL}/api/admin/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cityName.trim(),
            lat: Number(lat),
            lng: Number(lng),
            radius_km: Number(radiusKm),
            is_active: true
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchCities();
          setShowAddPanel(false);
          setEditingCityId(null);
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save city geofence.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Inactive
  const handleToggleCity = async (city) => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/cities/${city.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !city.is_active })
      });
      fetchCities();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete City
  const handleDeleteCity = async (id) => {
    if (!confirm('Are you sure you want to remove this city geofence?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/admin/cities/${id}`, {
        method: 'DELETE'
      });
      if (editingCityId === id) {
        setShowAddPanel(false);
        setEditingCityId(null);
      }
      fetchCities();
    } catch (e) {
      console.error(e);
    }
  };

  // Compute Active Focused City and its Live Intelligence Metrics
  const activeFocusedCity =
    cities.find((c) => c.id === focusedCityId) ||
    (selectedCityId !== 'all' ? cities.find((c) => c.id === selectedCityId) : null) ||
    (cities.length > 0 ? cities[0] : null);

  const activeCityMetrics = activeFocusedCity
    ? cityStats?.[activeFocusedCity.id] || {
        online_drivers: 0,
        active_rides: 0,
        total_drivers: 0,
        total_passengers: 0,
        total_gross_revenue: 0,
        platform_commission: 0,
        open_complaints: 0
      }
    : null;

  // Focus a specific city on the big map and open its intelligence panel
  const handleFocusCity = (city) => {
    setFocusedCityId(city.id);
    if (setSelectedCityId) setSelectedCityId(city.id);
    if (mapInstanceRef.current && city.lat && city.lng) {
      mapInstanceRef.current.flyTo([city.lat, city.lng], 12, { animate: true, duration: 1.0 });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] space-y-3 sm:space-y-4">
      {/* Top Header Bar with City Hub Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
            <span>Serviceable Cities & Geofencing</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400">
            Select an operational city hub to inspect live fleet density, active trips, and geofence coverage
          </p>
        </div>

        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Searchable City Hub Selector Dropdown Box */}
          <div ref={cityDropdownRef} className="relative flex-1 sm:flex-initial min-w-0">
            <button
              type="button"
              onClick={() => {
                setIsCityDropdownOpen(!isCityDropdownOpen);
                setCitySearchTerm('');
              }}
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-850 border border-gray-700 hover:border-brand-yellow text-brand-yellow font-black text-xs py-2 pl-3 pr-2.5 rounded-xl sm:rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow/30 transition cursor-pointer flex items-center justify-between gap-2 max-w-[240px] sm:max-w-xs"
            >
              <span className="truncate">
                {activeFocusedCity
                  ? `📍 ${activeFocusedCity.name} (${cityStats?.[activeFocusedCity.id]?.online_drivers || 0} Live Drivers)`
                  : `🌐 All Operational Cities (${cities.length})`}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-brand-yellow transition-transform duration-200 shrink-0 ${
                  isCityDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Popover Dropdown Menu with Live Search Filter Box */}
            {isCityDropdownOpen && (
              <div className="absolute top-full mt-1.5 left-0 sm:right-auto w-72 sm:w-80 bg-gray-900/98 backdrop-blur-2xl border border-gray-750 rounded-2xl shadow-2xl p-2.5 z-50 space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
                {/* Search Box Input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    value={citySearchTerm}
                    onChange={(e) => setCitySearchTerm(e.target.value)}
                    placeholder="Search city by name..."
                    className="w-full bg-gray-800 border border-gray-700 focus:border-brand-yellow rounded-xl py-1.5 pl-8 pr-7 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-yellow/50 transition font-medium"
                  />
                  {citySearchTerm && (
                    <button
                      type="button"
                      onClick={() => setCitySearchTerm('')}
                      className="absolute right-2 text-gray-400 hover:text-white p-0.5 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Cities Scrollable List */}
                <div className="max-h-60 overflow-y-auto space-y-1 pr-0.5">
                  {/* Option: All Operational Cities */}
                  {(!citySearchTerm || 'all operational cities'.includes(citySearchTerm.toLowerCase())) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedCityId(null);
                        if (setSelectedCityId) setSelectedCityId('all');
                        if (mapInstanceRef.current && cities.length > 0) {
                          const bounds = cities.map((c) => [c.lat, c.lng]);
                          mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80], maxZoom: 11 });
                        }
                        setIsCityDropdownOpen(false);
                        setCitySearchTerm('');
                      }}
                      className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between text-xs font-bold ${
                        !activeFocusedCity || selectedCityId === 'all'
                          ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
                          : 'bg-gray-850/70 border-transparent text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span>🌐</span>
                        <span className="truncate">All Operational Cities ({cities.length})</span>
                      </div>
                      {(!activeFocusedCity || selectedCityId === 'all') && (
                        <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                      )}
                    </button>
                  )}

                  {/* Filtered Cities List */}
                  {cities
                    .filter((c) => c.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
                    .map((city) => {
                      const stats = cityStats?.[city.id];
                      const isSelected = activeFocusedCity?.id === city.id;
                      const onlineCount = stats?.online_drivers || 0;

                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            handleFocusCity(city);
                            setIsCityDropdownOpen(false);
                            setCitySearchTerm('');
                          }}
                          className={`w-full text-left p-2 rounded-xl border transition flex items-center justify-between text-xs font-bold ${
                            isSelected
                              ? 'bg-brand-yellow/15 border-brand-yellow text-brand-yellow'
                              : 'bg-gray-850/70 border-transparent text-gray-300 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <span className="text-red-400">📍</span>
                            <span className="truncate text-white font-bold">{city.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-1 ${
                                onlineCount > 0
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-gray-800 text-gray-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  onlineCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                                }`}
                              />
                              {onlineCount} Live
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-brand-yellow shrink-0" />}
                          </div>
                        </button>
                      );
                    })}

                  {/* Empty state when no cities match search */}
                  {cities.filter((c) => c.name.toLowerCase().includes(citySearchTerm.toLowerCase())).length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-400 space-y-1">
                      <p>
                        No cities found for <span className="text-brand-yellow font-bold">"{citySearchTerm}"</span>
                      </p>
                      <p className="text-[10px] text-gray-500">Tap + ADD CITY to create a new geofence</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!showAddPanel && (
            <button
              onClick={handleOpenAddCity}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl sm:rounded-2xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition active:scale-95 shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>ADD CITY</span>
            </button>
          )}
        </div>
      </div>

      {/* BIG FULL-SCREEN MAP WITH INTEGRATED CONTROLS */}
      <div className="relative flex-1 w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800 shadow-2xl min-h-[350px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Floating City Operations Intelligence Hub Overlay (Hidden on Mobile, Visible on Desktop) */}
        {activeFocusedCity && activeCityMetrics && !showAddPanel && (
          <div className="hidden sm:block absolute top-3 sm:top-4 left-3 sm:left-4 z-20 max-w-xs sm:max-w-sm w-full bg-gray-900/95 backdrop-blur-2xl border border-gray-750 rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-2xl space-y-2.5 animate-in fade-in-50 slide-in-from-top-2">
            {/* Top Row with City Title & Geofence Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black text-xs shadow-md shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 truncate">
                    <span className="truncate">{activeFocusedCity.name}</span>
                    <span
                      className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0 ${
                        activeFocusedCity.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {activeFocusedCity.is_active ? '● LIVE' : 'OFFLINE'}
                    </span>
                  </h4>
                  <p className="text-[9px] text-gray-400 truncate">
                    {activeFocusedCity.radius_km} KM Operating Zone ({activeFocusedCity.radius_km * 1000}m)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEditCity(activeFocusedCity)}
                  className="p-1 rounded-lg text-gray-400 hover:text-brand-yellow hover:bg-gray-800 transition"
                  title="Edit Geofence Radius"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFocusedCityId(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  title="Close Intelligence Box"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6 Metric Badges Grid: 3 Columns x 2 Rows */}
            <div className="grid grid-cols-3 gap-1.5">
              {/* 1. Live Drivers */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Live Drivers</span>
                  <Radio className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {activeCityMetrics.online_drivers || 0}
                </div>
              </div>

              {/* 2. Active Rides */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Active Trips</span>
                  <Navigation className="w-3 h-3 text-brand-yellow" />
                </div>
                <div className="text-xs sm:text-sm font-black text-brand-yellow">
                  {activeCityMetrics.active_rides || 0}
                </div>
              </div>

              {/* 3. Total Captains */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Captains</span>
                  <Bike className="w-3 h-3 text-purple-400" />
                </div>
                <div className="text-xs sm:text-sm font-black text-white">
                  {activeCityMetrics.total_drivers || 0}
                </div>
              </div>

              {/* 4. Passengers */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Passengers</span>
                  <Users className="w-3 h-3 text-blue-400" />
                </div>
                <div className="text-xs sm:text-sm font-black text-white">
                  {activeCityMetrics.total_passengers || 0}
                </div>
              </div>

              {/* 5. Commission */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Commission</span>
                  <CreditCard className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-[11px] font-black text-emerald-400 truncate">
                  ₹{activeCityMetrics.platform_commission || 0}
                </div>
              </div>

              {/* 6. Complaints */}
              <div className="bg-gray-850/90 p-2 rounded-xl border border-gray-800 space-y-0.5">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="text-[7.5px] font-bold uppercase">Complaints</span>
                  <AlertCircle className="w-3 h-3 text-red-400" />
                </div>
                <div className="text-xs sm:text-sm font-black text-red-400">
                  {activeCityMetrics.open_complaints || 0}
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Action Jump Buttons */}
            {onNavigateTab && (
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => onNavigateTab('live_drivers')}
                  className="flex-1 py-1 bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white text-[9px] font-bold rounded-lg border border-gray-700 flex items-center justify-center gap-1 transition active:scale-95 truncate"
                >
                  <Radio className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>Live Map</span>
                </button>
                <button
                  onClick={() => onNavigateTab('drivers')}
                  className="flex-1 py-1 bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white text-[9px] font-bold rounded-lg border border-gray-700 flex items-center justify-center gap-1 transition active:scale-95 truncate"
                >
                  <Bike className="w-2.5 h-2.5 text-brand-yellow shrink-0" />
                  <span>Captains</span>
                </button>
                <button
                  onClick={() => onNavigateTab('active_rides')}
                  className="flex-1 py-1 bg-gray-800 hover:bg-gray-750 text-gray-200 hover:text-white text-[9px] font-bold rounded-lg border border-gray-700 flex items-center justify-center gap-1 transition active:scale-95 truncate"
                >
                  <Navigation className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                  <span>Trips</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Top Right 3-Way Layer Switcher Controls on Big Map */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border backdrop-blur-md shadow-2xl active:scale-90 transition flex items-center gap-1.5 text-[11px] sm:text-xs font-bold ${
              showLayerMenu
                ? 'bg-brand-yellow text-gray-950 border-brand-yellow'
                : 'bg-gray-900/90 text-brand-yellow border-gray-700 hover:text-white'
            }`}
            title="Switch Map Layer (Crystal HD Satellite / Google Hybrid / Streets)"
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Views</span>
          </button>

          {showLayerMenu && (
            <div className="absolute top-12 right-0 w-60 bg-gray-900/95 backdrop-blur-2xl border border-gray-750 p-2 rounded-2xl shadow-2xl space-y-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="text-[10px] font-bold uppercase text-gray-400 px-2 py-0.5">
                Select Map View
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
                    {mapType === 'arcgis' && <Check className="w-3.5 h-3.5 text-brand-yellow" />}
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
                    {mapType === 'hybrid' && <Check className="w-3.5 h-3.5 text-brand-yellow" />}
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
                    {mapType === 'streets' && <Check className="w-3.5 h-3.5 text-brand-yellow" />}
                  </div>
                  <div className="text-[10px] text-gray-400">Standard Navigation</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* FLOATING "EDIT / ADD CITY" SETTINGS PANEL (Bottom Sheet on Mobile, Left Card on Desktop) */}
        {showAddPanel && (
          <div className="absolute bottom-0 left-0 right-0 sm:bottom-auto sm:top-4 sm:left-4 sm:right-auto sm:w-96 max-w-full bg-gray-900/98 sm:bg-white text-white sm:text-gray-900 rounded-t-3xl sm:rounded-[28px] p-3 sm:p-5 shadow-2xl space-y-2.5 sm:space-y-3.5 border-t sm:border border-gray-750 sm:border-gray-200 animate-in slide-in-from-bottom sm:slide-in-from-left duration-200 z-30 max-h-[52vh] sm:max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 sm:border-gray-100 pb-1.5 sm:pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-lg font-black text-white sm:text-gray-950 tracking-tight font-serif flex items-center gap-1.5">
                    {editingCityId ? 'EDIT CITY GEOFENCE' : 'ADD NEW CITY'}
                  </h3>
                  {editingCityId && (
                    <span className="text-[8.5px] sm:text-[10px] text-blue-400 sm:text-blue-600 font-bold block leading-none">
                      Drag red center pin on map or adjust radius below
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddPanel(false);
                  setEditingCityId(null);
                }}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-800 sm:bg-gray-100 hover:bg-gray-700 sm:hover:bg-gray-200 flex items-center justify-center text-gray-400 sm:text-gray-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* City Location Name Input */}
            <div>
              <label className="block text-[8.5px] sm:text-[10px] font-bold text-gray-400 sm:text-gray-500 uppercase tracking-wider mb-0.5">
                LOCATION NAME
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  placeholder="e.g. Bhopal, MP"
                  className="w-full bg-gray-800 sm:bg-gray-50 border border-gray-700 sm:border-gray-200 focus:border-blue-500 rounded-xl py-1.5 sm:py-2 px-2.5 text-xs font-semibold text-white sm:text-gray-900 placeholder-gray-500 sm:placeholder-gray-400 focus:outline-none pr-24 sm:pr-28"
                />
                <button
                  onClick={handleSearchCity}
                  disabled={searching}
                  className="absolute right-1 py-1 px-2 sm:py-1.5 sm:px-2.5 bg-blue-600/20 sm:bg-blue-50 hover:bg-blue-600/30 sm:hover:bg-blue-100 text-blue-400 sm:text-blue-600 font-bold text-[8.5px] sm:text-[10px] rounded-lg flex items-center gap-1 transition active:scale-95"
                >
                  <Crosshair className="w-3 h-3" />
                  {searching ? 'Locating...' : 'GET LOCATION'}
                </button>
              </div>
            </div>

            {/* Radius Range Slider & Input with +, - Steppers & Labels */}
            <div>
              <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                <label className="text-[8.5px] sm:text-[10px] font-bold text-gray-400 sm:text-gray-500 uppercase tracking-wider">
                  OPERATING RADIUS
                </label>
                <div className="flex items-center gap-1 bg-blue-500/15 sm:bg-blue-50 border border-blue-500/30 sm:border-blue-200 px-1.5 py-0.5 rounded-lg">
                  <input
                    type="number"
                    min="2"
                    max="1000"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Math.max(1, Math.min(1000, Number(e.target.value))))}
                    className="w-12 bg-transparent text-xs font-black text-blue-400 sm:text-blue-700 text-right focus:outline-none"
                  />
                  <span className="text-xs font-black text-blue-400 sm:text-blue-700">KM</span>
                  <span className="text-[8.5px] text-blue-300 sm:text-blue-500 font-semibold">({Math.round(radiusKm * 1000)}m)</span>
                </div>
              </div>

              {/* Stepper with - and + buttons flanking the slider */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRadiusKm((prev) => Math.max(2, Number(prev) - 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-800 sm:bg-gray-100 hover:bg-blue-500/20 sm:hover:bg-blue-100 text-white sm:text-gray-800 font-black text-base sm:text-lg flex items-center justify-center border border-gray-700 sm:border-gray-200 shadow-sm transition active:scale-90 shrink-0 select-none"
                  title="Decrease Radius (-1 KM)"
                >
                  −
                </button>

                <div className="flex-1 flex items-center">
                  <input
                    type="range"
                    min="2"
                    max="1000"
                    step="1"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-700 sm:bg-gray-200 rounded-lg"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setRadiusKm((prev) => Math.min(1000, Number(prev) + 1))}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-gray-800 sm:bg-gray-100 hover:bg-blue-500/20 sm:hover:bg-blue-100 text-white sm:text-gray-800 font-black text-base sm:text-lg flex items-center justify-center border border-gray-700 sm:border-gray-200 shadow-sm transition active:scale-90 shrink-0 select-none"
                  title="Increase Radius (+1 KM)"
                >
                  +
                </button>
              </div>

              {/* Labels with - and + symbols */}
              <div className="flex items-center justify-between text-[8px] sm:text-[10px] text-gray-400 sm:text-gray-500 mt-0.5 font-semibold">
                <span>− 2 KM Min</span>
                <span className="text-blue-400 sm:text-blue-600 font-bold">● Drag red center pin</span>
                <span>+ 1000 KM Max</span>
              </div>
            </div>

            {/* Latitude & Longitude Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] sm:text-[10px] font-bold text-gray-400 sm:text-gray-500 uppercase mb-0.5">
                  LATITUDE
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full bg-gray-800 sm:bg-gray-50 border border-gray-700 sm:border-gray-200 focus:border-blue-500 rounded-xl py-1 sm:py-2 px-2 text-[11px] sm:text-xs text-white sm:text-gray-900 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[8px] sm:text-[10px] font-bold text-gray-400 sm:text-gray-500 uppercase mb-0.5">
                  LONGITUDE
                </label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full bg-gray-800 sm:bg-gray-50 border border-gray-700 sm:border-gray-200 focus:border-blue-500 rounded-xl py-1 sm:py-2 px-2 text-[11px] sm:text-xs text-white sm:text-gray-900 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setShowAddPanel(false);
                  setEditingCityId(null);
                }}
                className="py-1.5 sm:py-2 bg-gray-800 sm:bg-gray-100 hover:bg-gray-700 sm:hover:bg-gray-200 text-gray-300 sm:text-gray-700 font-bold text-xs rounded-xl transition active:scale-95"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleSaveCity}
                disabled={saving}
                className="py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition active:scale-95"
              >
                {saving
                  ? 'SAVING...'
                  : editingCityId
                  ? 'UPDATE'
                  : 'SAVE'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom Floating Bar: Displays ONLY the currently Selected / Focused City */}
        {activeFocusedCity && !showAddPanel && (
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-14 sm:right-4 z-10 pointer-events-none flex sm:justify-center">
            <div className="bg-gray-900/98 backdrop-blur-2xl border border-gray-750 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-2xl pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 max-w-xl w-full animate-in slide-in-from-bottom-2">
              {/* Left: City Info & Status */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <div
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0 ${
                    activeFocusedCity.is_active
                      ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50'
                      : 'bg-red-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-sm font-black text-white flex items-center gap-1 sm:gap-1.5 truncate">
                    <span className="truncate">{activeFocusedCity.name}</span>
                    <span
                      className={`text-[7.5px] sm:text-[8px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold uppercase shrink-0 ${
                        activeFocusedCity.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {activeFocusedCity.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <div className="text-[8.5px] sm:text-[10px] text-brand-yellow font-semibold truncate">
                    {activeFocusedCity.radius_km} KM Zone ({activeFocusedCity.radius_km * 1000}m radius)
                  </div>
                </div>
              </div>

              {/* Right: Quick Management Actions (Edit Radius, Toggle Active, Delete) */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Edit Button */}
                <button
                  onClick={() => handleEditCity(activeFocusedCity)}
                  className="p-1 sm:px-2.5 sm:py-1.5 bg-gray-800 hover:bg-gray-750 text-brand-yellow hover:text-white rounded-lg sm:rounded-xl border border-gray-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow-sm"
                  title="Edit Operating Radius / Center Point"
                >
                  <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Edit Geofence</span>
                </button>

                {/* Toggle Status Button */}
                <button
                  onClick={() => handleToggleCity(activeFocusedCity)}
                  className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl border transition active:scale-95 flex items-center justify-center ${
                    activeFocusedCity.is_active
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                      : 'bg-gray-850 border-gray-750 text-gray-400 hover:text-emerald-400'
                  }`}
                  title={
                    activeFocusedCity.is_active
                      ? 'Geofence Active (Click to Disable)'
                      : 'Disabled (Click to Activate)'
                  }
                >
                  <Power className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCity(activeFocusedCity.id)}
                  className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition active:scale-95 flex items-center justify-center"
                  title="Delete City Geofence"
                >
                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
