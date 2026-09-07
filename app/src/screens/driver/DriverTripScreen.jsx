import React, { useState } from 'react';
import {
  Phone,
  Navigation,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  User,
  Clock,
  DollarSign
} from 'lucide-react';

export const DriverTripScreen = ({
  ride,
  onDriverArrived,
  onStartRide,
  onCompleteRide
}) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!ride) return null;

  const isArrived = ride.status === 'ARRIVED';
  const isInProgress = ride.status === 'IN_PROGRESS';

  const handleVerifyOtpAndStart = async (e) => {
    e.preventDefault();
    if (enteredOtp.length !== 4) {
      setOtpError('Please enter 4-digit OTP from passenger');
      return;
    }
    setOtpError('');
    setLoading(true);

    onStartRide(ride.id, enteredOtp, (res) => {
      setLoading(false);
      if (!res.success) {
        setOtpError(res.message || 'Invalid OTP! Check with passenger.');
      }
    });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4 pointer-events-none">
      <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 shadow-2xl pointer-events-auto space-y-3.5">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-brand-yellow flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow animate-pulse"></span>
            {isInProgress
              ? '🏁 In-Trip: Driving to Destination'
              : isArrived
              ? '🔑 Verify Passenger OTP'
              : '📍 Heading to Pickup Point'}
          </span>

          <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full">
            Earning: ₹{Math.round(ride.fare * 0.85)}
          </span>
        </div>

        {/* Passenger Contact Card */}
        <div className="bg-gray-850 p-3 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{ride.rider_name || 'Rahul Sharma'}</h4>
              <p className="text-xs text-gray-400">Payment: {ride.payment_mode || 'Cash'}</p>
            </div>
          </div>

          <a
            href={`tel:${ride.rider_phone || '+919876543210'}`}
            className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg active:scale-95 transition"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        {/* Route Address Snippet */}
        <div className="text-xs text-gray-300 bg-gray-850/60 p-2.5 rounded-xl space-y-1 truncate">
          <div className="truncate">
            <span className="text-emerald-400 font-bold">Pick:</span> {ride.pickup_name}
          </div>
          <div className="truncate">
            <span className="text-red-400 font-bold">Drop:</span> {ride.drop_name}
          </div>
        </div>

        {/* ACTION BUTTONS BASED ON RIDE STATE */}
        {ride.status === 'ACCEPTED' && (
          <button
            onClick={() => onDriverArrived(ride.id)}
            className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            I HAVE ARRIVED AT PICKUP
          </button>
        )}

        {isArrived && (
          <form onSubmit={handleVerifyOtpAndStart} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 mb-1">
                Ask passenger for 4-Digit Start OTP:
              </label>
              <input
                type="text"
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit PIN"
                className="w-full bg-gray-850 border border-brand-yellow/50 focus:border-brand-yellow rounded-2xl py-3 px-4 text-center text-xl font-black tracking-widest text-brand-yellow focus:outline-none"
              />
            </div>

            {otpError && (
              <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-xl text-center">
                {otpError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || enteredOtp.length !== 4}
              className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition disabled:opacity-50"
            >
              <KeyRound className="w-5 h-5" />
              {loading ? 'Verifying...' : 'VERIFY OTP & START TRIP'}
            </button>
          </form>
        )}

        {isInProgress && (
          <button
            onClick={() => onCompleteRide(ride.id)}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            COMPLETE RIDE & COLLECT ₹{ride.fare}
          </button>
        )}
      </div>
    </div>
  );
};
