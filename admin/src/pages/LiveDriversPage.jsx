import React from 'react';
import { FleetMap } from '../components/FleetMap';
import { Radio, Bike, Navigation, MapPin } from 'lucide-react';

export const LiveDriversPage = ({ onlineDrivers, activeRides }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow animate-pulse shrink-0" />
            <span>Live Fleet Tracking & Heatmap</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-gray-400">
            Real-time geospatial positions of online captains and ongoing trips
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none bg-gray-900 border border-gray-800 p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold">
            <span className="text-gray-400 block text-[9px] sm:text-[10px]">TOTAL ONLINE</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">{onlineDrivers.length} Captains</span>
          </div>

          <div className="flex-1 sm:flex-none bg-gray-900 border border-gray-800 p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold">
            <span className="text-gray-400 block text-[9px] sm:text-[10px]">ACTIVE TRIPS</span>
            <span className="text-base sm:text-lg font-black text-brand-yellow">{activeRides.length} Trips</span>
          </div>
        </div>
      </div>

      {/* Main Map View */}
      <div className="h-[350px] sm:h-[480px] lg:h-[580px] w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
        <FleetMap drivers={onlineDrivers} activeRides={activeRides} />
      </div>

      {/* Online Drivers Card Grid */}
      <div className="space-y-2.5 sm:space-y-3">
        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-gray-400">
          Online Captains Radar List ({onlineDrivers.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {onlineDrivers.map(d => {
            const isBusy = activeRides.some(r => r.driver_id === d.id);
            return (
              <div
                key={d.id}
                className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between hover:border-gray-700 transition"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-yellow/15 text-brand-yellow flex items-center justify-center font-bold shrink-0">
                    <Bike className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-white truncate">{d.name}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-400 truncate">
                      {d.vehicle_model} • <span className="text-brand-yellow font-mono">{d.vehicle_number}</span>
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ml-2 ${
                    isBusy
                      ? 'bg-amber-500/20 text-brand-yellow border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isBusy ? 'On Trip' : 'Available'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
