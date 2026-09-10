import React, { useState, useEffect } from 'react';
import { Users, User, Phone, Wallet, Star, Search, X } from 'lucide-react';

export const PassengersPage = ({ BACKEND_URL }) => {
  const [passengers, setPassengers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/passengers`)
      .then(res => res.json())
      .then(data => setPassengers(data.passengers || []))
      .catch(console.error);
  }, []);

  const filtered = passengers.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-yellow shrink-0" />
            <span>Registered Passengers</span>
            <span className="text-[10.5px] bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded-full font-bold">
              {passengers.length}
            </span>
          </h2>
          <p className="text-[10.5px] sm:text-xs text-gray-400">
            User accounts, wallet balances, safety scores, and registration records
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search passenger name, phone..."
            className="bg-gray-900 border border-gray-800 rounded-xl py-1.5 pl-8 pr-7 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow w-full transition shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Compact Passenger Cards Grid (2 columns on mobile, 3 on md/lg, 4 on xl) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2.5">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-1.5 sm:p-2.5 shadow-md transition-all duration-200 hover:shadow-lg flex items-center justify-between gap-1 sm:gap-2 relative group"
          >
            {/* Left: Passenger Info (Single Line Layout - No Picture) */}
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-[10px] sm:text-xs text-white truncate leading-tight">
                {p.name}
              </h4>
              <div className="text-[8px] sm:text-[9.5px] font-mono text-gray-400 flex items-center gap-0.5 mt-0.5 leading-none">
                <Phone className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-gray-500 shrink-0" />
                <span className="truncate">{p.phone}</span>
              </div>
              <div className="flex items-center gap-0.5 mt-0.5 leading-none">
                <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-brand-yellow fill-brand-yellow shrink-0" />
                <span className="text-[8px] sm:text-[9px] font-bold text-gray-300">{p.rating || '5.0'}</span>
              </div>
            </div>

            {/* Right: Boxed Wallet Balance Badge (Sitting directly in the top row on mobile) */}
            <div className="bg-gray-850/90 border border-gray-750/80 rounded-lg px-1.5 py-0.5 sm:py-1 text-right shrink-0 shadow-sm">
              <div className="text-[6.5px] sm:text-[7.5px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-end gap-0.5 leading-none">
                <Wallet className="w-1.5 h-1.5 text-brand-yellow shrink-0" />
                <span>Wallet</span>
              </div>
              <div className="text-[9.5px] sm:text-xs font-black text-brand-yellow font-mono leading-none mt-0.5">
                ₹{Number(p.wallet_balance || 0).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-2">
          <Users className="w-8 h-8 text-gray-600 mx-auto" />
          <p className="text-xs text-gray-400">No passengers found matching "{searchTerm}".</p>
        </div>
      )}
    </div>
  );
};
