import React from 'react';
import { Navigation, Bike, User, MapPin, KeyRound, Clock } from 'lucide-react';

export const ActiveRidesPage = ({ activeRides }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Active Ongoing Rides</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          Live monitoring of in-transit bike rides, pickup status, and passenger OTPs
        </p>
      </div>

      {activeRides.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-850 flex items-center justify-center mx-auto text-gray-600">
            <Bike className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <p className="text-sm sm:text-base font-bold text-gray-400">No active rides right now</p>
          <p className="text-[11px] sm:text-xs text-gray-600 max-w-sm mx-auto">
            When a passenger requests a ride in the app, it will appear here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {activeRides.map((ride) => (
            <div
              key={ride.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 shadow-xl hover:border-brand-yellow/40 transition"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 sm:pb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-brand-yellow animate-ping"></span>
                  <span className="text-[11px] sm:text-xs font-black text-brand-yellow uppercase">
                    {ride.status}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] sm:text-xs text-gray-400 mr-1.5 sm:mr-2">Fare:</span>
                  <span className="text-base sm:text-lg font-black text-white">₹{ride.fare}</span>
                </div>
              </div>

              {/* Rider & Driver Info */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-gray-850 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                <div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase block font-bold">Rider</span>
                  <div className="text-xs font-bold text-white truncate">{ride.rider_name}</div>
                  <div className="text-[10px] sm:text-[11px] text-gray-400 truncate">{ride.rider_phone}</div>
                </div>

                <div>
                  <span className="text-[9px] sm:text-[10px] text-gray-400 uppercase block font-bold">Captain</span>
                  <div className="text-xs font-bold text-brand-yellow truncate">
                    {ride.driver_name || 'Matching...'}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-gray-400 font-mono truncate">{ride.vehicle_number || '--'}</div>
                </div>
              </div>

              {/* Security OTP & Distance */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs bg-gray-850/60 p-2 sm:p-2.5 rounded-xl">
                <div className="flex items-center gap-1 sm:gap-1.5 text-brand-yellow font-bold">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Start OTP: {ride.otp}</span>
                </div>
                <div className="text-gray-400 text-[10px] sm:text-xs">
                  {ride.distance_km} km • ~{ride.duration_mins} mins
                </div>
              </div>

              {/* Route */}
              <div className="text-xs space-y-1 text-gray-300">
                <div className="flex items-start gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span className="truncate text-[11px] sm:text-xs"><b>Pickup:</b> {ride.pickup_name}</span>
                </div>
                <div className="flex items-start gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-400 mt-1 shrink-0"></span>
                  <span className="truncate text-[11px] sm:text-xs"><b>Drop:</b> {ride.drop_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
