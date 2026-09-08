import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, ArrowRightLeft, ShieldCheck, MapPin } from 'lucide-react';

export const Navbar = ({ onOpenMenu, zoneStatus }) => {
  const { user, activeRole, switchRole } = useAuth();

  const isCaptain = activeRole === 'driver';
  const isServiceable = zoneStatus?.isServiceable !== false && !!zoneStatus?.matchedCity;
  const matchedCity = zoneStatus?.matchedCity;
  const activeCities = zoneStatus?.activeCities || [];

  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-3 py-2.5 pointer-events-none">
      <div className="flex flex-col items-center max-w-lg mx-auto space-y-1.5">
        {/* Main Navbar Row */}
        <div className="w-full flex items-center justify-between">
          {/* Left: Menu Trigger */}
          <button
            onClick={onOpenMenu}
            className="pointer-events-auto w-9 h-9 bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700/60 flex items-center justify-center text-white shadow-xl hover:bg-gray-800 transition active:scale-95 shrink-0"
          >
            <Menu className="w-4 h-4 text-gray-200" />
          </button>

          {/* Center: Brand Logo & Role Pill */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-gray-700/60 shadow-xl">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-md bg-brand-yellow flex items-center justify-center text-gray-950 font-black text-[10px]">
                B
              </div>
              <span className="font-extrabold text-xs tracking-tight text-white">
                BYK<span className="text-brand-yellow">NEO</span>
              </span>
            </div>

            <div className="h-3.5 w-[1px] bg-gray-700 mx-0.5"></div>

            {/* Active Mode Badge */}
            <span
              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                isCaptain
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isCaptain ? '🏍️ Captain' : '🛵 Rider'}
            </span>
          </div>

          {/* Right: Quick Role Switcher */}
          <button
            onClick={() => switchRole(isCaptain ? 'passenger' : 'driver')}
            className="pointer-events-auto group bg-gray-900/90 backdrop-blur-md border border-gray-700/60 px-2.5 py-1.5 rounded-xl flex items-center gap-1 text-[11px] font-semibold text-gray-300 hover:text-white shadow-xl hover:border-brand-yellow/50 transition active:scale-95 shrink-0"
            title="Switch between Rider and Captain mode"
          >
            <ArrowRightLeft className="w-3 h-3 text-brand-yellow group-hover:rotate-180 transition-transform duration-300" />
            <span className="text-[10px] font-bold">
              {isCaptain ? 'Rider' : 'Captain'}
            </span>
          </button>
        </div>

        {/* Live Serviceable Zone Indicator Pill (Shown in Rider mode only, aligned to the left side) */}
        {zoneStatus && !isCaptain && (
          <div className="w-full flex items-center justify-start pointer-events-auto">
            <div
              className={`h-9 px-3 rounded-xl text-[10px] font-bold shadow-xl backdrop-blur-xl border transition flex items-center gap-1.5 ${
                isServiceable
                  ? 'bg-emerald-950/85 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50'
                  : 'bg-red-950/85 border-red-500/50 text-red-300 shadow-red-950/50'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isServiceable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                }`}
              />
              <span>
                {isServiceable
                  ? `Service Active • ${matchedCity.name}`
                  : `Outside Service Zone • Launching Soon`}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
