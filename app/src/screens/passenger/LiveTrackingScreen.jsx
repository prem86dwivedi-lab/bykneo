import React, { useState } from 'react';
import {
  Phone,
  Shield,
  Star,
  MapPin,
  Bike,
  KeyRound,
  AlertTriangle,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const LiveTrackingScreen = ({ ride, onCancelRide }) => {
  const [showSosModal, setShowSosModal] = useState(false);

  if (!ride) return null;

  const isArrived = ride.status === 'ARRIVED';
  const isInProgress = ride.status === 'IN_PROGRESS';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4 pb-[env(safe-area-inset-bottom,16px)] pointer-events-none">
      <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 shadow-2xl pointer-events-auto space-y-3.5">
        {/* Status Header Pill */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-brand-yellow">
              {isInProgress
                ? '🚀 Trip in Progress to Destination'
                : isArrived
                ? '📍 Captain Arrived at Pickup!'
                : '🏍️ Captain Approaching Pickup'}
            </span>
          </div>

          <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand-yellow" />
            {isInProgress ? `${ride.duration_mins}m left` : 'ETA ~3 mins'}
          </span>
        </div>

        {/* Start Ride OTP Card (Crucial Security Step) */}
        {!isInProgress && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-brand-yellow/40 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400">
                  Start Ride PIN (Share with Captain)
                </div>
                <div className="text-xl font-black text-brand-yellow tracking-widest">
                  {ride.otp || '4829'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block">Fare</span>
              <span className="text-sm font-black text-white">₹{ride.fare}</span>
            </div>
          </div>
        )}

        {/* Captain Details Card */}
        <div className="bg-gray-850 p-3.5 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={ride.driver_avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150"}
                alt="Captain"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-yellow/60"
              />
              <div className="absolute -bottom-1 -right-1 bg-gray-950 rounded-full p-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-gray-950" />
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-white">{ride.driver_name || 'Vikram Singh'}</h4>
              <p className="text-xs font-semibold text-brand-yellow">
                {ride.vehicle_model || 'Honda Shine'} • <span className="text-white">{ride.vehicle_number || 'DL 03 AB 4589'}</span>
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                <span className="text-xs font-bold text-gray-300">
                  {ride.driver_rating || '4.85'}
                </span>
                <span className="text-gray-500 text-xs">•</span>
                <span className="text-[11px] text-gray-400">300+ rides</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Call & SOS */}
          <div className="flex items-center gap-2">
            <a
              href={`tel:${ride.driver_phone || '+919123456780'}`}
              className="w-10 h-10 rounded-2xl bg-gray-800 hover:bg-gray-750 border border-gray-700 flex items-center justify-center text-emerald-400 shadow-lg active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
            </a>

            <button
              onClick={() => setShowSosModal(true)}
              className="w-10 h-10 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg active:scale-95 transition"
              title="Emergency SOS"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Route Details */}
        <div className="px-1 text-xs text-gray-400 truncate space-y-1">
          <div className="truncate"><span className="text-emerald-400 font-bold">Pick:</span> {ride.pickup_name}</div>
          <div className="truncate"><span className="text-red-400 font-bold">Drop:</span> {ride.drop_name}</div>
        </div>

        {/* Cancel button if not started */}
        {!isInProgress && (
          <button
            onClick={() => onCancelRide(ride.id)}
            className="w-full py-2.5 rounded-xl bg-gray-850 hover:bg-gray-800 text-red-400 text-xs font-semibold transition"
          >
            Cancel Ride
          </button>
        )}
      </div>

      {/* SOS Emergency Modal */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/50 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Emergency Safety & SOS</h3>
                <p className="text-xs text-gray-400">Instant Police & Emergency Alert</p>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Your live GPS location and ride details will be shared immediately with Bykneo 24/7 Safety Team and local authorities (112).
            </p>

            <div className="space-y-2">
              <a
                href="tel:112"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Police (112)
              </a>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-2xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
