import React, { useState, useEffect } from 'react';
import { BACKEND_URL, useSocket } from '../context/SocketContext';
import {
  Sparkles,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
  Award,
  DollarSign,
  X
} from 'lucide-react';

export const WelcomeCelebrationModal = ({
  isOpen,
  onClose,
  isDemo = false,
  driverName = 'Captain',
  driverId = null
}) => {
  const { socket } = useSocket();
  const [settings, setSettings] = useState({
    welcome_offer_enabled: true,
    welcome_offer_days: 60,
    welcome_offer_title: '60-Day 100% Free Launch Pass',
    welcome_offer_subtitle: 'Keep 100% of your ride fares with 0% platform commission.'
  });

  const fetchLatestSettings = () => {
    fetch(`${BACKEND_URL}/api/admin/overview`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.settings) {
          setSettings((prev) => ({
            ...prev,
            ...data.settings
          }));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchLatestSettings();
  }, [isOpen]);

  // Real-time socket sync: update celebration text instantly if admin modifies settings live!
  useEffect(() => {
    if (!socket) return;
    const handleSettingsUpdated = (data) => {
      if (data && data.settings) {
        setSettings((prev) => ({
          ...prev,
          ...data.settings
        }));
      }
    };
    socket.on('admin:settings_updated', handleSettingsUpdated);
    return () => {
      socket.off('admin:settings_updated', handleSettingsUpdated);
    };
  }, [socket]);

  if (!isOpen) return null;

  const days = settings.welcome_offer_days || 60;
  const title = settings.welcome_offer_title || `${days}-Day 100% Free Launch Pass`;
  const subtitle = settings.welcome_offer_subtitle || 'Keep 100% of your ride fares with 0% platform commission.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-gray-950 border border-brand-yellow/50 rounded-3xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Top Glow & Decorative Banner */}
        <div className="relative p-5 sm:p-6 text-center overflow-hidden border-b border-gray-800 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-brand-yellow/20 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Celebration Emojis & Icon */}
          <div className="relative inline-block mb-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-brand-yellow to-amber-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center mx-auto">
              <div className="w-full h-full bg-gray-950 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl">
                🎉
              </div>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-gray-900"></span>
            </span>
          </div>

          {/* Demo Mode Badge if Vikram (Demo Captain) */}
          {isDemo && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>DEMO CAPTAIN MODE</span>
              </span>
            </div>
          )}

          {/* Headline */}
          <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
            🎉 Welcome to RiderXO, {driverName}!
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isDemo
              ? 'This is a demo driver screen. Real registered drivers receive this exact same welcome offer!'
              : 'Your Captain profile is verified and ready for ride requests!'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {/* Main Golden Offer Card */}
          <div className="bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-gray-900 border-2 border-brand-yellow/60 rounded-2xl p-3.5 sm:p-4 text-center space-y-2 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 text-brand-yellow font-black text-[10px] uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>SPECIAL LAUNCH REWARD</span>
            </div>

            <div className="text-base sm:text-lg font-black text-white leading-snug">
              You have received a <span className="text-brand-yellow underline decoration-brand-yellow/60">{days}-Day 100% Free Unlimited Pass</span> (0% Platform Commission).
            </div>

            <p className="text-[11px] font-bold text-emerald-300 leading-relaxed bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2">
              ✨ Keep 100% of all passenger fares directly into your pocket or UPI account!
            </p>
          </div>

          {/* Key Launch Benefits List */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-3 space-y-2 text-xs">
            <div className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">
              Captain Privileges Included:
            </div>
            <div className="flex items-start gap-2 text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>0% Platform Commission:</b> No cuts from your hard-earned ride fares.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Direct UPI & Cash Payouts:</b> Riders pay directly to your personal UPI ID or cash.</span>
            </div>
            <div className="flex items-start gap-2 text-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Unlimited Ride Bookings:</b> Accept as many trips as you want daily.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-brand-yellow hover:from-amber-600 hover:to-brand-yellowHover text-gray-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-amber-500/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <span>Start Driving & Earning</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
