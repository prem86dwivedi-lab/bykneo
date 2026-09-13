import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL, useSocket } from '../../context/SocketContext';
import {
  DollarSign,
  TrendingUp,
  History,
  Bike,
  ChevronLeft,
  ArrowDownToLine,
  Sparkles,
  QrCode,
  CheckCircle2,
  Clock,
  Gift,
  Award,
  Users,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DriverSubscriptionModal } from '../../components/DriverSubscriptionModal';

export const DriverEarningsScreen = ({ onBack }) => {
  const { user, driverProfile } = useAuth();
  const { socket } = useSocket();
  const [earningsData, setEarningsData] = useState(null);
  const [subData, setSubData] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRules, setShowRules] = useState(true);

  const fetchEarningsAndSubscription = () => {
    const dId = driverProfile?.id || user?.id;
    if (!dId) return;
    
    // 1. Fetch Earnings
    fetch(`${BACKEND_URL}/api/drivers/earnings/${dId}`)
      .then(res => res.json())
      .then(data => {
        setEarningsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // 2. Fetch Subscription
    fetch(`${BACKEND_URL}/api/drivers/subscription/${dId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setSubData(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchEarningsAndSubscription();
  }, [driverProfile, user]);

  // Live socket updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchEarningsAndSubscription();
    };
    socket.on('driver:subscription_activated', handleUpdate);
    socket.on('admin:settings_updated', handleUpdate);
    return () => {
      socket.off('driver:subscription_activated', handleUpdate);
      socket.off('admin:settings_updated', handleUpdate);
    };
  }, [socket, driverProfile, user]);

  const hasActivePass = Boolean(subData?.is_active);
  const isWelcomePass = Boolean(subData?.is_welcome_pass && hasActivePass);
  const daysLeft = subData?.welcome_days_remaining || (subData?.expires_at ? Math.max(1, Math.ceil((new Date(subData.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 0);
  const remainingHours = subData?.remaining_seconds ? Math.floor(subData.remaining_seconds / 3600) : 0;
  const promotionalRules = Array.isArray(subData?.promotional_rules) ? subData.promotional_rules : [];

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
          <h2 className="text-lg font-bold text-white">Captain Earnings and Recharge</h2>
          <p className="text-xs text-gray-400">Daily & total payout ledger</p>
        </div>
      </div>

      {/* Unified Single Master Earnings & Pass Card */}
      <div className="my-3 bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-900 border border-brand-yellow/30 p-4 sm:p-5 rounded-3xl space-y-3.5 shadow-xl relative overflow-hidden">
        {/* Top Header Row: Today's Earnings & Pass Quick Pill */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Today's Earnings
            </span>
            <div className="text-3xl sm:text-4xl font-black text-brand-yellow leading-tight mt-0.5">
              ₹{Math.round(Number(earningsData?.today_earnings || 0))}
            </div>
          </div>

          {/* Integrated Pass Quick Button */}
          <button
            onClick={() => setShowSubModal(true)}
            className={`px-3 py-1.5 rounded-xl font-black text-[10.5px] flex items-center gap-1.5 active:scale-95 transition shadow-md shrink-0 border ${
              hasActivePass
                ? isWelcomePass
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 border-brand-yellow shadow-brand-yellow/20'
            }`}
          >
            {hasActivePass ? (
              isWelcomePass ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>FREE Pass ({daysLeft}d Left)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current text-emerald-400" />
                  <span>0% Pass Active</span>
                </>
              )
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Buy Pass (₹{subData?.pass_price || 25}/d)</span>
              </>
            )}
          </button>
        </div>

        {/* Trips & Pass Validity Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-gray-800/80 text-xs">
          <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Today's Trips</span>
            <div className="text-sm font-black text-white mt-0.5">
              {earningsData?.today_trips || 0} rides
            </div>
          </div>

          <div className="bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Total Completed</span>
            <div className="text-sm font-black text-white mt-0.5">
              {earningsData?.total_completed_trips || 0} rides
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5 flex items-center justify-between sm:flex-col sm:items-start">
            <span className="text-[9px] text-gray-400 uppercase font-bold block">Pass Status</span>
            <div className="text-[11px] font-black text-emerald-400 mt-0.5 truncate flex items-center gap-1">
              {hasActivePass ? (
                isWelcomePass ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    <span>0% (Welcome Pass)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    <span>0% Commission</span>
                  </>
                )
              ) : (
                <span className="text-gray-400">15% Commission</span>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Pass Celebration / Info Box */}
        {isWelcomePass && (
          <div className="p-3 bg-gradient-to-r from-emerald-950/70 via-gray-950 to-gray-950 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-200">
            <Gift className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-[11px] text-white">
                🎉 {subData?.welcome_offer_title || 'Welcome Launch Pass Active!'}
              </div>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                You are enjoying <b className="text-emerald-300">0% platform commission</b> on all rides for <b className="text-brand-yellow font-mono">{daysLeft} more days</b>.
              </p>
            </div>
          </div>
        )}

        {/* Withdraw Action Button */}
        <button className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg">
          <ArrowDownToLine className="w-4 h-4" />
          <span>Withdraw to Bank Account / UPI</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 🎁 DYNAMIC PROMOTIONAL RULES & REFERRAL GOLDMINE ACCORDION */}
      {/* ========================================================================= */}
      {promotionalRules.length > 0 && (
        <div className="my-2 bg-gray-900 border border-amber-500/30 rounded-2xl p-3.5 space-y-2.5 shadow-lg">
          <div
            onClick={() => setShowRules(!showRules)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-brand-yellow flex items-center justify-center border border-amber-500/30 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Captain Perks & Referral Goldmine</span>
                  <span className="text-[8px] bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.2 rounded font-bold uppercase">
                    Live Offers
                  </span>
                </h3>
                <p className="text-[9.5px] text-gray-400">Exclusive bonus rewards & free pass rules</p>
              </div>
            </div>

            <button type="button" className="text-gray-400 hover:text-white p-1">
              {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showRules && (
            <div className="space-y-2 pt-1.5 border-t border-gray-800">
              {promotionalRules.map((rule) => (
                <div
                  key={rule.id}
                  className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 space-y-1.5 shadow-inner"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-white truncate">{rule.title}</h4>
                    {rule.badge && (
                      <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded border uppercase shrink-0 ${rule.badge_color || 'bg-amber-500/20 text-brand-yellow border-amber-500/40'}`}>
                        {rule.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 whitespace-pre-line leading-relaxed font-sans">
                    {rule.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Trips */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-1">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Recent Trip Earnings
        </h3>

        {earningsData?.recent_trips?.map((trip) => (
          <div
            key={trip.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 flex items-center justify-between shadow-md"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold text-white">
                Rider: {trip.rider_name || 'Passenger'}
              </div>
              <div className="text-[11px] text-gray-400">
                {trip.distance_km} km • {new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-black text-emerald-400">
                +₹{Math.round(hasActivePass ? trip.fare : trip.fare * 0.85)}
              </div>
              <div className="text-[10px] text-gray-500">
                Gross: ₹{trip.fare} {hasActivePass && '• 0% Fee'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 24-Hour Subscription Purchase Modal */}
      <DriverSubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        onSubscriptionActivated={() => fetchEarningsAndSubscription()}
      />
    </div>
  );
};

