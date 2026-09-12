import React from 'react';
import {
  Radio,
  Navigation,
  Bike,
  Users,
  CreditCard,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  Zap,
  MapPin,
  X
} from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  {
    id: 'cities',
    label: 'Serviceable Cities',
    icon: MapPin,
    badgeKey: 'total_cities',
    badge: 'Geofence',
    badgeColor: 'bg-blue-500/20 text-blue-400 font-bold'
  },
  {
    id: 'live_drivers',
    label: 'Live Drivers',
    icon: Radio,
    badgeKey: 'online_drivers',
    badgeColor: 'bg-emerald-500/20 text-emerald-400'
  },
  {
    id: 'active_rides',
    label: 'Active Rides',
    icon: Navigation,
    badgeKey: 'active_rides',
    badgeColor: 'bg-amber-500/20 text-brand-yellow'
  },
  {
    id: 'drivers',
    label: 'Drivers (Captains)',
    icon: Bike,
    badgeKey: 'total_drivers',
    badgeColor: 'bg-gray-800 text-gray-400'
  },
  {
    id: 'passengers',
    label: 'Passengers',
    icon: Users,
    badgeKey: 'total_passengers',
    badgeColor: 'bg-gray-800 text-gray-400'
  },
  {
    id: 'payments',
    label: 'Payments & Comm.',
    icon: CreditCard,
    badgeKey: 'platform_commission',
    isCurrency: true,
    badgeColor: 'bg-emerald-500/15 text-emerald-400 font-black'
  },
  {
    id: 'complaints',
    label: 'Complaints',
    icon: AlertCircle,
    badgeKey: 'open_complaints',
    badgeColor: 'bg-red-500/20 text-red-400'
  },
  {
    id: 'reports',
    label: 'Reports & Settings',
    icon: BarChart3
  }
];

export const AdminSidebar = ({
  currentTab,
  onSelectTab,
  stats,
  cities = [],
  selectedCityId = 'all',
  onSelectCity,
  onClose
}) => {
  const activeCity = cities.find(c => c.id === selectedCityId);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 h-full select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-yellow flex items-center justify-center text-gray-950 font-black text-sm shadow-lg shadow-brand-yellow/20 shrink-0">
            R
          </div>
          <div>
            <div className="font-black text-base tracking-tight text-white flex items-center gap-1">
              RIDER<span className="text-brand-yellow">XO</span>
              <span className="text-[9px] bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded font-bold ml-1">
                ADMIN
              </span>
            </div>
            <div className="text-[10px] text-gray-400">Operations Control Center</div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white flex items-center justify-center transition active:scale-95"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* City Hub Quick Filter Pill */}
      {cities && cities.length > 0 && onSelectCity && (
        <div className="px-3 pt-3">
          <div className="bg-gray-850 p-2 rounded-xl border border-gray-800 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
              <span className="flex items-center gap-1 text-brand-yellow">
                <MapPin className="w-3 h-3" />
                Active City Hub
              </span>
              <span className="text-[8px] bg-gray-800 text-gray-300 px-1.5 py-0.2 rounded font-bold">
                {selectedCityId === 'all' ? 'All (Global)' : activeCity?.name?.split(',')[0]}
              </span>
            </div>

            <select
              value={selectedCityId}
              onChange={(e) => onSelectCity(e.target.value)}
              className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-lg py-1 px-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all">🌐 All Operational Cities ({cities.length})</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.name} ({c.radius_km} km zone)
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
          <span>Management & Fleet</span>
          {selectedCityId !== 'all' && (
            <span className="text-[8px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">
              Filtered
            </span>
          )}
        </div>

        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          let badgeVal = item.badge;
          if (item.badgeKey && stats) {
            badgeVal = item.isCurrency
              ? `₹${stats[item.badgeKey] || 0}`
              : stats[item.badgeKey];
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-brand-yellow text-gray-950 shadow-lg shadow-brand-yellow/10 font-bold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {badgeVal !== undefined && (
                <span
                  className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1.5 ${
                    isActive ? 'bg-gray-950 text-brand-yellow' : item.badgeColor || 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {badgeVal}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin Status Pill */}
      <div className="p-3.5 sm:p-4 border-t border-gray-800 bg-gray-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">Live Operations API</div>
            <div className="text-[9.5px] text-emerald-400 font-semibold flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              Socket.IO Live
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

