import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../context/SocketContext';
import { DollarSign, TrendingUp, History, Bike, ChevronLeft, ArrowDownToLine, Sparkles, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { DriverSubscriptionModal } from '../../components/DriverSubscriptionModal';

export const DriverEarningsScreen = ({ onBack }) => {
  const { user, driverProfile } = useAuth();
  const [earningsData, setEarningsData] = useState(null);
  const [subData, setSubData] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEarningsAndSubscription = () => {
    if (!driverProfile?.id) return;
    
    // 1. Fetch Earnings
    fetch(`${BACKEND_URL}/api/drivers/earnings/${driverProfile.id}`)
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
    fetch(`${BACKEND_URL}/api/drivers/subscription/${driverProfile.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setSubData(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchEarningsAndSubscription();
  }, [driverProfile]);

  const hasActivePass = subData?.is_active;
  const remainingHours = subData?.remaining_seconds ? Math.floor(subData.remaining_seconds / 3600) : 0;
  const remainingMins = subData?.remaining_seconds ? Math.floor((subData.remaining_seconds % 3600) / 60) : 0;

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
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 border-brand-yellow shadow-brand-yellow/20'
            }`}
          >
            {hasActivePass ? (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>0% Pass Active History</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-current" />
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
            <div className="text-[11px] font-bold text-emerald-400 mt-0.5 truncate">
              {hasActivePass ? 'Keep 100% Fares' : '15% Commission'}
            </div>
          </div>
        </div>

        {/* Withdraw Action Button */}
        <button className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg">
          <ArrowDownToLine className="w-4 h-4" />
          <span>Withdraw to Bank Account / UPI</span>
        </button>
      </div>

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

