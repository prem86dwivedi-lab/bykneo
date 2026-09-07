import React, { useEffect, useState } from 'react';
import { Bike, Check, X, MapPin, Clock, DollarSign, User, ShieldCheck } from 'lucide-react';

export const IncomingRequestModal = ({ request, onAccept, onReject }) => {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    // Play alert sound using Web Audio API beep
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio autoplay prevented:', e);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(request.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!request) return null;

  const progressPct = (timeLeft / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3">
      <div className="bg-gray-900 border-2 border-brand-yellow rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-brand-yellow animate-ping"></span>
            <span className="text-xs font-black uppercase text-brand-yellow tracking-wider">
              NEW RIDE REQUEST!
            </span>
          </div>
          <span className="text-xs font-bold text-white bg-gray-800 px-2.5 py-1 rounded-full">
            ⏳ {timeLeft}s
          </span>
        </div>

        {/* Progress Countdown Bar */}
        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-yellow h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Fare & Distance Big Card */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-brand-yellow/40 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 block uppercase">
              Captain Earning
            </span>
            <div className="text-3xl font-black text-brand-yellow">
              ₹{Math.round(request.fare * 0.85)}
            </div>
            <span className="text-[10px] text-gray-500">Gross Fare: ₹{request.fare}</span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-gray-400 block uppercase">
              Trip Distance
            </span>
            <div className="text-xl font-black text-white">{request.distance_km} km</div>
            <span className="text-[10px] text-gray-400">~{request.duration_mins} mins</span>
          </div>
        </div>

        {/* Rider & Route Info */}
        <div className="bg-gray-850 p-3.5 rounded-2xl border border-gray-800 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 border-b border-gray-800 pb-2">
            <div className="w-7 h-7 rounded-full bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 truncate">
              <div className="font-bold text-white truncate">{request.rider_name || 'Passenger'}</div>
              <div className="text-[10px] text-gray-400">Payment: {request.payment_mode || 'Cash'}</div>
            </div>
          </div>

          <div className="space-y-1.5 text-gray-300">
            <div className="flex items-start gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
              <span className="truncate"><b className="text-emerald-400">Pickup:</b> {request.pickup_name}</span>
            </div>
            <div className="flex items-start gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0"></span>
              <span className="truncate"><b className="text-red-400">Drop:</b> {request.drop_name}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Accept / Reject */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onReject(request.id)}
            className="py-3.5 bg-gray-800 hover:bg-gray-750 text-red-400 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <X className="w-4 h-4" />
            Decline
          </button>

          <button
            onClick={() => onAccept(request.id)}
            className="py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 shadow-xl shadow-brand-yellow/20 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            ACCEPT RIDE
          </button>
        </div>
      </div>
    </div>
  );
};
