import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../context/SocketContext';
import { History, Bike, Calendar, MapPin, CheckCircle2, ChevronLeft, ArrowRight } from 'lucide-react';

export const MyRidesScreen = ({ onBack }) => {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetch(`${BACKEND_URL}/api/rides/history?userId=${user.id}&role=passenger`)
      .then(res => res.json())
      .then(data => {
        setRides(data.rides || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

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
          <h2 className="text-lg font-bold text-white">My Rides</h2>
          <p className="text-xs text-gray-400">Past trip receipts & history</p>
        </div>
      </div>

      {/* Rides List */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500 text-xs">Loading rides...</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-600">
              <Bike className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-gray-400">No rides yet</p>
            <p className="text-xs text-gray-600">Book your first bike ride on Bykneo today!</p>
          </div>
        ) : (
          rides.map((ride) => (
            <div
              key={ride.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 hover:border-gray-700 transition shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-brand-yellow/15 text-brand-yellow flex items-center justify-center font-bold text-xs">
                    <Bike className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    {new Date(ride.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="text-sm font-black text-brand-yellow">₹{ride.fare}</div>
              </div>

              <div className="text-xs space-y-1 text-gray-300">
                <div className="flex items-start gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                  <span className="truncate">{ride.pickup_name}</span>
                </div>
                <div className="flex items-start gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                  <span className="truncate">{ride.drop_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400">
                <span>Captain: {ride.driver_name || 'Assigned Driver'}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase text-[10px]">
                  {ride.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
