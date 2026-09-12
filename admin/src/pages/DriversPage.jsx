import React, { useState, useEffect } from 'react';
import {
  Bike,
  ShieldCheck,
  Check,
  X,
  Star,
  AlertTriangle,
  Phone,
  Search,
  Eye,
  FileText,
  CreditCard,
  ExternalLink,
  Car,
  Clock,
  LayoutGrid,
  List,
  Filter,
  User,
  Sparkles,
  Zap,
  Camera,
  ShieldAlert,
  Trash2,
  MapPin,
  ChevronDown
} from 'lucide-react';

const VEHICLE_TYPES = [
  { id: 'bike_lite', name: 'Bike Lite', wheels: '2W', icon: '🛵' },
  { id: 'bike', name: 'Bykneo Bike', wheels: '2W', icon: '🏍️' },
  { id: 'auto_lite', name: 'Auto Lite', wheels: '3W', icon: '🛺' },
  { id: 'auto', name: 'Bykneo Auto', wheels: '3W', icon: '🛺' },
  { id: 'cab_economy', name: 'Cab Eco', wheels: '4W', icon: '🚗' },
  { id: 'cab_premium', name: 'Cab Prem', wheels: '4W', icon: '🚘' }
];

export const DriversPage = ({
  BACKEND_URL,
  selectedCityId = 'all',
  setSelectedCityId,
  cities = [],
  onUpdateOverview
}) => {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'online'
  const [vehicleFilter, setVehicleFilter] = useState('all'); // 'all' | 'bike_lite' | 'bike' | 'auto_lite' | 'auto' | 'cab_economy' | 'cab_premium'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(true);
  const [inspectingDriver, setInspectingDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [autoKycEnabled, setAutoKycEnabled] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [confirmDeleteDriver, setConfirmDeleteDriver] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to resolve full image URLs from backend storage
  const getResolvedPhotoUrl = (url, fallback = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400') => {
    if (!url) return fallback;
    if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
    const cleanBase = (BACKEND_URL || '').replace(/\/+$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  const fetchDrivers = () => {
    fetch(`${BACKEND_URL}/api/admin/drivers`)
      .then(res => res.json())
      .then(data => {
        setDrivers(data.drivers || []);
        setLoading(false);
      })
      .catch(console.error);
  };

  const fetchOverviewSettings = () => {
    fetch(`${BACKEND_URL}/api/admin/overview`)
      .then(res => res.json())
      .then(data => {
        if (data.settings?.auto_kyc_enabled !== undefined) {
          setAutoKycEnabled(data.settings.auto_kyc_enabled);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDrivers();
    fetchOverviewSettings();
  }, []);

  const handleToggleAutoKyc = async () => {
    setUpdatingSettings(true);
    const nextVal = !autoKycEnabled;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_kyc_enabled: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        setAutoKycEnabled(nextVal);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleUpdateKyc = async (driverId, status, reason = '') => {
    try {
      await fetch(`${BACKEND_URL}/api/admin/drivers/kyc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, status, rejectionReason: reason })
      });
      setInspectingDriver(null);
      setRejectionReason('');
      fetchDrivers();
      if (onUpdateOverview) onUpdateOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDriver = async (driverId) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/drivers/${driverId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDrivers(prev => prev.filter(d => d.id !== driverId));
        setConfirmDeleteDriver(null);
        if (inspectingDriver?.id === driverId) {
          setInspectingDriver(null);
        }
        if (onUpdateOverview) onUpdateOverview();
      } else {
        alert(data.error || 'Failed to remove captain.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to remove captain. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

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

  const activeCity = cities.find(c => c.id === selectedCityId);

  // 1. Filter by Selected City Hub
  const cityDrivers = drivers.filter(d => {
    if (!selectedCityId || selectedCityId === 'all') return true;
    if (!activeCity) return true;
    if (d.city_id && d.city_id === activeCity.id) return true;
    const radius = Number(activeCity.radius_km || 30);
    if (d.lat && d.lng && activeCity.lat && activeCity.lng) {
      return calculateDistance(d.lat, d.lng, activeCity.lat, activeCity.lng) <= radius;
    }
    return false;
  });

  // 2. Filter by Vehicle Type (2W, 3W, 4W)
  const vehicleFilteredDrivers = cityDrivers.filter(d => {
    if (!vehicleFilter || vehicleFilter === 'all') return true;
    return d.vehicle_id === vehicleFilter;
  });

  // 3. Filter by Search Query & Tab Filter (All, Pending, Approved, Online)
  const filtered = vehicleFilteredDrivers.filter(d => {
    const matchesSearch =
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      (d.vehicle_number && d.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.license_number && d.license_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.vehicle_model && d.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return d.kyc_status === 'pending';
    if (statusFilter === 'approved') return d.kyc_status === 'approved';
    if (statusFilter === 'online') return d.is_online;
    return true;
  });

  const pendingCount = vehicleFilteredDrivers.filter(d => d.kyc_status === 'pending').length;
  const approvedCount = vehicleFilteredDrivers.filter(d => d.kyc_status === 'approved').length;
  const onlineCount = vehicleFilteredDrivers.filter(d => d.is_online).length;

  const getVehicleCount = (vId) => {
    return cityDrivers.filter(d => d.vehicle_id === vId).length;
  };

  const getWheelsCategory = (driver) => {
    if (driver.vehicle_category === 'CAB' || ['cab_economy', 'cab_premium'].includes(driver.vehicle_id)) return '4W';
    if (driver.vehicle_category === 'AUTO' || ['auto_lite', 'auto'].includes(driver.vehicle_id)) return '3W';
    return '2W';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Header Bar with Auto KYC Toggle, Search & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-brand-yellow shrink-0" />
            <span>Captains Directory & KYC</span>
          </h2>
          <p className="text-[10.5px] sm:text-xs text-gray-400">
            Inspect commercial driving licenses, vehicle RC books, Aadhaar identity, live selfies, and approve captains
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Verification Mode Toggle (⚡ Auto AI Verification vs 🛡️ Manual Admin Review) */}
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-1.5 shadow-sm">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  autoKycEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] sm:text-[11px] font-black text-white whitespace-nowrap flex items-center gap-1">
                {autoKycEnabled ? (
                  <>
                    <Zap className="w-3 h-3 text-brand-yellow" />
                    <span>Auto AI KYC: <b className="text-emerald-400">ON</b></span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>Manual KYC: <b className="text-amber-400">ON</b></span>
                  </>
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleAutoKyc}
              disabled={updatingSettings}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoKycEnabled ? 'bg-brand-yellow' : 'bg-gray-700'
              }`}
              title={
                autoKycEnabled
                  ? '⚡ Auto AI Real Owner Verification is ON (Click to switch to Manual Admin Review)'
                  : '🛡️ Manual Admin Review is ON (Click to enable Instant Auto AI Verification)'
              }
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow ring-0 transition duration-200 ease-in-out ${
                  autoKycEnabled ? 'translate-x-4 bg-gray-950' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Search Box Input */}
          <div className="relative flex-1 sm:w-52">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, RC, DL..."
              className="bg-gray-900 border border-gray-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow w-full transition shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-brand-yellow text-gray-950 font-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-brand-yellow text-gray-950 font-black shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table Spreadsheet View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner Row with Active Hub & 7 Vehicle Type Filter Tabs (3 columns on mobile, 2-3 lines, no horizontal scrollbar) */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex flex-col gap-2.5 shadow-lg">
        {/* Top Bar: Active City Hub Tag + Quick City Selector Dropdown */}
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-black text-xs shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-white font-black text-xs whitespace-nowrap">
              {selectedCityId !== 'all' && activeCity ? (
                <>
                  <span className="text-brand-yellow">📍 {activeCity.name}</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded-full font-bold ml-1.5">
                    {activeCity.radius_km} KM
                  </span>
                </>
              ) : (
                <span className="text-brand-yellow">🌐 All Operational Cities</span>
              )}
            </span>
          </div>

          {/* Quick City Hub Selector Dropdown */}
          {cities.length > 0 && setSelectedCityId && (
            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <span className="text-[10px] text-gray-500 hidden sm:inline font-bold">Filter by Hub:</span>
              <select
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="bg-gray-850 border border-gray-750 hover:border-brand-yellow text-brand-yellow text-xs font-bold rounded-lg py-1 px-2 focus:outline-none cursor-pointer transition shadow-sm w-full sm:w-auto"
              >
                <option value="all">🌐 All Operational Cities ({cities.length})</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    📍 {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 7 Vehicle Filter Tabs (3 Columns on Mobile, 2-3 Lines, No Scrollbar) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 xl:flex xl:flex-wrap xl:items-center xl:justify-center gap-1 sm:gap-1.5 w-full">
          <button
            onClick={() => setVehicleFilter('all')}
            className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition flex items-center justify-between sm:justify-start gap-1 border ${
              vehicleFilter === 'all'
                ? 'bg-brand-yellow text-gray-950 border-brand-yellow font-black shadow-sm'
                : 'bg-gray-850 hover:bg-gray-800 text-gray-300 border-gray-750'
            }`}
            title="Show All Vehicle Types"
          >
            <span className="truncate">All Fleet</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                vehicleFilter === 'all' ? 'bg-gray-950/20 text-gray-950 font-black' : 'bg-gray-800 text-gray-400'
              }`}
            >
              {cityDrivers.length}
            </span>
          </button>

          {VEHICLE_TYPES.map((v) => {
            const count = getVehicleCount(v.id);
            const isSelected = vehicleFilter === v.id;

            return (
              <button
                key={v.id}
                onClick={() => setVehicleFilter(isSelected ? 'all' : v.id)}
                className={`px-2 py-1.5 rounded-lg text-[10.5px] font-bold transition flex items-center justify-between sm:justify-start gap-1 border ${
                  isSelected
                    ? 'bg-brand-yellow text-gray-950 border-brand-yellow font-black shadow-sm'
                    : 'bg-gray-850 hover:bg-gray-800 text-gray-300 border-gray-750'
                }`}
                title={`Filter by ${v.name}`}
              >
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <span className="shrink-0 text-xs">{v.icon}</span>
                  <span className="truncate font-bold text-[10px] sm:text-[10.5px]">
                    {v.name}
                  </span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold shrink-0 ${
                    isSelected
                      ? 'bg-gray-950/20 text-gray-950'
                      : count > 0
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Status Filter Tabs (2x2 grid on mobile, 4 columns on sm+) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 w-full">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-between ${
            statusFilter === 'all'
              ? 'bg-brand-yellow text-gray-950 shadow-md font-black'
              : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
          }`}
        >
          <span>All Captains</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              statusFilter === 'all' ? 'bg-gray-950/20 text-gray-950' : 'bg-gray-800 text-gray-300'
            }`}
          >
            {cityDrivers.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-between ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-gray-950 shadow-md font-black'
              : 'bg-gray-900 text-amber-400/80 hover:text-amber-400 border border-gray-800'
          }`}
        >
          <span>Pending KYC</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              statusFilter === 'pending'
                ? 'bg-gray-950/20 text-gray-950 font-black'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-between ${
            statusFilter === 'approved'
              ? 'bg-emerald-500 text-gray-950 shadow-md font-black'
              : 'bg-gray-900 text-emerald-400/80 hover:text-emerald-400 border border-gray-800'
          }`}
        >
          <span>Approved</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              statusFilter === 'approved'
                ? 'bg-gray-950/20 text-gray-950 font-black'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('online')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center justify-between ${
            statusFilter === 'online'
              ? 'bg-blue-500 text-white shadow-md font-black'
              : 'bg-gray-900 text-blue-400/80 hover:text-blue-400 border border-gray-800'
          }`}
        >
          <span>● Live Online</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-md ${
              statusFilter === 'online'
                ? 'bg-black/30 text-white font-black'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {onlineCount}
          </span>
        </button>
      </div>

      {/* 1. CARD GRID VIEW (Compact Modern Layout) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-lg transition-all duration-200 hover:shadow-xl flex flex-col justify-between space-y-2 relative group"
            >
              {/* Top Header Row with Driver Avatar, Name, Phone, Wheeler Box & Status */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    {d.vehicle_category === 'CAB' ? '🚗' : d.vehicle_category === 'AUTO' ? '🛺' : '🏍️'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white text-xs sm:text-[13px] leading-tight truncate">
                      {d.name}
                    </h4>
                    <div className="text-gray-400 text-[10px] font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                      <span className="truncate">{d.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Wheeler Category Box Badge (2W / 3W / 4W) */}
                <div className="flex items-center shrink-0 self-center">
                  <span
                    className={`px-2 py-0.5 rounded-lg border font-black text-[10px] font-mono tracking-wider shadow-sm flex items-center justify-center ${
                      getWheelsCategory(d) === '4W'
                        ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                        : getWheelsCategory(d) === '3W'
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                    }`}
                    title={`${getWheelsCategory(d)} Category`}
                  >
                    {getWheelsCategory(d)}
                  </span>
                </div>

                {/* Badges: Online + KYC status */}
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span
                    className={`text-[7.5px] font-black uppercase px-1.5 py-0.2 rounded-full border ${
                      d.kyc_status === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : d.kyc_status === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}
                  >
                    {d.kyc_status || 'PENDING'}
                  </span>

                  <span
                    className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 ${
                      d.is_online
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-850 text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full ${
                        d.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    {d.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Structured Key Details Container */}
              <div className="bg-gray-850/80 rounded-lg p-2 border border-gray-800/80 space-y-1 text-[11px]">
                {/* 1. Vehicle Details */}
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    VEHICLE:
                  </span>
                  <div className="text-right min-w-0">
                    <div className="text-white font-bold text-[11px] truncate">
                      {d.vehicle_type_name?.replace(/\s*\(\d+W\)/i, '') || d.vehicle_model || 'Bykneo Bike'}
                    </div>
                    <div className="text-brand-yellow font-mono text-[10px] font-bold">
                      {d.vehicle_number || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 2. License No */}
                <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-gray-800/60">
                  <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    LICENSE:
                  </span>
                  <span className="font-mono text-gray-200 font-bold text-[10px] truncate">
                    {d.license_number || 'N/A'}
                  </span>
                </div>

                {/* 3. Status & Rating */}
                <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-gray-800/60">
                  <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    RATING:
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow shrink-0" />
                    <span className="font-bold text-white text-[10.5px]">{d.rating || 5.0}</span>
                    <span className="text-gray-500 text-[9px]">({d.total_rides || 0} trips)</span>
                  </div>
                </div>

                {/* 4. KYC State */}
                <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-gray-800/60">
                  <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    KYC STATE:
                  </span>
                  <span
                    className={`text-[8.5px] font-black uppercase ${
                      d.kyc_status === 'approved'
                        ? 'text-emerald-400'
                        : d.kyc_status === 'pending'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    ● {d.kyc_status || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="flex items-center gap-1 pt-0.5">
                <button
                  onClick={() => setInspectingDriver(d)}
                  className="flex-1 py-1.5 px-2 bg-gray-800 hover:bg-gray-750 text-white rounded-lg font-bold text-[10.5px] transition flex items-center justify-center gap-1 border border-gray-700 active:scale-95 shadow-sm truncate"
                >
                  <Eye className="w-3 h-3 text-brand-yellow shrink-0" />
                  <span>Inspect Docs</span>
                </button>

                <button
                  onClick={() => setConfirmDeleteDriver(d)}
                  className="px-2 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-lg font-bold text-[10.5px] transition flex items-center justify-center gap-1 border border-rose-500/30 active:scale-95 shadow-sm shrink-0"
                  title="Remove Captain"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>

                {d.kyc_status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateKyc(d.id, 'approved')}
                    className="px-2 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-bold text-[10.5px] transition flex items-center justify-center gap-0.5 border border-emerald-500/30 active:scale-95 shadow-sm shrink-0"
                    title="Approve Driver KYC"
                  >
                    <Check className="w-3 h-3" />
                    <span>Approve</span>
                  </button>
                )}

                {d.kyc_status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateKyc(d.id, 'rejected')}
                    className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-bold text-[10.5px] transition flex items-center justify-center gap-0.5 border border-red-500/30 active:scale-95 shadow-sm shrink-0"
                    title="Reject Driver KYC"
                  >
                    <X className="w-3 h-3" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. TABLE VIEW (Alternate Compact Spreadsheet View) */}
      {viewMode === 'table' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-gray-850 text-gray-400 uppercase font-bold border-b border-gray-800 text-[10px] sm:text-xs">
                <tr>
                  <th className="p-3 sm:p-4">Captain</th>
                  <th className="p-3 sm:p-4">Vehicle Details</th>
                  <th className="p-3 sm:p-4">License No.</th>
                  <th className="p-3 sm:p-4">Status & Rating</th>
                  <th className="p-3 sm:p-4">KYC State</th>
                  <th className="p-3 sm:p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-850/50 transition">
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-white text-xs sm:text-sm">{d.name}</div>
                      <div className="text-gray-400 text-[10px] sm:text-[11px]">{d.phone}</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="font-semibold text-white flex items-center gap-1.5 text-xs">
                        <span>
                          {d.vehicle_category === 'CAB' ? '🚗' : d.vehicle_category === 'AUTO' ? '🛺' : '🏍️'}
                        </span>
                        <span className="truncate max-w-[130px]">
                          {d.vehicle_type_name?.replace(/\s*\(\d+W\)/i, '') || d.vehicle_model || 'Bykneo Bike'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded border font-mono font-bold text-[9px] ${
                            getWheelsCategory(d) === '4W'
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : getWheelsCategory(d) === '3W'
                              ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                              : 'bg-amber-400/15 text-amber-400 border-amber-400/30'
                          }`}
                        >
                          {getWheelsCategory(d)}
                        </span>
                      </div>
                      <div className="text-gray-400 text-[10px] truncate max-w-[130px]">
                        {d.vehicle_model}
                      </div>
                      <div className="text-brand-yellow font-mono text-[10px] sm:text-[11px] font-bold">
                        {d.vehicle_number}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-gray-300 text-[11px]">{d.license_number}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                        <span className="font-bold text-white text-xs">{d.rating || 5.0}</span>
                        <span className="text-gray-500 text-[10px]">({d.total_rides || 0})</span>
                      </div>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                          d.is_online
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {d.is_online ? '● Online' : '○ Offline'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                          d.kyc_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : d.kyc_status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {d.kyc_status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-right space-x-1 sm:space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setInspectingDriver(d)}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-800 hover:bg-gray-750 text-white rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition inline-flex items-center gap-1 border border-gray-700"
                      >
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-yellow" /> Inspect Docs
                      </button>

                      <button
                        onClick={() => setConfirmDeleteDriver(d)}
                        className="px-2 py-1 sm:px-3 sm:py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition inline-flex items-center gap-1 border border-rose-500/30"
                        title="Remove Captain"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Remove
                      </button>

                      {d.kyc_status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateKyc(d.id, 'approved')}
                          className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Approve
                        </button>
                      )}
                      {d.kyc_status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateKyc(d.id, 'rejected')}
                          className="px-2 py-1 sm:px-3 sm:py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-[11px] transition inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-800 text-gray-500 flex items-center justify-center mx-auto">
            <Bike className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm sm:text-base font-bold text-white">No captains found</h4>
            <p className="text-xs text-gray-500">
              {searchTerm
                ? `No drivers match "${searchTerm}". Try a different name, phone, or RC number.`
                : 'No registered captains found in this category.'}
            </p>
          </div>
        </div>
      )}

      {/* KYC Document & Live Selfie Inspector Modal (Full Manual Verification Engine) */}
      {inspectingDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-4 sm:space-y-5 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-black text-base sm:text-lg shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-lg font-black text-white flex items-center gap-2">
                    <span>KYC Verification: {inspectingDriver.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.2 rounded-full font-bold uppercase ${
                        inspectingDriver.kyc_status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inspectingDriver.kyc_status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {inspectingDriver.kyc_status}
                    </span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-gray-400">
                    Phone: {inspectingDriver.phone} • Mode:{' '}
                    <span className="text-brand-yellow font-semibold">
                      {inspectingDriver.kyc_verified_mode || 'Manual Review'}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingDriver(null)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vehicle & Payout Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              <div className="bg-gray-850 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[9.5px] text-gray-400 uppercase font-bold block">Vehicle Details</span>
                <div className="text-xs font-bold text-white">
                  {inspectingDriver.vehicle_type_name
                    ? `${inspectingDriver.vehicle_type_name} (${inspectingDriver.vehicle_category})`
                    : inspectingDriver.vehicle_category || 'BIKE'}{' '}
                  • {inspectingDriver.vehicle_model || 'Honda Shine'}
                </div>
                <div className="text-xs sm:text-sm font-mono font-black text-brand-yellow">
                  {inspectingDriver.vehicle_number || 'MP 04 AB 1234'}
                </div>
              </div>

              <div className="bg-gray-850 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                <span className="text-[9.5px] text-gray-400 uppercase font-bold block">Payout Destination</span>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  UPI / Bank Account
                </div>
                <div className="text-xs font-mono text-white truncate">
                  {inspectingDriver.payout_upi || `${inspectingDriver.phone}@upi`}
                </div>
              </div>
            </div>

            {/* 4-Document Image Gallery including Live Selfie */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] sm:text-xs font-black uppercase text-gray-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-yellow" />
                  Submitted Verification Documents & Live Selfie
                </h4>
                <span className="text-[10px] text-gray-400">Compare Live Selfie face with DL Photo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {/* 1. Live Camera Selfie (Face Liveness) */}
                <div className="bg-gray-850 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                  <div className="text-[10px] font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Camera className="w-3 h-3 text-purple-400" />
                      <span>Live Selfie</span>
                    </span>
                    <span className="text-[8.5px] text-purple-400 font-bold">Face Cam</span>
                  </div>
                  <div className="text-[9px] text-gray-400 truncate">Real Owner Scan</div>
                  <img
                    src={getResolvedPhotoUrl(
                      inspectingDriver.selfie_photo || inspectingDriver.avatar,
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
                    )}
                    alt="Live Selfie"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';
                    }}
                    onClick={() =>
                      setPreviewImage(
                        getResolvedPhotoUrl(
                          inspectingDriver.selfie_photo || inspectingDriver.avatar,
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
                        )
                      )
                    }
                    className="w-full h-24 rounded-lg sm:rounded-xl object-cover border border-purple-500/40 cursor-pointer hover:opacity-80 transition"
                  />
                  <span className="text-[8px] text-purple-300 block text-center font-semibold">Tap to inspect face</span>
                </div>

                {/* 2. Driving License */}
                <div className="bg-gray-850 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                  <div className="text-[10px] font-bold text-white flex items-center justify-between">
                    <span>Driving License</span>
                    <span className="text-[8.5px] text-emerald-400 font-bold">Valid DL</span>
                  </div>
                  <div className="text-[9px] font-mono text-brand-yellow truncate">
                    {inspectingDriver.license_number || 'N/A'}
                  </div>
                  <img
                    src={getResolvedPhotoUrl(
                      inspectingDriver.dl_photo,
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
                    )}
                    alt="Driving License"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400';
                    }}
                    onClick={() =>
                      setPreviewImage(
                        getResolvedPhotoUrl(
                          inspectingDriver.dl_photo,
                          'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
                        )
                      )
                    }
                    className="w-full h-24 rounded-lg sm:rounded-xl object-cover border border-gray-700 cursor-pointer hover:opacity-80 transition"
                  />
                  <span className="text-[8px] text-gray-400 block text-center">Tap to zoom DL</span>
                </div>

                {/* 3. Vehicle Registration Certificate (VRC) */}
                <div className="bg-gray-850 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                  <div className="text-[10px] font-bold text-white flex items-center justify-between">
                    <span>Vehicle VRC</span>
                    <span className="text-[8.5px] text-blue-400 font-bold">VRC Doc</span>
                  </div>
                  <div className="text-[9px] font-mono text-brand-yellow truncate">
                    {inspectingDriver.rc_number || 'RC-MP04-998877'}
                  </div>
                  <img
                    src={getResolvedPhotoUrl(
                      inspectingDriver.rc_photo,
                      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'
                    )}
                    alt="Vehicle Registration Certificate (VRC)"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400';
                    }}
                    onClick={() =>
                      setPreviewImage(
                        getResolvedPhotoUrl(
                          inspectingDriver.rc_photo,
                          'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'
                        )
                      )
                    }
                    className="w-full h-24 rounded-lg sm:rounded-xl object-cover border border-gray-700 cursor-pointer hover:opacity-80 transition"
                  />
                  <span className="text-[8px] text-gray-400 block text-center">Tap to zoom VRC</span>
                </div>

                {/* 4. Aadhaar Card */}
                <div className="bg-gray-850 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-gray-800 space-y-1">
                  <div className="text-[10px] font-bold text-white flex items-center justify-between">
                    <span>Aadhaar Card</span>
                    <span className="text-[8.5px] text-cyan-400 font-bold">ID Card</span>
                  </div>
                  <div className="text-[9px] font-mono text-brand-yellow truncate">
                    {inspectingDriver.aadhaar_number || '9876 5432 1098'}
                  </div>
                  <img
                    src={getResolvedPhotoUrl(
                      inspectingDriver.aadhaar_photo,
                      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400'
                    )}
                    alt="Aadhaar Card"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400';
                    }}
                    onClick={() =>
                      setPreviewImage(
                        getResolvedPhotoUrl(
                          inspectingDriver.aadhaar_photo,
                          'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400'
                        )
                      )
                    }
                    className="w-full h-24 rounded-lg sm:rounded-xl object-cover border border-gray-700 cursor-pointer hover:opacity-80 transition"
                  />
                  <span className="text-[8px] text-gray-400 block text-center">Tap to zoom ID</span>
                </div>
              </div>
            </div>

            {/* Rejection Note input */}
            <div>
              <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 block mb-1">
                Rejection Note / Feedback (if rejecting):
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Live Selfie does not match Driving License photo, blurry RC..."
                className="w-full bg-gray-850 border border-gray-750 focus:border-brand-yellow rounded-xl py-2 px-3 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmDeleteDriver(inspectingDriver);
                }}
                className="py-2.5 px-4 sm:py-3 sm:px-5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 rounded-xl sm:rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-rose-500/30"
              >
                <Trash2 className="w-4 h-4" /> Remove Captain
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleUpdateKyc(inspectingDriver.id, 'rejected', rejectionReason)}
                  className="flex-1 sm:flex-none py-2.5 px-4 sm:py-3 sm:px-5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl sm:rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <X className="w-4 h-4" /> Reject Documents
                </button>

                <button
                  onClick={() => handleUpdateKyc(inspectingDriver.id, 'approved')}
                  className="flex-1 sm:flex-none py-2.5 px-4 sm:py-3 sm:px-6 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-brand-yellow/20 flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" /> APPROVE & ACTIVATE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Driver Confirmation Modal */}
      {confirmDeleteDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-gray-900 border border-gray-750 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Remove Captain</h3>
                <p className="text-xs text-gray-400">Permanently delete driver from fleet</p>
              </div>
            </div>

            <div className="bg-gray-850 p-3 rounded-xl border border-gray-800 space-y-1 text-xs">
              <div className="text-white font-bold">{confirmDeleteDriver.name}</div>
              <div className="text-gray-400 font-mono">{confirmDeleteDriver.phone}</div>
              <div className="text-brand-yellow font-mono text-[11px] font-bold">
                {confirmDeleteDriver.vehicle_number || confirmDeleteDriver.vehicle_model}
              </div>
            </div>

            <p className="text-xs text-rose-300/90 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
              ⚠️ Are you sure you want to remove captain <b>{confirmDeleteDriver.name}</b>? This action will permanently remove the captain and their documents from the platform.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteDriver(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteDriver(confirmDeleteDriver.id)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <img
              src={previewImage}
              alt="Document Zoom Preview"
              className="max-w-full max-h-[85vh] rounded-3xl object-contain border-2 border-brand-yellow/40 shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/80 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
