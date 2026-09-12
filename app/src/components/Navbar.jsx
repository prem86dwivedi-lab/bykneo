import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket, BACKEND_URL } from '../context/SocketContext';
import {
  Menu,
  ArrowRightLeft,
  ShieldCheck,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';
import { DriverSubscriptionModal } from './DriverSubscriptionModal';

export const Navbar = ({
  onOpenMenu,
  zoneStatus,
  isDriverOnline = false,
  onOpenKyc,
  onNavigate
}) => {
  const { user, driverProfile, activeRole, switchRole } = useAuth();
  const { socket } = useSocket();

  const isCaptain = activeRole === 'driver';
  const isServiceable = zoneStatus?.isServiceable !== false && !!zoneStatus?.matchedCity;
  const matchedCity = zoneStatus?.matchedCity;

  const [todayEarnings, setTodayEarnings] = useState(
    Math.round(Number(driverProfile?.today_earnings || 0))
  );
  const [subData, setSubData] = useState(null);
  const [remainingPassTime, setRemainingPassTime] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);

  const kycStatus = driverProfile?.kyc_status || 'approved';
  const driverId = driverProfile?.id || user?.id;

  const fetchSubscription = () => {
    if (!driverId) return;
    fetch(`${BACKEND_URL}/api/drivers/subscription/${driverId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) setSubData(data);
      })
      .catch(() => {});
  };

  const fetchEarnings = () => {
    if (!driverId) return;
    fetch(`${BACKEND_URL}/api/drivers/earnings/${driverId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.today_earnings !== undefined) {
          setTodayEarnings(Math.round(Number(data.today_earnings)));
        }
      })
      .catch(() => {});
  };

  // Sync earnings and subscription for captain
  useEffect(() => {
    if (isCaptain && driverId) {
      fetchEarnings();
      fetchSubscription();
    }
  }, [isCaptain, driverId]);

  // Live countdown timer calculation for 0% Pass chip
  useEffect(() => {
    if (!subData?.is_active || !subData?.expires_at) {
      setRemainingPassTime('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(subData.expires_at).getTime();
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setRemainingPassTime('Expired');
        fetchSubscription();
        return;
      }

      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        setRemainingPassTime(`${days}d ${remHours}h left`);
      } else if (totalHours > 0) {
        setRemainingPassTime(`${totalHours}h ${mins}m left`);
      } else {
        setRemainingPassTime(`${mins}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [subData]);

  // Socket listener for real-time subscription update
  useEffect(() => {
    if (!socket) return;
    const handleSubUpdate = () => {
      fetchSubscription();
    };
    socket.on('driver:subscription_activated', handleSubUpdate);
    return () => {
      socket.off('driver:subscription_activated', handleSubUpdate);
    };
  }, [socket, driverId]);

  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-30 px-1 pt-[max(env(safe-area-inset-top,10px),10px)] pointer-events-none">
        {/* Single Unified Header Card - Frosted Titanium Slate (Metallic Steel-Grey) */}
        <div className="w-full max-w-full sm:max-w-2xl mx-auto bg-slate-800/95 backdrop-blur-2xl border border-slate-600/60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl p-2 sm:p-2.5 space-y-1.5 pointer-events-auto">
          
          {/* Row 1: Brand Navigation, Captain Mode, KYC Badge, & Role Switcher */}
          <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Left: Menu Trigger, Brand Logo & Role Pill */}
            <div className="flex items-center gap-1.5 min-w-0 shrink-0">
              <button
                onClick={onOpenMenu}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-700/90 hover:bg-slate-650 border border-slate-500/70 flex items-center justify-center text-white shadow-sm hover:text-white transition active:scale-95 shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="w-4 h-4 text-slate-100" />
              </button>

              {/* RiderXO Brand Logo */}
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-5 h-5 rounded-md bg-brand-yellow flex items-center justify-center text-gray-950 font-black text-[10px] shadow-sm">
                  R
                </div>
                <span className="font-extrabold text-xs tracking-tight text-white">
                  RIDER<span className="text-brand-yellow">XO</span>
                </span>
              </div>

              {/* Active Role Mode Badge */}
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg shrink-0 ${
                  isCaptain
                    ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40'
                    : 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                }`}
              >
                {isCaptain ? '🏍️ Captain' : '🛵 Rider'}
              </span>
            </div>

            {/* Center: KYC Verification Badge (Placed between Captain and Rider Switcher) */}
            {isCaptain && (
              <button
                onClick={onOpenKyc}
                className={`border font-bold px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0 transition active:scale-95 shadow-sm ${
                  kycStatus === 'approved'
                    ? 'bg-teal-950/70 hover:bg-teal-900/80 border-teal-400/50 text-teal-200'
                    : kycStatus === 'pending'
                    ? 'bg-amber-950/70 hover:bg-amber-900/80 border-amber-400/50 text-amber-200'
                    : 'bg-red-950/70 hover:bg-red-900/80 border-red-400/50 text-red-200'
                }`}
                title="Click to view/update KYC documents"
              >
                <ShieldCheck className="w-3 h-3 text-teal-300 shrink-0" />
                <span className="whitespace-nowrap">
                  {kycStatus === 'approved'
                    ? 'KYC Verified'
                    : kycStatus === 'pending'
                    ? 'KYC Review'
                    : 'Submit KYC'}
                </span>
              </button>
            )}

            {/* Right: Quick Role Switcher */}
            <button
              onClick={() => switchRole(isCaptain ? 'passenger' : 'driver')}
              className="group bg-slate-700/90 hover:bg-slate-650 border border-slate-500/70 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-100 hover:text-white shadow-sm hover:border-brand-yellow/70 transition active:scale-95 shrink-0"
              title="Switch between Rider and Captain mode"
            >
              <ArrowRightLeft className="w-3 h-3 text-brand-yellow group-hover:rotate-180 transition-transform duration-300" />
              <span className="text-[10px] font-bold">
                {isCaptain ? 'Rider' : 'Captain'}
              </span>
            </button>
          </div>

          {/* Row 2: Status Pill Badges Ribbon */}
          <div className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth">
            
            {/* 1. Location Pill Badge (Mint Green) */}
            <div className="bg-emerald-950/70 border border-emerald-400/40 text-emerald-300 font-bold px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[120px]">
                {matchedCity?.name || 'Bhopal, MP'}
              </span>
            </div>

            {/* Captain-specific Status Badges */}
            {isCaptain && (
              <>
                {/* 2. Online/Offline Status Pill (Pastel Green) */}
                <div
                  className={`border font-black px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1.5 shrink-0 ${
                    isDriverOnline && isServiceable
                      ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                      : !isServiceable
                      ? 'bg-red-950/80 border-red-400/60 text-red-200'
                      : 'bg-slate-700 border-slate-500 text-slate-200'
                  }`}
                >
                  {isDriverOnline && isServiceable ? (
                    <div className="relative flex items-center justify-center shrink-0 w-2.5 h-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-sm" />
                    </div>
                  ) : (
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        !isServiceable ? 'bg-red-400' : 'bg-slate-400'
                      }`}
                    />
                  )}
                  <span>
                    {isDriverOnline && isServiceable
                      ? 'ONLINE'
                      : !isServiceable
                      ? 'ZONE INACTIVE'
                      : 'OFFLINE'}
                  </span>
                </div>

                {/* 3. Pass Validity Pill (Lavender / Purple) */}
                <button
                  onClick={() => setShowSubModal(true)}
                  className={`border font-bold px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0 transition active:scale-95 ${
                    subData?.is_active
                      ? 'bg-purple-950/70 hover:bg-purple-900/80 border-purple-400/50 text-purple-200'
                      : 'bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 border-brand-yellow shadow-sm'
                  }`}
                  title="Click to view Pass details & validity countdown"
                >
                  <Sparkles className="w-3 h-3 text-purple-300 fill-current shrink-0" />
                  <span>
                    {subData?.is_active
                      ? `Pass (${remainingPassTime || 'Active'})`
                      : `Buy Pass (₹${subData?.pass_price || 25})`}
                  </span>
                </button>

                {/* 4. Today's Earnings Pill (Amber / Orange) */}
                <div className="bg-amber-950/70 border border-amber-400/50 text-amber-200 font-bold px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1 shrink-0">
                  <span className="text-[10px]">💰</span>
                  <span>Today ₹{Math.round(Number(todayEarnings || 0))}</span>
                </div>
              </>
            )}

            {/* Rider-specific Live Status Badge */}
            {!isCaptain && (
              <div
                className={`border font-black px-2 py-1 rounded-lg text-[9px] sm:text-[10px] flex items-center gap-1.5 shrink-0 ${
                  isServiceable
                    ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                    : 'bg-red-950/80 border-red-400/60 text-red-200'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isServiceable ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span>
                  {isServiceable
                    ? 'Service Active'
                    : 'Outside Service Zone'}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 24-Hour / Multi-day Subscription Purchase Modal */}
      {showSubModal && (
        <DriverSubscriptionModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          onSubscriptionActivated={() => {
            fetchSubscription();
            fetchEarnings();
          }}
        />
      )}
    </>
  );
};
