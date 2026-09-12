import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, ChevronLeft, CreditCard } from 'lucide-react';

export const WalletScreen = ({ onBack }) => {
  const { user, setUser } = useAuth();
  const [balance, setBalance] = useState(Number(user?.wallet_balance || 0.00));
  const [addingAmount, setAddingAmount] = useState(null);

  const handleAddMoney = (amount) => {
    const newBal = Number((balance + amount).toFixed(2));
    setBalance(newBal);
    if (user) {
      setUser({ ...user, wallet_balance: newBal });
    }
  };

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
          <h2 className="text-lg font-bold text-white">RiderXO Wallet</h2>
          <p className="text-xs text-gray-400">Instant 1-tap ride checkout</p>
        </div>
      </div>

      {/* Balance Card */}
      <div className="my-4 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border border-brand-yellow/30 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-brand-yellow/10 rounded-full blur-2xl" />

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Available Balance
          </span>
          <div className="w-8 h-8 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="text-3xl font-black text-white">₹{balance.toFixed(2)}</div>

        <div className="flex gap-2 pt-2">
          {[100, 250, 500].map((amt) => (
            <button
              key={amt}
              onClick={() => handleAddMoney(amt)}
              className="flex-1 py-2 rounded-xl bg-gray-800 hover:bg-gray-750 border border-gray-700 text-xs font-bold text-brand-yellow transition active:scale-95"
            >
              + ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-2 mt-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          Saved Payment Methods
        </h3>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-xs">
              UPI
            </div>
            <div>
              <div className="text-sm font-bold text-white">Google Pay / PhonePe UPI</div>
              <div className="text-[11px] text-gray-400">user@okhdfcbank</div>
            </div>
          </div>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 text-brand-yellow flex items-center justify-center font-black text-xs">
              CASH
            </div>
            <div>
              <div className="text-sm font-bold text-white">Pay Cash to Captain</div>
              <div className="text-[11px] text-gray-400">Direct cash on drop-off</div>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium">Enabled</span>
        </div>
      </div>
    </div>
  );
};
