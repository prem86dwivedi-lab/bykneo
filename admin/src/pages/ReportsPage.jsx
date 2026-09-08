import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Zap,
  Bike,
  CreditCard,
  Percent,
  Sliders,
  DollarSign,
  TrendingUp,
  Car,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

const DEFAULT_VEHICLE_PRICING = {
  bike_lite: {
    name: 'Bike Lite',
    category: 'BIKE',
    icon: '🛵',
    tagline: 'Most pocket-friendly solo ride',
    base_fare: 20,
    rate_per_km: 6.0
  },
  bike: {
    name: 'Bykneo Bike',
    category: 'BIKE',
    icon: '🏍️',
    tagline: 'Fastest solo ride through traffic',
    base_fare: 25,
    rate_per_km: 6.8
  },
  auto_lite: {
    name: 'Auto Lite',
    category: 'AUTO',
    icon: '🛺',
    tagline: 'Affordable Auto rides for up to 3',
    base_fare: 35,
    rate_per_km: 12.5
  },
  auto: {
    name: 'Bykneo Auto',
    category: 'AUTO',
    icon: '🛺',
    tagline: 'Doorstep 3-seater Auto Rickshaw',
    base_fare: 40,
    rate_per_km: 15.5
  },
  cab_economy: {
    name: 'Cab Economy',
    category: 'CAB',
    icon: '🚗',
    tagline: 'Comfortable compact AC cab',
    base_fare: 65,
    rate_per_km: 13.5
  },
  cab_premium: {
    name: 'Cab Premium',
    category: 'CAB',
    icon: '🚘',
    tagline: 'Top-rated drivers & spacious sedan',
    base_fare: 85,
    rate_per_km: 17.0
  }
};

export const ReportsPage = ({ BACKEND_URL, settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState({
    base_fare: settings?.base_fare || 25,
    rate_per_km: settings?.rate_per_km || 6.8,
    rate_per_min: settings?.rate_per_min || 0.15,
    platform_commission_pct: settings?.platform_commission_pct || 15,
    surge_multiplier: settings?.surge_multiplier || 1.0,
    auto_kyc_enabled: settings?.auto_kyc_enabled !== undefined ? settings.auto_kyc_enabled : true,
    vehicle_pricing: settings?.vehicle_pricing || DEFAULT_VEHICLE_PRICING
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    if (settings) {
      setFormData({
        base_fare: settings.base_fare || 25,
        rate_per_km: settings.rate_per_km || 6.8,
        rate_per_min: settings.rate_per_min || 0.15,
        platform_commission_pct: settings.platform_commission_pct || 15,
        surge_multiplier: settings.surge_multiplier || 1.0,
        auto_kyc_enabled: settings.auto_kyc_enabled !== undefined ? settings.auto_kyc_enabled : true,
        vehicle_pricing: {
          ...DEFAULT_VEHICLE_PRICING,
          ...(settings.vehicle_pricing || {})
        }
      });
    }
  }, [settings]);

  const handleVehiclePriceChange = (vKey, field, value) => {
    setFormData((prev) => ({
      ...prev,
      vehicle_pricing: {
        ...prev.vehicle_pricing,
        [vKey]: {
          ...prev.vehicle_pricing[vKey],
          [field]: Number(value)
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({
          type: 'success',
          message: 'Vehicle Pricing & Platform Settings Saved Live to Cloud Database!'
        });
        if (onUpdateSettings) onUpdateSettings();
      } else {
        setToast({
          type: 'error',
          message: data.error || 'Server returned an error while saving settings.'
        });
      }
    } catch (err) {
      console.error('Settings save error:', err);
      setToast({
        type: 'error',
        message: `Failed to connect to backend: ${err.message}`
      });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const vehicleList = [
    { key: 'bike_lite', name: 'Bike Lite', icon: '🛵', badge: '18% OFF', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { key: 'bike', name: 'Bykneo Bike', icon: '🏍️', badge: 'FASTEST', badgeColor: 'bg-amber-500/20 text-brand-yellow' },
    { key: 'auto_lite', name: 'Auto Lite', icon: '🛺', badge: 'POPULAR', badgeColor: 'bg-blue-500/20 text-blue-400' },
    { key: 'auto', name: 'Bykneo Auto', icon: '🛺', badge: 'STANDARD', badgeColor: 'bg-gray-800 text-gray-300' },
    { key: 'cab_economy', name: 'Cab Economy', icon: '🚗', badge: 'AC CAB', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { key: 'cab_premium', name: 'Cab Premium', icon: '🚘', badge: 'PREMIUM', badgeColor: 'bg-amber-500/20 text-amber-300' }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl relative">
      {/* Floating Animated Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 max-w-md p-4 rounded-2xl shadow-2xl border backdrop-blur-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
              : 'bg-red-950/95 border-red-500 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Vehicle Pricing & Platform Settings</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          Configure independent base prices (₹) and per-km rates (₹/km) for each vehicle type, surge multiplier, and commission
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Vehicle-Specific Pricing Matrix Cards */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-yellow" />
              <span>Vehicle-Specific Fare Matrix</span>
            </h3>
            <span className="text-[10px] bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 px-2 py-0.5 rounded-full font-bold">
              6 Active Vehicle Types
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {vehicleList.map(({ key, name, icon, badge, badgeColor }) => {
              const currentVp = formData.vehicle_pricing?.[key] || DEFAULT_VEHICLE_PRICING[key];
              return (
                <div
                  key={key}
                  className="bg-gray-850/90 border border-gray-800 hover:border-gray-700 rounded-2xl p-3.5 space-y-3 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{icon}</span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white">{name}</div>
                        <div className="text-[9.5px] text-gray-400">
                          {key.includes('bike') ? 'Solo Ride' : key.includes('auto') ? '3-Seater' : '4-Seater AC'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${badgeColor}`}>
                      {badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                        Base Fare (₹) (0-1.5 km)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          step="1"
                          value={currentVp?.base_fare ?? 25}
                          onChange={(e) => handleVehiclePriceChange(key, 'base_fare', e.target.value)}
                          className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-1.5 pl-6 pr-2 text-xs sm:text-sm text-brand-yellow font-black focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                        Rate Per KM (₹/km)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          step="0.1"
                          value={currentVp?.rate_per_km ?? 6.8}
                          onChange={(e) => handleVehiclePriceChange(key, 'rate_per_km', e.target.value)}
                          className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-1.5 pl-6 pr-2 text-xs sm:text-sm text-white font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Platform Commission & Surge Controls */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Platform Commission & Surge Multiplier</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
                Platform Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.platform_commission_pct}
                  onChange={(e) => setFormData({ ...formData, platform_commission_pct: e.target.value })}
                  className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-emerald-400 font-black focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-bold text-gray-400 mb-1">
                Surge Pricing Multiplier (e.g. 1.0x, 1.2x)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.surge_multiplier}
                  onChange={(e) => setFormData({ ...formData, surge_multiplier: e.target.value })}
                  className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-brand-yellow font-black focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">x</span>
              </div>
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
        </div>

        {/* Submit Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 sm:py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Settings to Live Cloud Database...</span>
            </>
          ) : (
            <span>Save & Update All Vehicle Pricing</span>
          )}
        </button>
      </form>
    </div>
  );
};
