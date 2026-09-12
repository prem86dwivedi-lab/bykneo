import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Bike,
  Compass,
  History,
  Wallet,
  User,
  ShieldCheck,
  Power,
  Radio,
  Navigation,
  DollarSign,
  LogOut,
  ArrowRightLeft,
  ChevronRight,
  Star
} from 'lucide-react';

export const DrawerMenu = ({
  isOpen,
  onClose,
  currentScreen,
  onNavigate,
  isDriverOnline,
  onToggleDriverOnline
}) => {
  const { user, driverProfile, activeRole, switchRole, logout } = useAuth();

  if (!isOpen) return null;

  const isCaptain = activeRole === 'driver';

  const passengerMenuItems = [
    { id: 'book_ride', label: 'Book Ride', icon: Bike, desc: 'Find nearby bikes' },
    { id: 'find_driver', label: 'Find Driver', icon: Compass, desc: 'Search available rides' },
    { id: 'live_tracking', label: 'Live Tracking', icon: Navigation, desc: 'Active ongoing trip' },
    { id: 'my_rides', label: 'My Rides', icon: History, desc: 'Trip receipts & records' },
    { id: 'wallet', label: 'Wallet', icon: Wallet, desc: 'Balance & payments' },
    { id: 'profile', label: 'Profile', icon: User, desc: 'Account & safety' },
  ];

  const driverMenuItems = [
    { id: 'driver_home', label: 'Driver Home', icon: Bike, desc: 'Dashboard & radar' },
    {
      id: 'toggle_online',
      label: isDriverOnline ? 'Go Offline' : 'Go Online',
      icon: Power,
      desc: isDriverOnline ? 'Currently accepting rides' : 'Tap to receive rides',
      isAction: true,
      action: onToggleDriverOnline,
      activeColor: isDriverOnline ? 'text-emerald-400' : 'text-gray-400'
    },
    { id: 'ride_requests', label: 'Ride Requests', icon: Radio, desc: 'Incoming ride alerts' },
    { id: 'current_ride', label: 'Current Ride', icon: Navigation, desc: 'Active customer trip' },
    { id: 'earnings', label: 'Earnings and Recharge', icon: DollarSign, desc: 'Daily payout summary' },
    { id: 'driver_kyc', label: 'KYC & Documents', icon: ShieldCheck, desc: 'DL, RC, Aadhaar verification' },
    { id: 'driver_profile', label: 'Profile Settings', icon: User, desc: 'Account & vehicle' },
  ];

  const menuItems = isCaptain ? driverMenuItems : passengerMenuItems;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Body */}
      <div className="relative w-80 max-w-[85vw] bg-gray-900 border-r border-gray-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header / Profile Card */}
        <div className="p-5 pt-[max(env(safe-area-inset-top,16px),16px)] border-b border-gray-800/80 bg-gradient-to-b from-gray-850 to-gray-900 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-yellow flex items-center justify-center text-gray-950 font-black text-sm">
                R
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                RIDER<span className="text-brand-yellow">XO</span>
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isCaptain && (driverProfile?.avatar || user?.avatar) ? (
              <img
                src={driverProfile?.avatar || user?.avatar}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-yellow/50"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow/15 border-2 border-brand-yellow/40 flex items-center justify-center text-brand-yellow shrink-0 shadow-md">
                <User className="w-6 h-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{user?.name || 'Bykneo User'}</h3>
              <p className="text-xs text-gray-400 truncate">{user?.phone || '+91 9876543210'}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                <span className="text-xs font-semibold text-gray-300">
                  {isCaptain ? (driverProfile?.rating || '4.9') : (user?.rating || '5.0')}
                </span>
                <span className="text-gray-600 text-xs">•</span>
                <span className="text-[10px] text-brand-yellow font-bold uppercase">
                  {isCaptain ? 'Captain' : 'Rider'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Mode Switcher Banner */}
          <div className="mt-4 p-2.5 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-between">
            <div className="text-xs text-gray-300">
              <span className="text-gray-400 block text-[10px]">CURRENT MODE</span>
              <span className="font-semibold text-white">
                {isCaptain ? '🏍️ Captain (Driver)' : '🛵 Rider (Customer)'}
              </span>
            </div>
            <button
              onClick={() => {
                switchRole(isCaptain ? 'passenger' : 'driver');
                onClose();
              }}
              className="px-3 py-1.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 text-xs font-bold rounded-lg transition active:scale-95 flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3 h-3" />
              Switch
            </button>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 px-3 space-y-1">
          <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {isCaptain ? 'Captain Menu' : 'Passenger Menu'}
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isAction) {
                    item.action();
                  } else {
                    onNavigate(item.id);
                    onClose();
                  }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-brand-yellow/15 border border-brand-yellow/40 text-brand-yellow'
                    : 'text-gray-300 hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-brand-yellow text-gray-950' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-gray-400">{item.desc}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-4 pb-[max(calc(env(safe-area-inset-bottom,20px)+36px),42px)] border-t border-gray-800 bg-gray-900/95 shrink-0">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
