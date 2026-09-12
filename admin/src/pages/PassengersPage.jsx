import React, { useState, useEffect } from 'react';
import { Users, User, Phone, Wallet, Star, Search, X, Trash2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

export const PassengersPage = ({ BACKEND_URL }) => {
  const [passengers, setPassengers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDeletePassenger, setConfirmDeletePassenger] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchPassengers = () => {
    fetch(`${BACKEND_URL}/api/admin/passengers`)
      .then(res => res.json())
      .then(data => setPassengers(data.passengers || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  const handleDeletePassenger = async (passenger) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/passengers/${passenger.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassengers(prev => prev.filter(p => p.id !== passenger.id));
        setNotification({ type: 'success', message: `Passenger ${passenger.name || passenger.phone} deleted permanently.` });
        setConfirmDeletePassenger(null);
      } else {
        setNotification({ type: 'error', message: data.error || 'Failed to delete passenger.' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Connection error while deleting passenger.' });
    } finally {
      setIsDeleting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handlePurgeDemoData = async () => {
    if (!window.confirm('Are you sure you want to purge all mock/demo accounts? This will keep only real registered users.')) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/purge-demo-data`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchPassengers();
        setNotification({ type: 'success', message: data.message });
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to purge demo data.' });
    } finally {
      setIsPurging(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const filtered = passengers.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl animate-in slide-in-from-top ${
          notification.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-red-500/20 text-red-300 border border-red-500/40'
        }`}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            Real passenger accounts, wallet balances, safety ratings, and identity records
          </p>
        </div>

        {/* Controls: Search & Purge Demo */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePurgeDemoData}
            disabled={isPurging}
            className="px-2.5 py-1.5 rounded-xl bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-750 text-[10.5px] font-bold transition flex items-center gap-1.5 shrink-0"
            title="Clean mock/demo accounts"
          >
            {isPurging ? (
              <RefreshCw className="w-3 h-3 animate-spin text-brand-yellow" />
            ) : (
              <Sparkles className="w-3 h-3 text-brand-yellow" />
            )}
            <span className="hidden sm:inline">Purge Mock Data</span>
          </button>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search passenger..."
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
      </div>

      {/* Passenger Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-2.5">
        {filtered.map((p) => (
          <div
            key={p.id}
            className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-2 sm:p-2.5 shadow-md transition-all duration-200 hover:shadow-lg flex items-center justify-between gap-1 sm:gap-2 relative group"
          >
            {/* Left: Passenger Info */}
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-[10px] sm:text-xs text-white truncate leading-tight">
                {p.name || 'Passenger'}
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

            {/* Right: Boxed Wallet Balance + Delete Button */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="bg-gray-850/90 border border-gray-750/80 rounded-lg px-1.5 py-0.5 sm:py-1 text-right shadow-sm">
                <div className="text-[6.5px] sm:text-[7.5px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-end gap-0.5 leading-none">
                  <Wallet className="w-1.5 h-1.5 text-brand-yellow shrink-0" />
                  <span>Wallet</span>
                </div>
                <div className="text-[9.5px] sm:text-xs font-black text-brand-yellow font-mono leading-none mt-0.5">
                  ₹{Number(p.wallet_balance || 0).toFixed(2)}
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => setConfirmDeletePassenger(p)}
                className="w-7 h-7 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 flex items-center justify-center transition active:scale-95 shrink-0"
                title="Permanently remove passenger"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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

      {/* Delete Confirmation Modal */}
      {confirmDeletePassenger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Delete Passenger?</h3>
                <p className="text-xs text-gray-400">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-950 rounded-xl border border-gray-800 text-xs space-y-1">
              <div className="font-bold text-white">{confirmDeletePassenger.name || 'Unnamed Passenger'}</div>
              <div className="text-gray-400 font-mono">{confirmDeletePassenger.phone}</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeletePassenger(null)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePassenger(confirmDeletePassenger)}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-red-500/20 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
