import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../context/SocketContext';
import { DollarSign, TrendingUp, History, Bike, ChevronLeft, ArrowDownToLine } from 'lucide-react';

export const DriverEarningsScreen = ({ onBack }) => {
  const { user, driverProfile } = useAuth();
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverProfile) return;
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
  }, [driverProfile]);

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
          <h2 className="text-lg font-bold text-white">Captain Earnings</h2>
          <p className="text-xs text-gray-400">Daily & total payout ledger</p>
        </div>
      </div>

      {/* Main Earnings Card */}
      <div className="my-4 bg-gradient-to-br from-amber-500/20 via-gray-900 to-gray-900 border border-brand-yellow/40 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Today's Earnings
          </span>
          <div className="w-8 h-8 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="text-4xl font-black text-brand-yellow">
          ₹{Math.round(Number(earningsData?.today_earnings || 0))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
          <div>
            <span className="text-[10px] text-gray-400 uppercase">Today's Trips</span>
            <div className="text-base font-bold text-white">
              {earningsData?.today_trips || 0} rides
            </div>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase">Total Completed</span>
            <div className="text-base font-bold text-white">
              {earningsData?.total_completed_trips || 0} rides
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg">
          <ArrowDownToLine className="w-4 h-4" />
          Withdraw to Bank Account / UPI
        </button>
      </div>

      {/* Recent Trips */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-2">
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
                +₹{Math.round(trip.fare * 0.85)}
              </div>
              <div className="text-[10px] text-gray-500">Gross: ₹{trip.fare}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
