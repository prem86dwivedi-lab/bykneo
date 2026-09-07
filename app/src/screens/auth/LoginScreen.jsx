import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bike, ShieldCheck, UserCheck, Smartphone, ArrowRight, Zap } from 'lucide-react';

export const LoginScreen = () => {
  const { loginWithPhone } = useAuth();
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('passenger'); // 'passenger' | 'driver'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      setError('Please enter a valid mobile number');
      return;
    }
    setError('');
    setLoading(true);
    const res = await loginWithPhone(phone, selectedRole);
    setLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to login');
    }
  };

  const handleQuickDemo = async (demoPhone, demoRole) => {
    setError('');
    setLoading(true);
    await loginWithPhone(demoPhone, demoRole);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-5 max-w-md mx-auto relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="pt-6 relative z-10">
        <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full mb-4 shadow-lg">
          <Zap className="w-3.5 h-3.5 text-brand-yellow" />
          <span className="text-xs font-semibold text-gray-300">Fast Urban Bike Mobility</span>
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-2">
          BYK<span className="text-brand-yellow">NEO</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Fastest bike rides & instant daily commuting.
        </p>
      </div>

      {/* Main Card */}
      <div className="my-auto py-6 relative z-10">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('passenger')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'passenger'
                ? 'bg-brand-yellow text-gray-950 shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Rider (Customer)
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('driver')}
            className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              selectedRole === 'driver'
                ? 'bg-brand-yellow text-gray-950 shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bike className="w-4 h-4" />
            Captain (Driver)
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Enter Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <span className="text-sm font-bold text-gray-400">+91</span>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full bg-gray-900 border border-gray-800 focus:border-brand-yellow rounded-2xl py-3.5 pl-14 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow font-medium transition"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Verifying...' : `Continue as ${selectedRole === 'driver' ? 'Captain' : 'Rider'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick 1-Click Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-gray-850">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">
            🚀 Quick 1-Click Demo Accounts
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('+91 9876543210', 'passenger')}
              className="p-3 bg-gray-900/80 hover:bg-gray-850 border border-gray-800 rounded-xl text-left transition flex flex-col justify-between"
            >
              <div className="text-xs font-bold text-white">Rahul (Rider)</div>
              <div className="text-[10px] text-gray-400 mt-1">Book rides & live track</div>
            </button>

            <button
              onClick={() => handleQuickDemo('+91 9123456780', 'driver')}
              className="p-3 bg-gray-900/80 hover:bg-gray-850 border border-gray-800 rounded-xl text-left transition flex flex-col justify-between"
            >
              <div className="text-xs font-bold text-brand-yellow">Vikram (Captain)</div>
              <div className="text-[10px] text-gray-400 mt-1">Accept rides & earn</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-gray-500 pb-2 relative z-10">
        By continuing, you agree to Bykneo's Terms & Privacy Policy.
      </div>
    </div>
  );
};
