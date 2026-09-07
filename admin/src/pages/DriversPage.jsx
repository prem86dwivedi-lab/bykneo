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
  ShieldAlert
} from 'lucide-react';

export const DriversPage = ({ BACKEND_URL }) => {
  const [drivers, setDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'online'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [loading, setLoading] = useState(true);
  const [inspectingDriver, setInspectingDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [autoKycEnabled, setAutoKycEnabled] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);

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
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = drivers.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.vehicle_number && d.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.license_number && d.license_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.vehicle_model && d.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') return d.kyc_status === 'pending';
    if (statusFilter === 'approved') return d.kyc_status === 'approved';
    if (statusFilter === 'online') return d.is_online;
    return true;
  });

  const pendingCount = drivers.filter(d => d.kyc_status === 'pending').length;
  const approvedCount = drivers.filter(d => d.kyc_status === 'approved').length;
  const onlineCount = drivers.filter(d => d.is_online).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar with Auto KYC Toggle, Search & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Bike className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
            <span>Captains Directory & KYC</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400">
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
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, phone, RC, DL..."
              className="bg-gray-900 border border-gray-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow w-full transition shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
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
              <LayoutGrid className="w-4 h-4" />
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
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1.5 ${
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
            {drivers.length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1.5 ${
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
          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shrink-0 flex items-center gap-1.5 ${
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

      {/* 1. CARD GRID VIEW (Default & Modern Container Layout) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 shadow-xl transition-all duration-200 hover:shadow-2xl hover:shadow-brand-yellow/5 flex flex-col justify-between space-y-3 relative group"
            >
              {/* Top Header Row with Driver Avatar, Name, Phone & Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {d.vehicle_category === 'CAB' ? '🚗' : d.vehicle_category === 'AUTO' ? '🛺' : '🏍️'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-white text-sm sm:text-base leading-tight truncate">
                      {d.name}
                    </h4>
                    <div className="text-gray-400 text-xs font-mono flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-gray-500 shrink-0" />
                      <span className="truncate">{d.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Badges: Online + KYC status */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
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
                    className={`text-[8.5px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1 ${
                      d.is_online
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-850 text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        d.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    {d.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Structured Key Details Container matching User's Spec */}
              <div className="bg-gray-850/80 rounded-xl p-3 border border-gray-800 space-y-2 text-xs">
                {/* 1. Vehicle Details */}
                <div className="flex items-start justify-between gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    VEHICLE NAME:
                  </span>
                  <div className="text-right min-w-0">
                    <div className="text-white font-bold text-xs truncate">
                      {d.vehicle_type_name || d.vehicle_model || 'Bykneo Bike'}
                    </div>
                    <div className="text-brand-yellow font-mono text-[11px] font-bold">
                      {d.vehicle_number || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 2. License No */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    LICENSE NO.:
                  </span>
                  <span className="font-mono text-gray-200 font-bold text-[11px] truncate">
                    {d.license_number || 'N/A'}
                  </span>
                </div>

                {/* 3. Status & Rating */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    STATUS & RATING:
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0" />
                    <span className="font-bold text-white text-xs">{d.rating || 5.0}</span>
                    <span className="text-gray-500 text-[10px]">({d.total_rides || 0} trips)</span>
                  </div>
                </div>

                {/* 4. KYC State */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800/60">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
                    KYC STATE:
                  </span>
                  <span
                    className={`text-[9.5px] font-black uppercase ${
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
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => setInspectingDriver(d)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-750 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 border border-gray-700 active:scale-95 shadow-sm truncate"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
                  <span>Inspect Docs</span>
                </button>

                {d.kyc_status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateKyc(d.id, 'approved')}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 border border-emerald-500/30 active:scale-95 shadow-sm shrink-0"
                    title="Approve Driver KYC"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                )}

                {d.kyc_status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateKyc(d.id, 'rejected')}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1 border border-red-500/30 active:scale-95 shadow-sm shrink-0"
                    title="Reject Driver KYC"
                  >
                    <X className="w-3.5 h-3.5" />
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
                          {d.vehicle_type_name || d.vehicle_model || 'Bykneo Bike'}
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
                    src={
                      inspectingDriver.selfie_photo ||
                      inspectingDriver.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
                    }
                    alt="Live Selfie"
                    onClick={() =>
                      setPreviewImage(
                        inspectingDriver.selfie_photo ||
                        inspectingDriver.avatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400'
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
                    src={
                      inspectingDriver.dl_photo ||
                      'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
                    }
                    alt="Driving License"
                    onClick={() =>
                      setPreviewImage(
                        inspectingDriver.dl_photo ||
                        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400'
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
                    src={
                      inspectingDriver.rc_photo ||
                      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'
                    }
                    alt="Vehicle Registration Certificate (VRC)"
                    onClick={() =>
                      setPreviewImage(
                        inspectingDriver.rc_photo ||
                        'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400'
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
                    src={
                      inspectingDriver.aadhaar_photo ||
                      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400'
                    }
                    alt="Aadhaar Card"
                    onClick={() =>
                      setPreviewImage(
                        inspectingDriver.aadhaar_photo ||
                        'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400'
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => handleUpdateKyc(inspectingDriver.id, 'rejected', rejectionReason)}
                className="py-2.5 px-4 sm:py-3 sm:px-5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl sm:rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <X className="w-4 h-4" /> Reject Documents
              </button>

              <button
                onClick={() => handleUpdateKyc(inspectingDriver.id, 'approved')}
                className="py-2.5 px-4 sm:py-3 sm:px-6 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-brand-yellow/20 flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <Check className="w-4 h-4" /> APPROVE & ACTIVATE CAPTAIN
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
