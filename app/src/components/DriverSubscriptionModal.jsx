import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL, useSocket } from '../context/SocketContext';
import {
  X,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Zap,
  ArrowRight,
  Clock,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  Lock
} from 'lucide-react';

export const DriverSubscriptionModal = ({ isOpen, onClose, onSubscriptionActivated }) => {
  const { user, driverProfile } = useAuth();
  const { socket } = useSocket();
  const [subData, setSubData] = useState(null);
  const [selectedDays, setSelectedDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showExtendPayment, setShowExtendPayment] = useState(false);
  const [showDirectUpi, setShowDirectUpi] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  const driverId = driverProfile?.id || user?.id;

  const fetchStatus = () => {
    if (!driverId) return;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/drivers/subscription/${driverId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSubData(data);
          if (Array.isArray(data.allowed_pass_durations) && data.allowed_pass_durations.length > 0) {
            // Keep selected if valid, or default to 1st allowed
            if (!data.allowed_pass_durations.includes(selectedDays)) {
              setSelectedDays(data.allowed_pass_durations[0]);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load subscription info:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!isOpen || !driverId) return;
    setError('');
    setSuccessMsg('');
    setShowExtendPayment(false);
    setShowDirectUpi(false);
    fetchStatus();
  }, [isOpen, driverId]);

  // Listen to real-time socket events for pass activation
  useEffect(() => {
    if (!socket) return;
    const handleActivated = (data) => {
      const daysCount = data.days || selectedDays || 1;
      setSuccessMsg(`🎉 Real Payment Confirmed! ${daysCount}-Day Pass Activated.`);
      if (onSubscriptionActivated) onSubscriptionActivated(data);
      fetchStatus();
      setTimeout(() => {
        onClose();
      }, 1800);
    };

    socket.on('driver:subscription_activated', handleActivated);
    return () => {
      socket.off('driver:subscription_activated', handleActivated);
    };
  }, [socket, selectedDays]);

  // Live ticking countdown for active passes
  useEffect(() => {
    if (!subData?.is_active || !subData?.expires_at) return;

    const calcCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(subData.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isExpired: false });
    };

    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [subData]);

  if (!isOpen) return null;

  const adminUpi = subData?.admin_upi_id || 'bykneo@okhdfcbank';
  const merchantName = subData?.admin_merchant_name || 'Bykneo Mobility';
  const dailyRate = Number(subData?.pass_price || 25);
  const allowedDurations = Array.isArray(subData?.allowed_pass_durations) && subData.allowed_pass_durations.length > 0
    ? subData.allowed_pass_durations
    : [1, 2, 3, 5, 7, 10, 20, 30];
  const packDiscounts = subData?.pass_pack_discounts || {};

  const currentDiscountPct = Number(packDiscounts[String(selectedDays)] || 0);
  const rawTotal = dailyRate * selectedDays;
  const totalAmount = Math.max(1, Math.round(rawTotal * (1 - currentDiscountPct / 100)));
  const savingsAmount = rawTotal - totalAmount;

  const vehicleName = driverProfile?.vehicle_type_name || driverProfile?.vehicle_model || 'Bykneo Vehicle';
  const driverPhone = user?.phone || driverProfile?.phone || '9999999999';
  const driverName = driverProfile?.name || user?.name || 'Bykneo Captain';

  const upiString = `upi://pay?pa=${adminUpi}&pn=${encodeURIComponent(merchantName)}&am=${totalAmount}&cu=INR&tn=Bykneo_${selectedDays}d_Pass`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiString)}`;

  // REAL PAYMENT GATEWAY CHECKOUT (Meesho / Swiggy Industry Model)
  const handleOpenRazorpayCheckout = async () => {
    setError('');
    setProcessingPayment(true);

    try {
      // 1. Create real order on backend with selected days
      const res = await fetch(`${BACKEND_URL}/api/drivers/subscription/create-razorpay-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, days: selectedDays })
      });

      const orderData = await res.json();
      if (!orderData.success) {
        setProcessingPayment(false);
        setError(orderData.error || 'Unable to initiate payment gateway order.');
        return;
      }

      // 2. Configure official Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || 'INR',
        name: orderData.merchant_name || 'RiderXO Mobility',
        description: `${selectedDays}-Day Unlimited Pass (0% Platform Commission)`,
        image: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
        order_id: orderData.order_id?.startsWith('order_') && !orderData.order_id.includes('Mock') ? orderData.order_id : undefined,
        prefill: {
          name: driverName,
          contact: driverPhone
        },
        theme: {
          color: '#F59E0B'
        },
        // 3. Real Payment Success Handler (Fired ONLY by Bank Gateway Server)
        handler: async function (response) {
          setProcessingPayment(true);
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/api/drivers/subscription/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                driverId,
                days: selectedDays,
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyRes.json();
            setProcessingPayment(false);

            if (verifyData.success) {
              setSuccessMsg(`🎉 Real Payment of ₹${totalAmount} Verified! ${selectedDays}-Day Pass Activated.`);
              if (onSubscriptionActivated) onSubscriptionActivated(verifyData);
              fetchStatus();
              setTimeout(() => {
                onClose();
              }, 2000);
            } else {
              setError(verifyData.error || 'Payment verification failed with bank.');
            }
          } catch (err) {
            setProcessingPayment(false);
            setError('Error verifying payment with server.');
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          }
        }
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setProcessingPayment(false);
          setError(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
        });
        rzp.open();
      } else {
        setProcessingPayment(false);
        setError('Payment gateway SDK is loading. Please retry.');
      }
    } catch (err) {
      setProcessingPayment(false);
      setError('Connection error initiating payment.');
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(adminUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return 'N/A';
    try {
      const d = new Date(isoDate);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return isoDate;
    }
  };

  const isActive = subData?.is_active && !countdown.isExpired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3 sm:p-4 border-b border-gray-800 bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-yellow/20 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow font-black shadow-md shrink-0">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 leading-tight truncate">
                <span>RiderXO Unlimited Pass</span>
                {isActive ? (
                  <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-black">
                    ● ACTIVE
                  </span>
                ) : (
                  <span className="text-[8px] bg-brand-yellow/20 text-brand-yellow px-1 py-0.2 rounded font-bold">
                    0% Commission
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                {vehicleName} • Keep 100% Ride Fares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition shrink-0 ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center space-y-2.5">
            <Loader2 className="w-7 h-7 text-brand-yellow animate-spin mx-auto" />
            <p className="text-[11px] text-gray-400 font-bold">Loading Pass Status...</p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
            {/* VIEW 1: ACTIVE PASS DASHBOARD WITH TICKING CLOCK */}
            {isActive && !showExtendPayment && (
              <div className="space-y-3 animate-in fade-in">
                {/* Active Hero Banner */}
                <div className="bg-gradient-to-br from-emerald-950/60 via-gray-900 to-gray-900 border border-emerald-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-wider">
                        PASS ACTIVE • 0% COMMISSION
                      </span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                      Keep 100% Fares
                    </span>
                  </div>

                  {/* Live Countdown Clock Display */}
                  <div className="pt-0.5 text-center bg-gray-950/60 border border-gray-800/80 rounded-xl p-2.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      VALIDITY REMAINING
                    </span>
                    <div className="flex items-center justify-center gap-1.5 font-mono">
                      {countdown.days > 0 && (
                        <div className="flex flex-col items-center">
                          <span className="text-xl sm:text-2xl font-black text-brand-yellow">{countdown.days}</span>
                          <span className="text-[7.5px] text-gray-400 uppercase font-bold">Days</span>
                        </div>
                      )}
                      {countdown.days > 0 && <span className="text-lg font-bold text-gray-600">:</span>}
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-black text-white">{String(countdown.hours).padStart(2, '0')}</span>
                        <span className="text-[7.5px] text-gray-400 uppercase font-bold">Hours</span>
                      </div>
                      <span className="text-lg font-bold text-gray-600">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-black text-white">{String(countdown.minutes).padStart(2, '0')}</span>
                        <span className="text-[7.5px] text-gray-400 uppercase font-bold">Mins</span>
                      </div>
                      <span className="text-lg font-bold text-gray-600">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-black text-emerald-400 animate-pulse">{String(countdown.seconds).padStart(2, '0')}</span>
                        <span className="text-[7.5px] text-gray-400 uppercase font-bold">Secs</span>
                      </div>
                    </div>
                  </div>

                  {/* Exact Expiration Timestamp */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-800/80">
                    <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                      <Calendar className="w-3 h-3 text-brand-yellow shrink-0" />
                      <span>Valid Till:</span>
                    </div>
                    <div className="font-bold text-white font-mono text-[10.5px]">
                      {formatExpiryDate(subData?.expires_at)}
                    </div>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-2.5 space-y-1.5 text-[11px]">
                  <div className="font-bold text-gray-300 text-[10px] uppercase tracking-wider">Active Pass Benefits:</div>
                  <div className="flex items-start gap-1.5 text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>0% Platform Commission:</b> Keep 100% customer fares.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Direct Payments:</b> Passengers pay cash or UPI directly to you.</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><b>Unlimited Trips:</b> Accept as many rides as you want today.</span>
                  </div>
                </div>

                {/* Extend Pass Button */}
                <div className="pt-0.5">
                  <button
                    onClick={() => setShowExtendPayment(true)}
                    className="w-full py-2.5 bg-gray-850 hover:bg-gray-800 border border-gray-700 text-brand-yellow font-black text-[11px] sm:text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98 shadow-md"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Extend Pass • Choose Days</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[9.5px] text-gray-500 text-center mt-1">
                    Extending adds days to your current expiry time without losing remaining hours.
                  </p>
                </div>
              </div>
            )}

            {/* VIEW 2: REAL INDUSTRY-STANDARD PAYMENT GATEWAY CHECKOUT */}
            {(!isActive || showExtendPayment) && (
              <div className="space-y-3 animate-in fade-in">
                {showExtendPayment && (
                  <button
                    onClick={() => setShowExtendPayment(false)}
                    className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-bold mb-0.5"
                  >
                    ← Back to Active Pass Status
                  </button>
                )}

                {/* Dynamic Pricing Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">
                      {isActive ? `EXTEND (+${selectedDays} DAYS)` : `${selectedDays}-DAY PASS`}
                    </span>
                    <div className="text-lg sm:text-xl font-black text-white flex items-baseline gap-1">
                      <span>₹{totalAmount}</span>
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({selectedDays === 1 ? '24h' : `${selectedDays}d`} @ ₹{dailyRate}/d)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {currentDiscountPct > 0 ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 inline-block mb-0.5">
                        {currentDiscountPct}% OFF
                      </span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold block">0% Commission</span>
                    )}
                    <span className="text-[10px] font-bold text-gray-300 block">Keep 100% Fares</span>
                  </div>
                </div>

                {/* Multi-Day Duration Selector Chips (1d, 2d, 3d, 5d, 7d, 10d, 20d, 30d) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-brand-yellow" />
                      <span>Choose Pass Duration:</span>
                    </span>
                    <span className="text-[9px] text-gray-500">
                      Tap to select
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {allowedDurations.map((days) => {
                      const isSelected = selectedDays === days;
                      const dPct = Number(packDiscounts[String(days)] || 0);
                      const dRaw = dailyRate * days;
                      const dTotal = Math.max(1, Math.round(dRaw * (1 - dPct / 100)));

                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setSelectedDays(days)}
                          className={`relative py-1.5 px-1 rounded-xl border transition flex flex-col items-center justify-between gap-0.5 shadow-sm active:scale-95 ${
                            isSelected
                              ? 'bg-amber-500/20 border-brand-yellow text-brand-yellow ring-1.5 ring-brand-yellow/40'
                              : 'bg-gray-850 border-gray-800 hover:border-gray-700 text-gray-300'
                          }`}
                        >
                          {dPct > 0 && (
                            <span className="absolute -top-1 -right-0.5 bg-emerald-500 text-gray-950 font-black text-[6.5px] px-1 py-0.2 rounded-full shadow-sm leading-none">
                              {dPct}% OFF
                            </span>
                          )}
                          <span className="text-[10px] font-black leading-tight">
                            {days === 1 ? '1 Day' : `${days}d`}
                          </span>
                          <span className={`text-[9.5px] font-black font-mono leading-none ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                            ₹{dTotal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Success Celebration Banner */}
                {successMsg && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/90 via-gray-900 to-gray-900 border-2 border-emerald-500 text-center space-y-2 animate-in zoom-in-95 shadow-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                    <div className="text-sm font-black text-white">🎉 PAYMENT SUCCESSFUL!</div>
                    <div className="text-[11px] font-bold text-emerald-300">
                      Thank you for making payment of ₹{totalAmount}!
                    </div>
                    <p className="text-[10px] text-gray-300">
                      Your {selectedDays}-Day Unlimited Pass is active. Enjoy 0% commission on all rides!
                    </p>
                  </div>
                )}

                {/* Error Banner */}
                {error && !successMsg && (
                  <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {!successMsg && (
                  <div className="space-y-2.5 pt-0.5">
                    {/* Primary Action: Official Razorpay Payment Gateway (Meesho / Swiggy Model) */}
                    <button
                      onClick={handleOpenRazorpayCheckout}
                      disabled={processingPayment}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-brand-yellow hover:from-amber-600 hover:to-brand-yellowHover text-gray-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-xl shadow-amber-500/20 active:scale-98 transition disabled:opacity-50"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting to Gateway...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-current shrink-0" />
                          <span className="truncate">
                            Pay ₹{totalAmount} • UPI / GPay / PhonePe / QR
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[9.5px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5 text-emerald-400" />
                        <span>RBI 256-Bit Encrypted</span>
                      </span>
                      <span>•</span>
                      <span>Instant Bank Verification</span>
                    </div>

                    {/* Secondary Fallback: Direct Bank UPI Info & QR */}
                    <div className="pt-1.5 border-t border-gray-800">
                      <button
                        type="button"
                        onClick={() => setShowDirectUpi(!showDirectUpi)}
                        className="w-full py-1.5 text-[10.5px] text-gray-400 hover:text-brand-yellow font-bold flex items-center justify-center gap-1 transition"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>{showDirectUpi ? 'Hide Direct Admin QR' : 'Or Direct Admin UPI Settlement'}</span>
                        {showDirectUpi ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showDirectUpi && (
                        <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 text-center space-y-2 mt-1.5 shadow-inner animate-in fade-in">
                          <div className="inline-block p-1.5 bg-white rounded-xl shadow-xl">
                            <img
                              src={qrCodeUrl}
                              alt="Bank UPI QR Code"
                              className="w-36 h-36 sm:w-44 sm:h-44 object-contain rounded-lg mx-auto"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <div className="text-[11px] font-black text-white">{merchantName}</div>
                            <div className="flex items-center justify-center gap-1 text-[10px] text-gray-300 font-mono">
                              <span>Admin UPI: <b className="text-brand-yellow">{adminUpi}</b></span>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="p-1 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded text-gray-300 hover:text-white transition"
                                title="Copy UPI ID"
                              >
                                {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            {copiedUpi && (
                              <p className="text-[9px] text-emerald-400 font-bold">UPI ID Copied!</p>
                            )}
                            <p className="text-[9px] text-gray-400">
                              Amount: <b className="text-white font-mono">₹{totalAmount}</b> for <b className="text-white">{selectedDays} Day{selectedDays > 1 ? 's' : ''}</b>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


