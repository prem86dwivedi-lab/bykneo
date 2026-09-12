import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, ShieldCheck, Star, ArrowRightLeft, LogOut, ChevronLeft } from 'lucide-react';

export const ProfileScreen = ({ onBack }) => {
  const { user, switchRole, logout } = useAuth();

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
          <h2 className="text-lg font-bold text-white">My Profile</h2>
          <p className="text-xs text-gray-400">Account settings & safety</p>
        </div>
      </div>

      {/* User Info Card */}
      <div className="my-4 bg-gray-900 border border-gray-800 rounded-3xl p-5 text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-yellow/15 border-2 border-brand-yellow/40 flex items-center justify-center text-brand-yellow mx-auto shadow-lg">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">{user?.name || 'Rahul Sharma'}</h3>
          <p className="text-xs text-gray-400">{user?.phone || '+91 9876543210'}</p>
        </div>

        <div className="flex justify-center gap-4 pt-2 border-t border-gray-800">
          <div>
            <div className="text-sm font-black text-brand-yellow">⭐ {user?.rating || '5.0'}</div>
            <div className="text-[10px] text-gray-500">Rider Rating</div>
          </div>
          <div className="w-[1px] bg-gray-800"></div>
          <div>
            <div className="text-sm font-black text-emerald-400">100%</div>
            <div className="text-[10px] text-gray-500">Ride Safety</div>
          </div>
        </div>
      </div>

      {/* Switch to Captain Action Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 border border-brand-yellow/30 rounded-2xl p-4 flex items-center justify-between my-2">
        <div>
          <h4 className="text-xs font-bold text-brand-yellow">Earn with RiderXO</h4>
          <p className="text-[11px] text-gray-300">Have a bike? Switch to Captain mode & earn daily.</p>
        </div>
        <button
          onClick={() => switchRole('driver')}
          className="px-3.5 py-2 bg-brand-yellow text-gray-950 text-xs font-bold rounded-xl active:scale-95 transition flex items-center gap-1 shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Switch
        </button>
      </div>

      {/* Logout Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};
