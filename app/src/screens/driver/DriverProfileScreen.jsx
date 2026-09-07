import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Bike, Star, ArrowRightLeft, LogOut, ChevronLeft, Award } from 'lucide-react';

export const DriverProfileScreen = ({ onBack, onOpenKyc }) => {
  const { user, driverProfile, switchRole, logout } = useAuth();

  const isApproved = driverProfile?.kyc_status === 'approved';

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 border-b border-gray-800">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white">Captain Profile & KYC</h2>
          <p className="text-xs text-gray-400">Vehicle details & ratings</p>
        </div>
      </div>

      {/* Driver Card */}
      <div className="my-4 bg-gray-900 border border-gray-800 rounded-3xl p-5 text-center space-y-3">
        <img
          src={user?.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"}
          alt="Avatar"
          className="w-20 h-20 rounded-3xl object-cover border-4 border-brand-yellow/60 mx-auto shadow-xl"
        />

        <div>
          <h3 className="text-base font-bold text-white">{driverProfile?.name || user?.name}</h3>
          <p className="text-xs text-gray-400">{driverProfile?.phone || user?.phone}</p>
        </div>

        {/* KYC Status Badge & Action */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isApproved
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-brand-yellow/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isApproved ? 'KYC VERIFIED CAPTAIN' : 'KYC PENDING APPROVAL'}
          </div>

          <button
            onClick={onOpenKyc}
            className="text-xs text-brand-yellow hover:underline font-bold"
          >
            {isApproved ? 'View Verified Documents →' : 'Upload / Complete KYC Documents →'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800 text-left">
          <div className="bg-gray-850 p-3 rounded-xl">
            <span className="text-[10px] text-gray-400 uppercase block">Vehicle & Category</span>
            <span className="text-xs font-bold text-white block truncate">
              {driverProfile?.vehicle_type_name || driverProfile?.vehicle_category || 'Bykneo Bike'}
            </span>
            <span className="text-[10.5px] text-gray-400 block truncate">
              {driverProfile?.vehicle_model || 'Honda Shine 125'}
            </span>
          </div>

          <div className="bg-gray-850 p-3 rounded-xl">
            <span className="text-[10px] text-gray-400 uppercase block">Vehicle Plate Number</span>
            <span className="text-xs font-mono font-bold text-brand-yellow block mt-0.5">
              {driverProfile?.vehicle_number || 'MP 04 AB 4589'}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              {driverProfile?.kyc_status === 'approved' ? 'Verified Plate' : 'Under Review'}
            </span>
          </div>
        </div>
      </div>

      {/* Switch to Rider Action Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between my-2">
        <div>
          <h4 className="text-xs font-bold text-white">Need a ride as Passenger?</h4>
          <p className="text-[11px] text-gray-400">Switch back to Rider mode instantly.</p>
        </div>
        <button
          onClick={() => switchRole('passenger')}
          className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-brand-yellow text-xs font-bold rounded-xl active:scale-95 transition flex items-center gap-1 shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Switch
        </button>
      </div>

      {/* Logout */}
      <div className="mt-auto pt-6">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};
