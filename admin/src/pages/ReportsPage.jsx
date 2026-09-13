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
  X,
  QrCode,
  Sparkles,
  Calendar,
  Gift,
  Plus,
  Trash2,
  Award,
  HelpCircle
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
    name: 'RiderXO Bike',
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
    name: 'RiderXO Auto',
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

const DEFAULT_SUBSCRIPTION_PRICING = {
  bike_lite: 20,
  bike: 25,
  auto_lite: 30,
  auto: 35,
  cab_economy: 55,
  cab_premium: 70
};

const ALL_POSSIBLE_DURATIONS = [1, 2, 3, 5, 7, 10, 15, 20, 30];
const DEFAULT_ALLOWED_DURATIONS = [1, 2, 3, 5, 7, 10, 20, 30];
const DEFAULT_PACK_DISCOUNTS = {
  "1": 0,
  "2": 0,
  "3": 0,
  "5": 0,
  "7": 5,
  "10": 5,
  "15": 10,
  "20": 10,
  "30": 15
};

export const ReportsPage = ({ BACKEND_URL, settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState({
    base_fare: settings?.base_fare || 25,
    rate_per_km: settings?.rate_per_km || 6.8,
    rate_per_min: settings?.rate_per_min || 0.15,
    platform_commission_pct: settings?.platform_commission_pct || 15,
    surge_multiplier: settings?.surge_multiplier || 1.0,
    auto_kyc_enabled: settings?.auto_kyc_enabled !== undefined ? settings.auto_kyc_enabled : true,
    subscription_enabled: settings?.subscription_enabled !== undefined ? settings.subscription_enabled : true,
    gateway_enabled: settings?.gateway_enabled !== undefined ? settings.gateway_enabled : true,
    direct_upi_qr_enabled: settings?.direct_upi_qr_enabled !== undefined ? settings.direct_upi_qr_enabled : true,
    admin_upi_id: settings?.admin_upi_id || 'bykneo@okhdfcbank',
    admin_merchant_name: settings?.admin_merchant_name || 'RIDERXO',
    razorpay_key_id: settings?.razorpay_key_id || '',
    razorpay_key_secret: settings?.razorpay_key_secret || '',
    subscription_pricing: settings?.subscription_pricing || DEFAULT_SUBSCRIPTION_PRICING,
    allowed_pass_durations: settings?.allowed_pass_durations || DEFAULT_ALLOWED_DURATIONS,
    pass_pack_discounts: settings?.pass_pack_discounts || DEFAULT_PACK_DISCOUNTS,
    vehicle_pricing: settings?.vehicle_pricing || DEFAULT_VEHICLE_PRICING,
    welcome_offer_enabled: settings?.welcome_offer_enabled !== undefined ? settings.welcome_offer_enabled : true,
    welcome_offer_days: settings?.welcome_offer_days || 60,
    welcome_offer_title: settings?.welcome_offer_title || '60-Day 100% Free Launch Pass',
    welcome_offer_subtitle: settings?.welcome_offer_subtitle || 'Keep 100% of your ride fares with 0% platform commission.',
    promotional_rules: settings?.promotional_rules || [
      {
        id: "rule_referral_goldmine",
        title: "Captain Referral Goldmine (Viral Reward)",
        badge: "REFERRAL BONUS",
        badge_color: "bg-amber-500/20 text-brand-yellow border-amber-500/40",
        description: "• Refer 5 Drivers ➔ Get an extra 30 Days of Free Unlimited Passes.\n• Refer 10 Drivers ➔ Get 3 Months Free Passes + RiderXO Branded Riding Jacket & Helmet.",
        is_active: true
      },
      {
        id: "rule_zero_commission",
        title: "0% Commission Launch Guarantee",
        badge: "WELCOME PASS",
        badge_color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
        description: "• Enjoy 100% of your ride fares with 0% platform deductions.\n• Direct cash & UPI payouts directly into your personal account with zero hold.",
        is_active: true
      },
      {
        id: "rule_daily_fuel",
        title: "Daily Fuel & Target Bonus",
        badge: "DAILY BONUS",
        badge_color: "bg-blue-500/20 text-blue-400 border-blue-500/40",
        description: "• Complete 5 rides in a day ➔ Get instant fuel cashback.\n• Zero commission deduction even on peak surge & night fares.",
        is_active: true
      }
    ]
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
        subscription_enabled: settings.subscription_enabled !== undefined ? settings.subscription_enabled : true,
        gateway_enabled: settings.gateway_enabled !== undefined ? settings.gateway_enabled : true,
        direct_upi_qr_enabled: settings.direct_upi_qr_enabled !== undefined ? settings.direct_upi_qr_enabled : true,
        admin_upi_id: settings.admin_upi_id || 'bykneo@okhdfcbank',
        admin_merchant_name: settings.admin_merchant_name || 'RIDERXO',
        razorpay_key_id: settings.razorpay_key_id || '',
        razorpay_key_secret: settings.razorpay_key_secret || '',
        welcome_offer_enabled: settings.welcome_offer_enabled !== undefined ? settings.welcome_offer_enabled : true,
        welcome_offer_days: settings.welcome_offer_days || 60,
        welcome_offer_title: settings.welcome_offer_title || '60-Day 100% Free Launch Pass',
        welcome_offer_subtitle: settings.welcome_offer_subtitle || 'Keep 100% of your ride fares with 0% platform commission.',
        promotional_rules: Array.isArray(settings.promotional_rules) && settings.promotional_rules.length > 0
          ? settings.promotional_rules
          : [
            {
              id: "rule_referral_goldmine",
              title: "Captain Referral Goldmine (Viral Reward)",
              badge: "REFERRAL BONUS",
              badge_color: "bg-amber-500/20 text-brand-yellow border-amber-500/40",
              description: "• Refer 5 Drivers ➔ Get an extra 30 Days of Free Unlimited Passes.\n• Refer 10 Drivers ➔ Get 3 Months Free Passes + RiderXO Branded Riding Jacket & Helmet.",
              is_active: true
            },
            {
              id: "rule_zero_commission",
              title: "0% Commission Launch Guarantee",
              badge: "WELCOME PASS",
              badge_color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
              description: "• Enjoy 100% of your ride fares with 0% platform deductions.\n• Direct cash & UPI payouts directly into your personal account with zero hold.",
              is_active: true
            },
            {
              id: "rule_daily_fuel",
              title: "Daily Fuel & Target Bonus",
              badge: "DAILY BONUS",
              badge_color: "bg-blue-500/20 text-blue-400 border-blue-500/40",
              description: "• Complete 5 rides in a day ➔ Get instant fuel cashback.\n• Zero commission deduction even on peak surge & night fares.",
              is_active: true
            }
          ],
        subscription_pricing: {
          ...DEFAULT_SUBSCRIPTION_PRICING,
          ...(settings.subscription_pricing || {})
        },
        allowed_pass_durations: Array.isArray(settings.allowed_pass_durations) && settings.allowed_pass_durations.length > 0
          ? settings.allowed_pass_durations
          : DEFAULT_ALLOWED_DURATIONS,
        pass_pack_discounts: {
          ...DEFAULT_PACK_DISCOUNTS,
          ...(settings.pass_pack_discounts || {})
        },
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

  const handleSubscriptionPriceChange = (vKey, value) => {
    setFormData((prev) => ({
      ...prev,
      subscription_pricing: {
        ...prev.subscription_pricing,
        [vKey]: Number(value)
      }
    }));
  };

  const handleDurationToggle = (days) => {
    setFormData((prev) => {
      const current = prev.allowed_pass_durations || [];
      const exists = current.includes(days);
      const updated = exists ? current.filter((d) => d !== days) : [...current, days].sort((a, b) => a - b);
      return {
        ...prev,
        allowed_pass_durations: updated.length > 0 ? updated : [1] // At least 1 day required
      };
    });
  };

  const handlePackDiscountChange = (days, value) => {
    setFormData((prev) => ({
      ...prev,
      pass_pack_discounts: {
        ...prev.pass_pack_discounts,
        [String(days)]: Math.max(0, Math.min(99, Number(value) || 0))
      }
    }));
  };

  const handleAddRule = () => {
    const newRule = {
      id: `rule_${Date.now()}`,
      title: 'New Captain Promotional Perk',
      badge: 'OFFER',
      badge_color: 'bg-amber-500/20 text-brand-yellow border-amber-500/40',
      description: '• Add clear perk instructions for your drivers here.',
      is_active: true
    };
    setFormData((prev) => ({
      ...prev,
      promotional_rules: [...(prev.promotional_rules || []), newRule]
    }));
  };

  const handleUpdateRule = (index, field, value) => {
    setFormData((prev) => {
      const list = [...(prev.promotional_rules || [])];
      if (list[index]) {
        list[index] = { ...list[index], [field]: value };
      }
      return { ...prev, promotional_rules: list };
    });
  };

  const handleDeleteRule = (index) => {
    setFormData((prev) => {
      const list = (prev.promotional_rules || []).filter((_, i) => i !== index);
      return { ...prev, promotional_rules: list };
    });
  };

  const handleToggleRule = (index) => {
    setFormData((prev) => {
      const list = [...(prev.promotional_rules || [])];
      if (list[index]) {
        list[index] = { ...list[index], is_active: !list[index].is_active };
      }
      return { ...prev, promotional_rules: list };
    });
  };

  const handleAutoSaveSetting = async (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const fieldLabels = {
          gateway_enabled: 'Payment Gateway (Razorpay)',
          direct_upi_qr_enabled: 'Direct Admin UPI QR',
          subscription_enabled: 'Daily Subscription Passes',
          auto_kyc_enabled: 'Driver KYC Mode'
        };
        setToast({
          type: 'success',
          message: `${fieldLabels[field] || field} set to ${value ? 'ACTIVE (ON)' : 'DISABLED (OFF)'} and synced live!`
        });
        if (onUpdateSettings) onUpdateSettings();
      }
    } catch (err) {
      console.error('Settings auto-save error:', err);
    } finally {
      setTimeout(() => setToast(null), 3500);
    }
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
    { key: 'bike', name: 'RiderXO Bike', icon: '🏍️', badge: 'FASTEST', badgeColor: 'bg-amber-500/20 text-brand-yellow' },
    { key: 'auto_lite', name: 'Auto Lite', icon: '🛺', badge: 'POPULAR', badgeColor: 'bg-blue-500/20 text-blue-400' },
    { key: 'auto', name: 'RiderXO Auto', icon: '🛺', badge: 'STANDARD', badgeColor: 'bg-gray-800 text-gray-300' },
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
        {/* 1. Vehicle-Specific Pricing Matrix Cards (Compact Single-Row Design) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Vehicle-Specific Fare Matrix</span>
            </h3>
            <span className="text-[9.5px] bg-brand-yellow/10 text-brand-yellow border border-brand-yellow/20 px-2 py-0.5 rounded-full font-bold">
              6 Active Vehicle Types
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
            {vehicleList.map(({ key, name, icon, badge, badgeColor }) => {
              const currentVp = formData.vehicle_pricing?.[key] || DEFAULT_VEHICLE_PRICING[key];
              return (
                <div
                  key={key}
                  className="bg-gray-850/90 border border-gray-800 hover:border-gray-700 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2 transition shadow-sm"
                >
                  {/* Left Column: Vehicle Icon, Full Name (No Truncation), Subtitle & Badge */}
                  <div className="flex items-center gap-2 shrink-0 min-w-0">
                    <span className="text-xl sm:text-2xl shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-[13px] font-black text-white whitespace-nowrap leading-tight">
                        {name}
                      </div>
                      <div className="text-[8.5px] sm:text-[9.5px] text-gray-400 whitespace-nowrap leading-none mt-0.5">
                        {key.includes('bike') ? 'Solo Ride' : key.includes('auto') ? '3-Seater' : '4-Seater AC'}
                      </div>
                      <div className="mt-1">
                        <span className={`text-[7.5px] sm:text-[8.5px] font-black px-1.5 py-0.2 rounded-md inline-block shadow-sm ${badgeColor}`}>
                          {badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stacked Box 1 (Base Fare) & Box 2 (Rate Per KM) - Compact & Right-Aligned */}
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0 max-w-[185px] sm:max-w-[210px] ml-auto">
                    {/* Box 1 (Top): Base Fare Input (0-1.5 km) */}
                    <div className="flex items-center justify-between bg-gray-950 border border-gray-750 focus-within:border-brand-yellow rounded-lg px-2 py-0.5 sm:py-1 transition w-full shadow-inner">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="text-[7.5px] sm:text-[8.5px] text-gray-400 font-bold whitespace-nowrap">
                          Base (0-1.5km):
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-bold">₹</span>
                      </div>
                      <input
                        type="number"
                        step="1"
                        value={currentVp?.base_fare ?? 25}
                        onChange={(e) => handleVehiclePriceChange(key, 'base_fare', e.target.value)}
                        className="w-8 sm:w-10 bg-transparent text-xs sm:text-[13px] text-brand-yellow font-black focus:outline-none text-right font-mono shrink-0"
                        title="Base Fare (0-1.5 km)"
                      />
                    </div>

                    {/* Box 2 (Bottom): Rate Per KM Input */}
                    <div className="flex items-center justify-between bg-gray-950 border border-gray-750 focus-within:border-brand-yellow rounded-lg px-2 py-0.5 sm:py-1 transition w-full shadow-inner">
                      <div className="flex items-center gap-0.5 min-w-0">
                        <span className="text-[7.5px] sm:text-[8.5px] text-gray-400 font-bold whitespace-nowrap">
                          Rate/km:
                        </span>
                        <span className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-bold">₹</span>
                      </div>
                      <input
                        type="number"
                        step="0.1"
                        value={currentVp?.rate_per_km ?? 6.8}
                        onChange={(e) => handleVehiclePriceChange(key, 'rate_per_km', e.target.value)}
                        className="w-8 sm:w-10 bg-transparent text-xs sm:text-[13px] text-white font-bold focus:outline-none text-right font-mono shrink-0"
                        title="Rate Per KM (₹/km)"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Platform Commission & Surge Controls */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-3 shadow-xl">
          <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 border-b border-gray-800 pb-2.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Platform Commission & Surge Multiplier</span>
          </h3>

          {/* Side-by-side 2 columns on mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <label className="block text-[9.5px] sm:text-[11px] font-bold text-gray-400 mb-1 truncate">
                Commission (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.platform_commission_pct}
                  onChange={(e) => setFormData({ ...formData, platform_commission_pct: e.target.value })}
                  className="w-full bg-gray-850 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 pr-6 text-xs sm:text-sm text-emerald-400 font-black focus:outline-none font-mono"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] sm:text-xs font-bold">%</span>
              </div>
            </div>

            <div>
              <label className="block text-[9.5px] sm:text-[11px] font-bold text-gray-400 mb-1 truncate">
                Surge Multiplier
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.surge_multiplier}
                  onChange={(e) => setFormData({ ...formData, surge_multiplier: e.target.value })}
                  className="w-full bg-gray-850 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 pr-6 text-xs sm:text-sm text-brand-yellow font-black focus:outline-none font-mono"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] sm:text-xs font-bold">x</span>
              </div>
            </div>
          </div>

          {/* KYC Verification Mode Toggle Section - Compact */}
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${
                formData.auto_kyc_enabled ? 'bg-amber-500/20 text-brand-yellow' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {formData.auto_kyc_enabled ? <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              </div>
              <div className="min-w-0">
                <h4 className="text-[10.5px] sm:text-xs font-black text-white leading-tight">
                  Driver KYC Verification
                </h4>
                <p className="text-[8px] sm:text-[9.5px] text-gray-400 truncate leading-none mt-0.5">
                  {formData.auto_kyc_enabled
                    ? '⚡ AI Automatic: Instant selfie match'
                    : '🛡️ Manual Admin Review Mode'}
                </p>
              </div>
            </div>

            {/* Compact Toggle Button */}
            <button
              type="button"
              onClick={() => handleAutoSaveSetting('auto_kyc_enabled', !formData.auto_kyc_enabled)}
              className={`px-2 py-1 rounded-lg font-black text-[9px] sm:text-[10.5px] flex items-center gap-1 transition shrink-0 shadow-sm ${
                formData.auto_kyc_enabled
                  ? 'bg-brand-yellow text-gray-950 shadow-brand-yellow/20'
                  : 'bg-gray-850 text-gray-300 border border-gray-700 hover:bg-gray-750'
              }`}
            >
              {formData.auto_kyc_enabled ? (
                <>
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                  <span>Auto AI (ON)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>Manual Review</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3. Daily Subscription Pass & Direct Admin UPI Settings (0% Commission Day-Wise Pass) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-yellow shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                  <span>Daily Subscription Passes (Day-Wise 0% Commission)</span>
                  <span className="text-[8.5px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded">Namma Yatri Model</span>
                </h3>
                <p className="text-[8.5px] sm:text-[9.5px] text-gray-400 truncate mt-0.5">
                  Captains pay a daily pass via UPI directly to your bank account & keep 100% of ride fares
                </p>
              </div>
            </div>

            {/* Subscription Master Toggle */}
            <button
              type="button"
              onClick={() => handleAutoSaveSetting('subscription_enabled', !formData.subscription_enabled)}
              className={`px-2.5 py-1 rounded-lg font-black text-[9.5px] sm:text-xs flex items-center gap-1 transition shrink-0 shadow-sm ${
                formData.subscription_enabled
                  ? 'bg-emerald-500 text-gray-950 shadow-emerald-500/20'
                  : 'bg-gray-850 text-gray-400 border border-gray-700 hover:bg-gray-750'
              }`}
            >
              <Sparkles className="w-3 h-3 fill-current" />
              <span>{formData.subscription_enabled ? 'Passes Enabled (ON)' : 'Disabled (OFF)'}</span>
            </button>
          </div>

          {/* Real-time Payment Gateway Setup (Industry Standard Meesho / Swiggy Model) */}
          <div className="bg-gray-950/80 border border-blue-500/30 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-blue-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Payment Gateway Integration (Razorpay / Meesho Model)</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded">
                  Live Auto-Detection
                </span>
                <button
                  type="button"
                  onClick={() => handleAutoSaveSetting('gateway_enabled', !formData.gateway_enabled)}
                  className={`px-2 py-0.5 rounded-lg font-black text-[9px] sm:text-[10px] flex items-center gap-1 transition shrink-0 shadow-sm ${
                    formData.gateway_enabled
                      ? 'bg-blue-500 text-gray-950 shadow-blue-500/20'
                      : 'bg-gray-850 text-gray-400 border border-gray-700 hover:bg-gray-750'
                  }`}
                  title="Enable/Disable Gateway Payment Option for Drivers"
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>{formData.gateway_enabled ? 'Gateway (ON)' : 'Disabled (OFF)'}</span>
                </button>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-gray-400">
              Enables real-time dynamic QR codes and GPay/PhonePe intent verification. The app automatically detects real bank credits via Razorpay webhook.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                  Razorpay Key ID (rzp_live_... / rzp_test_...)
                </label>
                <input
                  type="text"
                  value={formData.razorpay_key_id}
                  onChange={(e) => setFormData({ ...formData, razorpay_key_id: e.target.value })}
                  placeholder="e.g. rzp_live_xxxxxxxxxxxxxx"
                  className="w-full bg-gray-900 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                  Razorpay Key Secret
                </label>
                <input
                  type="password"
                  value={formData.razorpay_key_secret}
                  onChange={(e) => setFormData({ ...formData, razorpay_key_secret: e.target.value })}
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-gray-900 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 text-xs text-white placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Admin Direct Bank UPI ID & Payee Name Setup */}
          <div className="bg-gray-950/80 border border-gray-800 rounded-xl p-3 sm:p-3.5 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-brand-yellow flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Admin Bank UPI Direct Settlement</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] text-gray-400 font-mono">100% Direct to Bank</span>
                <button
                  type="button"
                  onClick={() => handleAutoSaveSetting('direct_upi_qr_enabled', !formData.direct_upi_qr_enabled)}
                  className={`px-2 py-0.5 rounded-lg font-black text-[9px] sm:text-[10px] flex items-center gap-1 transition shrink-0 shadow-sm ${
                    formData.direct_upi_qr_enabled
                      ? 'bg-brand-yellow text-gray-950 shadow-brand-yellow/20'
                      : 'bg-gray-850 text-gray-400 border border-gray-700 hover:bg-gray-750'
                  }`}
                  title="Enable/Disable Direct QR Code for Drivers"
                >
                  <QrCode className="w-2.5 h-2.5" />
                  <span>{formData.direct_upi_qr_enabled ? 'Direct QR (ON)' : 'Disabled (OFF)'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                  Admin Real UPI ID (VPA) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.admin_upi_id}
                    onChange={(e) => setFormData({ ...formData, admin_upi_id: e.target.value })}
                    placeholder="e.g. bykneo@okhdfcbank"
                    className="w-full bg-gray-900 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 text-xs text-white placeholder-gray-600 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                  Admin Business / Payee Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.admin_merchant_name}
                    onChange={(e) => setFormData({ ...formData, admin_merchant_name: e.target.value })}
                    placeholder="e.g. RIDERXO"
                    className="w-full bg-gray-900 border border-gray-750 focus:border-brand-yellow rounded-lg sm:rounded-xl py-1.5 sm:py-2 px-2.5 text-xs text-white placeholder-gray-600 focus:outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle-Specific Daily Pass Pricing Matrix (6 Vehicles) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold text-gray-300 flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-brand-yellow" />
                <span>Vehicle-Wise 24h Pass Pricing (₹ / Day)</span>
              </span>
              <span className="text-[8.5px] text-gray-400">Modify rate per vehicle category</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {vehicleList.map(({ key, name, icon }) => {
                const currentPassPrice = formData.subscription_pricing?.[key] ?? DEFAULT_SUBSCRIPTION_PRICING[key];
                return (
                  <div
                    key={key}
                    className="bg-gray-850/90 border border-gray-800 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-1.5 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base sm:text-lg shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-black text-white truncate leading-tight">
                          {name}
                        </div>
                        <div className="text-[8px] text-gray-400 truncate">24h Unlimited</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-gray-950 border border-gray-750 focus-within:border-brand-yellow rounded-lg px-1.5 py-0.5 shrink-0 shadow-inner">
                      <span className="text-[9.5px] font-bold text-brand-yellow mr-0.5">₹</span>
                      <input
                        type="number"
                        step="1"
                        value={currentPassPrice}
                        onChange={(e) => handleSubscriptionPriceChange(key, e.target.value)}
                        className="w-8 sm:w-10 bg-transparent text-xs sm:text-[13px] text-white font-black focus:outline-none text-right font-mono"
                        title={`${name} 24h Pass Rate`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-gray-950/80 border border-emerald-500/30 rounded-xl p-3 sm:p-4 space-y-3 shadow-inner">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Allowed Pass Duration Packs & Bulk Discounts</span>
                </span>
                <p className="text-[8.5px] sm:text-[9.5px] text-gray-400 mt-0.5">
                  Select which day packs captains can purchase on their app (e.g. 1d, 2d, 3d, 5d, 10d, 20d, 30d) and set optional discounts
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      allowed_pass_durations: ALL_POSSIBLE_DURATIONS
                    }))
                  }
                  className="px-2 py-0.5 rounded bg-gray-850 hover:bg-gray-800 text-brand-yellow text-[9px] font-bold border border-gray-700 transition"
                >
                  Select All (1d-30d)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      allowed_pass_durations: [1]
                    }))
                  }
                  className="px-2 py-0.5 rounded bg-gray-850 hover:bg-gray-800 text-gray-300 text-[9px] font-bold border border-gray-700 transition"
                >
                  1-Day Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {ALL_POSSIBLE_DURATIONS.map((days) => {
                const isEnabled = (formData.allowed_pass_durations || []).includes(days);
                const discount = formData.pass_pack_discounts?.[String(days)] || 0;

                return (
                  <div
                    key={days}
                    className={`rounded-xl p-2 sm:p-2.5 border transition flex flex-col justify-between gap-1.5 ${
                      isEnabled
                        ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                        : 'bg-gray-900/60 border-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleDurationToggle(days)}
                        className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                      >
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border transition ${
                            isEnabled
                              ? 'bg-emerald-500 text-gray-950 border-emerald-400'
                              : 'border-gray-700 bg-gray-850 text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <span className={`text-xs font-black truncate ${isEnabled ? 'text-white' : 'text-gray-400'}`}>
                          {days === 1 ? '1 Day (24h)' : `${days} Days`}
                        </span>
                      </button>
                    </div>

                    {isEnabled && (
                      <div className="flex items-center justify-between bg-gray-950/80 border border-gray-800 rounded-lg px-2 py-1">
                        <span className="text-[8.5px] text-gray-400 font-bold">Discount:</span>
                        <div className="flex items-center gap-0.5">
                          <input
                            type="number"
                            min="0"
                            max="90"
                            step="1"
                            value={discount}
                            onChange={(e) => handlePackDiscountChange(days, e.target.value)}
                            className="w-7 bg-transparent text-right text-[11px] font-bold text-brand-yellow focus:outline-none font-mono"
                            title="Discount % for this pack"
                          />
                          <span className="text-[8.5px] text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 🎁 NEW DRIVER WELCOME FREE OFFER & DYNAMIC PROMOTIONAL RULES MANAGER */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-br from-amber-500/10 via-gray-900 to-gray-900 border-2 border-amber-500/40 rounded-2xl sm:rounded-3xl p-3 sm:p-5 space-y-4 shadow-xl">
          {/* Header & Master Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 text-brand-yellow flex items-center justify-center shrink-0 border border-amber-500/30">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                  <span>New Driver Welcome Free Pass & Promotional Rules</span>
                  <span className="text-[9px] bg-amber-400/20 text-brand-yellow px-2 py-0.5 rounded-full font-bold uppercase border border-amber-400/30">
                    Growth Engine
                  </span>
                </h3>
                <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                  Automatically grant 100% Free 0% Commission Launch Passes to new drivers & display live promotional rules on their screens
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAutoSaveSetting('welcome_offer_enabled', !formData.welcome_offer_enabled)}
              className={`px-3 py-1.5 rounded-xl font-black text-[10px] sm:text-xs flex items-center gap-1.5 transition shrink-0 shadow-md ${
                formData.welcome_offer_enabled
                  ? 'bg-amber-400 hover:bg-amber-300 text-gray-950 shadow-amber-400/20'
                  : 'bg-gray-850 text-gray-400 border border-gray-700 hover:bg-gray-750'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>{formData.welcome_offer_enabled ? 'Welcome Offer Active (ON)' : 'Offer Disabled (OFF)'}</span>
            </button>
          </div>

          {/* Welcome Offer Configuration Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                Free Trial Duration (Days) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={formData.welcome_offer_days}
                  onChange={(e) => setFormData({ ...formData, welcome_offer_days: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-2 px-3 text-sm text-brand-yellow font-black font-mono focus:outline-none"
                />
                <div className="flex gap-1">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ ...formData, welcome_offer_days: d })}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        formData.welcome_offer_days === d
                          ? 'bg-amber-500/20 text-brand-yellow border-brand-yellow'
                          : 'bg-gray-950 text-gray-400 border-gray-800 hover:bg-gray-850'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[9px] sm:text-[10.5px] font-bold text-gray-300 mb-1">
                Welcome Offer Headline & Subtitle *
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  value={formData.welcome_offer_title}
                  onChange={(e) => setFormData({ ...formData, welcome_offer_title: e.target.value })}
                  placeholder="e.g. 60-Day 100% Free Launch Pass"
                  className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-1.5 px-3 text-xs text-white font-bold focus:outline-none"
                />
                <input
                  type="text"
                  required
                  value={formData.welcome_offer_subtitle}
                  onChange={(e) => setFormData({ ...formData, welcome_offer_subtitle: e.target.value })}
                  placeholder="e.g. Keep 100% of your ride fares with 0% platform commission."
                  className="w-full bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-1.5 px-3 text-xs text-gray-300 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Promotional Rules & Referral Goldmine Cards */}
          <div className="space-y-2.5 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-[10.5px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand-yellow" />
                  <span>Captain Perks, Rewards & Referral Goldmine Rules</span>
                </span>
                <p className="text-[9px] text-gray-400 mt-0.5">
                  These promotional cards are displayed directly inside the Captains' Earnings and Recharge screen.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRule}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-brand-yellow hover:bg-amber-500/30 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Promotional Rule</span>
              </button>
            </div>

            {/* Rule Cards Grid */}
            <div className="space-y-2.5">
              {(formData.promotional_rules || []).map((rule, idx) => (
                <div
                  key={rule.id || idx}
                  className={`p-3 rounded-2xl border transition space-y-2 ${
                    rule.is_active !== false
                      ? 'bg-gray-950/90 border-gray-800 shadow-md'
                      : 'bg-gray-950/40 border-gray-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-gray-500 font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={rule.title}
                        onChange={(e) => handleUpdateRule(idx, 'title', e.target.value)}
                        placeholder="Rule Title (e.g. Captain Referral Goldmine)"
                        className="w-full bg-gray-900 border border-gray-800 focus:border-brand-yellow rounded-lg py-1 px-2 text-xs font-bold text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="text"
                        value={rule.badge || 'OFFER'}
                        onChange={(e) => handleUpdateRule(idx, 'badge', e.target.value)}
                        placeholder="TAG"
                        className="w-24 bg-gray-900 border border-gray-800 focus:border-brand-yellow rounded-lg py-1 px-2 text-[10px] font-bold text-brand-yellow uppercase text-center font-mono focus:outline-none"
                        title="Badge Tag"
                      />

                      <button
                        type="button"
                        onClick={() => handleToggleRule(idx)}
                        className={`px-2 py-1 rounded-lg text-[9.5px] font-bold transition ${
                          rule.is_active !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-gray-850 text-gray-500 border border-gray-800'
                        }`}
                        title="Toggle Active"
                      >
                        {rule.is_active !== false ? 'Active' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(idx)}
                        className="p-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      value={rule.description}
                      onChange={(e) => handleUpdateRule(idx, 'description', e.target.value)}
                      placeholder="Enter rule details, terms, or referral perks..."
                      className="w-full bg-gray-900 border border-gray-800 focus:border-brand-yellow rounded-lg p-2 text-xs text-gray-300 focus:outline-none leading-relaxed resize-none font-sans"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 sm:py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
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


