import React, { useEffect, useState } from 'react';
import { Bike, Car, X, Radio, ShieldCheck } from 'lucide-react';

export const FindingDriverScreen = ({ onCancel, ride }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const vehicleId = ride?.vehicle_id || 'bike';
  const vehicleName = ride?.vehicle_name || 'Bykneo Captain';

  const vehicleImageMap = {
    bike_lite: '/vehicles/bike_lite.png',
    bike: '/vehicles/bike.png',
    auto_lite: '/vehicles/auto_lite.png',
    auto: '/vehicles/auto.png',
    cab_economy: '/vehicles/cab_economy.png',
    cab_premium: '/vehicles/cab_premium.png'
  };

  const vehicleImg = vehicleImageMap[vehicleId] || (
    vehicleId.includes('auto') ? '/vehicles/auto.png' :
    vehicleId.includes('cab') ? '/vehicles/cab_premium.png' :
    '/vehicles/bike.png'
  );

  return (
    <div className="absolute inset-0 z-30 bg-gray-950/90 backdrop-blur-md flex flex-col items-center justify-between p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,12px))]">
      {/* Top Tag */}
      <div className="pt-8 text-center">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-brand-yellow/30 px-4 py-1.5 rounded-full text-brand-yellow text-xs font-bold shadow-lg mb-2">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          BROADCASTING TO CAPTAINS
        </div>
        <h2 className="text-2xl font-black text-white">Connecting with nearest Captain</h2>
        <p className="text-xs text-gray-400 mt-1">
          Searching nearby online {vehicleName} drivers in 3.0 km radius... ({seconds}s)
        </p>
      </div>

      {/* Central Radar Pulse Animation with Selected Vehicle Icon */}
      <div className="relative flex items-center justify-center my-auto">
        <div className="absolute w-64 h-64 rounded-full border border-brand-yellow/20 animate-radar" />
        <div className="absolute w-48 h-48 rounded-full border border-brand-yellow/30 animate-radar [animation-delay:0.5s]" />
        <div className="absolute w-32 h-32 rounded-full border border-brand-yellow/40 animate-radar [animation-delay:1s]" />

        <div className="relative z-10 w-24 h-24 rounded-full bg-brand-yellow flex items-center justify-center p-3 shadow-2xl shadow-brand-yellow/40">
          <img
            src={vehicleImg}
            alt={vehicleName}
            className="max-h-14 max-w-full object-contain filter drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)] animate-bounce"
          />
        </div>
      </div>

      {/* Trip Details Card */}
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-3xl p-4 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div>
            <div className="text-[11px] text-gray-400">Total Fare</div>
            <div className="text-lg font-black text-brand-yellow">₹{ride?.fare}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-400">Distance</div>
            <div className="text-sm font-bold text-white">{ride?.distance_km} km</div>
          </div>
        </div>

        <div className="text-xs text-gray-300 space-y-1 truncate">
          <div className="truncate"><span className="text-emerald-400 font-bold">From:</span> {ride?.pickup_name}</div>
          <div className="truncate"><span className="text-red-400 font-bold">To:</span> {ride?.drop_name}</div>
        </div>

        <button
          onClick={onCancel}
          className="w-full py-3 rounded-2xl bg-gray-850 hover:bg-gray-800 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold transition flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel Request
        </button>
      </div>
    </div>
  );
};
