import React, { useState, useEffect } from 'react';
import { BarChart3, Settings, Sliders, CheckCircle2, TrendingUp, DollarSign, ShieldCheck, Zap } from 'lucide-react';

export const ReportsPage = ({ BACKEND_URL, settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState({
    base_fare: settings?.base_fare || 25,
    rate_per_km: settings?.rate_per_km || 9,
    rate_per_min: settings?.rate_per_min || 1,
    platform_commission_pct: settings?.platform_commission_pct || 15,
    surge_multiplier: settings?.surge_multiplier || 1.0,
    auto_kyc_enabled: settings?.auto_kyc_enabled !== undefined ? settings.auto_kyc_enabled : true
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        base_fare: settings.base_fare,
        rate_per_km: settings.rate_per_km,
        rate_per_min: settings.rate_per_min,
        platform_commission_pct: settings.platform_commission_pct,
        surge_multiplier: settings.surge_multiplier,
        auto_kyc_enabled: settings.auto_kyc_enabled !== undefined ? settings.auto_kyc_enabled : true
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await fetch(`${BACKEND_URL}/api/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setSaved(true);
    if (onUpdateSettings) onUpdateSettings();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Pricing & Fare Settings</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          Adjust base fares, per-kilometer charges, surge multiplier, and platform commission %
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 sm:space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
              Base Fare (₹) (First 1.5 km)
            </label>
            <input
              type="number"
              value={formData.base_fare}
              onChange={(e) => setFormData({ ...formData, base_fare: e.target.value })}
              className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
              Rate Per KM (₹/km)
            </label>
            <input
              type="number"
              value={formData.rate_per_km}
              onChange={(e) => setFormData({ ...formData, rate_per_km: e.target.value })}
              className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-white font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
              Platform Commission (%)
            </label>
            <input
              type="number"
              value={formData.platform_commission_pct}
              onChange={(e) => setFormData({ ...formData, platform_commission_pct: e.target.value })}
              className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-emerald-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
              Surge Pricing Multiplier (e.g. 1.0x, 1.2x)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.surge_multiplier}
              onChange={(e) => setFormData({ ...formData, surge_multiplier: e.target.value })}
              className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-brand-yellow font-bold focus:outline-none"
            />
          </div>
        </div>

        {/* KYC Verification Mode Toggle Section */}
        <div className="bg-gray-950/70 border border-gray-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                formData.auto_kyc_enabled ? 'bg-amber-500/20 text-brand-yellow' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {formData.auto_kyc_enabled ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  Driver KYC Verification Mode
                </h4>
                <p className="text-[10px] text-gray-400">
                  {formData.auto_kyc_enabled
                    ? '⚡ AI Automatic Verification: Real selfie face-match approves drivers instantly.'
                    : '🛡️ Manual Admin Review: All driver submissions require manual document check in Captains directory.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, auto_kyc_enabled: !formData.auto_kyc_enabled })}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition ${
                formData.auto_kyc_enabled
                  ? 'bg-amber-400 text-gray-950 shadow-md shadow-amber-400/20'
                  : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-750'
              }`}
            >
              {formData.auto_kyc_enabled ? (
                <>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Auto AI (ON)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Manual Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 sm:py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition"
        >
          {saved ? 'Settings Saved Successfully!' : 'Save & Update Platform Settings'}
        </button>
      </form>
    </div>
  );
};
