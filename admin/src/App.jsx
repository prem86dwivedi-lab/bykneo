import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { AdminSidebar, ADMIN_NAV_ITEMS } from './components/AdminSidebar';
import { LiveDriversPage } from './pages/LiveDriversPage';
import { ActiveRidesPage } from './pages/ActiveRidesPage';
import { DriversPage } from './pages/DriversPage';
import { PassengersPage } from './pages/PassengersPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { CitiesPage } from './pages/CitiesPage';
import { ReportsPage } from './pages/ReportsPage';

import { sendPwaNotification, requestNotificationPermission } from './utils/notification';
import { Bell, ShieldCheck, X, Menu } from 'lucide-react';

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
};

const BACKEND_URL = getBackendUrl();

export function App() {
  const [currentTab, setCurrentTab] = useState('cities'); // Default to Serviceable Cities
  const [selectedCityId, setSelectedCityId] = useState('all'); // 'all' or specific city.id
  const [overview, setOverview] = useState(null);
  const [onlineDrivers, setOnlineDrivers] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [socket, setSocket] = useState(null);
  const [kycAlert, setKycAlert] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const fetchOverview = () => {
    fetch(`${BACKEND_URL}/api/admin/overview`)
      .then(res => res.json())
      .then(data => {
        setOverview(data);
        setOnlineDrivers(data.online_drivers || []);
        setActiveRides(data.active_rides || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchOverview();
    requestNotificationPermission();

    const s = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
    s.on('connect', () => {
      console.log('💻 Admin Socket Connected');
      s.emit('join_admin');
    });

    s.on('admin:driver_moved', ({ driverId, lat, lng }) => {
      setOnlineDrivers(prev =>
        prev.map(d => (d.id === driverId ? { ...d, lat, lng } : d))
      );
    });

    s.on('admin:kyc_submitted', (data) => {
      console.log('🚨 Received admin:kyc_submitted:', data);
      sendPwaNotification(
        '🚨 New Captain KYC Submitted!',
        `Captain ${data.name} (${data.vehicle_category} • ${data.vehicle_model}) uploaded documents for verification.`
      );
      setKycAlert(data);
      fetchOverview();
    });

    s.on('admin:ride_created', ({ ride }) => {
      setActiveRides(prev => [ride, ...prev.filter(r => r.id !== ride.id)]);
      fetchOverview();
    });

    s.on('admin:ride_updated', ({ ride }) => {
      if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
        setActiveRides(prev => prev.filter(r => r.id !== ride.id));
      } else {
        setActiveRides(prev => [ride, ...prev.filter(r => r.id !== ride.id)]);
      }
      fetchOverview();
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const citiesList = overview?.cities || [];
  const activeCity = citiesList.find(c => c.id === selectedCityId);

  // Dynamic City-Filtered Stats Calculation
  const activeStats = (selectedCityId && selectedCityId !== 'all' && overview?.city_stats?.[selectedCityId])
    ? {
        ...overview.city_stats[selectedCityId],
        total_cities: citiesList.length,
        active_cities: citiesList.filter(c => c.is_active).length
      }
    : overview?.stats;

  const activeNavItem = ADMIN_NAV_ITEMS.find(item => item.id === currentTab) || ADMIN_NAV_ITEMS[0];

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#0B0F19] text-gray-100 overflow-hidden font-sans">
      {/* 1. Desktop Sidebar Navigation (Hidden on mobile) */}
      <div className="hidden lg:block h-full shrink-0">
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          stats={activeStats}
          cities={citiesList}
          selectedCityId={selectedCityId}
          onSelectCity={setSelectedCityId}
        />
      </div>

      {/* 2. Mobile Header (Visible on mobile/tablet) */}
      <div className="lg:hidden shrink-0 border-b border-gray-800 bg-gray-900/95 backdrop-blur-xl z-40">
        {/* Top bar with Hamburger Menu & City Filter */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 rounded-xl bg-gray-850 hover:bg-gray-800 text-brand-yellow border border-gray-750 flex items-center justify-center transition active:scale-90"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-brand-yellow flex items-center justify-center text-gray-950 font-black text-xs shadow-md">
                B
              </div>
              <div className="font-black text-sm text-white tracking-tight flex items-center gap-1">
                BYK<span className="text-brand-yellow">NEO</span>
              </div>
            </div>
          </div>

          {/* Quick City Switcher Dropdown on Mobile Header */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="bg-gray-850 border border-gray-750 text-brand-yellow text-[10.5px] font-bold rounded-lg py-1 px-1.5 focus:outline-none max-w-[120px] truncate"
            >
              <option value="all">🌐 All Cities</option>
              {citiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.name.split(',')[0]}
                </option>
              ))}
            </select>

            {/* Current Active Tab Pill */}
            <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg text-[10.5px] font-bold text-white">
              <activeNavItem.icon className="w-3 h-3 text-brand-yellow shrink-0" />
              <span className="truncate max-w-[80px]">{activeNavItem.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mobile Slide-Over Drawer Modal */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsMobileNavOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          />

          {/* Drawer Sidebar */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <AdminSidebar
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              stats={activeStats}
              cities={citiesList}
              selectedCityId={selectedCityId}
              onSelectCity={setSelectedCityId}
              onClose={() => setIsMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 4. Main Content Area (Full width on mobile, responsive padding) */}
      <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 relative min-w-0">
        {/* Floating Real-time KYC Alert Toast */}
        {kycAlert && (
          <div className="mb-4 sm:mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-brand-yellow rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black shadow-lg animate-bounce shrink-0 mt-0.5 sm:mt-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                  <span>🚨 New Captain KYC Submitted!</span>
                  <span className="text-[9px] bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 px-1.5 py-0.2 rounded-full uppercase font-bold">
                    Action Required
                  </span>
                </div>
                <div className="text-[11px] sm:text-xs text-gray-300 mt-0.5">
                  Captain <b className="text-white">{kycAlert.name}</b> ({kycAlert.phone}) uploaded DL, RC & Aadhaar for vehicle <b>{kycAlert.vehicle_model}</b>.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => {
                  setCurrentTab('drivers');
                  setKycAlert(null);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-[11px] sm:text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Review KYC Docs →
              </button>
              <button
                onClick={() => setKycAlert(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl active:scale-95 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentTab === 'live_drivers' && (
          <LiveDriversPage
            onlineDrivers={onlineDrivers}
            activeRides={activeRides}
          />
        )}
        {currentTab === 'active_rides' && (
          <ActiveRidesPage activeRides={activeRides} />
        )}
        {currentTab === 'drivers' && (
          <DriversPage BACKEND_URL={BACKEND_URL} />
        )}
        {currentTab === 'passengers' && (
          <PassengersPage BACKEND_URL={BACKEND_URL} />
        )}
        {currentTab === 'payments' && (
          <PaymentsPage
            BACKEND_URL={BACKEND_URL}
            stats={overview?.stats}
          />
        )}
        {currentTab === 'complaints' && (
          <ComplaintsPage BACKEND_URL={BACKEND_URL} />
        )}
        {currentTab === 'cities' && (
          <CitiesPage
            BACKEND_URL={BACKEND_URL}
            selectedCityId={selectedCityId}
            setSelectedCityId={setSelectedCityId}
            cityStats={overview?.city_stats}
            onNavigateTab={setCurrentTab}
          />
        )}
        {currentTab === 'reports' && (
          <ReportsPage
            BACKEND_URL={BACKEND_URL}
            settings={overview?.settings}
            onUpdateSettings={fetchOverview}
          />
        )}
      </main>
    </div>
  );
}
export default App;

