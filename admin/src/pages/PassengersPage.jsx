import React, { useState, useEffect } from 'react';
import { Users, User, Phone, Wallet, Star, ShieldCheck } from 'lucide-react';

export const PassengersPage = ({ BACKEND_URL }) => {
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/passengers`)
      .then(res => res.json())
      .then(data => setPassengers(data.passengers || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Registered Passengers</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          User accounts, wallet balances, safety scores, and registration records
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {passengers.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-xl hover:border-gray-700 transition"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <img
                src={p.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt="Avatar"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-cover border-2 border-brand-yellow/40 shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-white truncate">{p.name}</h4>
                <p className="text-[11px] sm:text-xs text-gray-400 truncate">{p.phone}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                  <span className="text-[11px] sm:text-xs font-bold text-gray-300">{p.rating || '5.0'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-850 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between">
              <div className="text-[11px] sm:text-xs text-gray-400">Wallet Balance</div>
              <div className="text-sm sm:text-base font-black text-brand-yellow">
                ₹{p.wallet_balance?.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
