import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Smartphone, KeyRound, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export function AdminLoginGate({ onLoginSuccess, BACKEND_URL }) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Forgot PIN / SMS OTP state
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
  const [otpCode, setOtpCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');

  const pinInputRef = useRef(null);

  useEffect(() => {
    if (pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [showForgotModal]);

  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => setOtpTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMessage('Please enter your 4-digit Admin PIN');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const tryFetch = async (endpoint, options) => {
      const urls = [
        `${BACKEND_URL}${endpoint}`,
        `http://localhost:5000${endpoint}`,
        `http://${window.location.hostname}:5000${endpoint}`
      ];
      let lastErr = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, options);
          return res;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    };

    try {
      const res = await tryFetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('riderxo_admin_token', data.token || 'rx_admin_auth');
        onLoginSuccess();
      } else {
        setErrorMessage(data.error || 'Incorrect Admin PIN. Please check and retry.');
        setPin('');
      }
    } catch (err) {
      setErrorMessage('Failed to connect to backend server. Please verify backend is running on port 5000.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    setOtpMessage('');

    const tryFetch = async (endpoint, options) => {
      const urls = [
        `${BACKEND_URL}${endpoint}`,
        `http://localhost:5000${endpoint}`,
        `http://${window.location.hostname}:5000${endpoint}`
      ];
      let lastErr = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, options);
          return res;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    };

    try {
      const res = await tryFetch('/api/admin/send-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setOtpStep('verify');
        setOtpTimer(60);
        setOtpMessage(data.message || 'OTP sent to registered owner phone (+91 79747 04918)');
      } else {
        setOtpError(data.error || 'Failed to dispatch SMS OTP. Please try again.');
      }
    } catch (err) {
      setOtpError('Network error connecting to SMS service. Please verify backend is active.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyResetOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Please enter the 6-digit SMS OTP code.');
      return;
    }

    if (newPin && newPin.length < 4) {
      setOtpError('New PIN must be at least 4 digits.');
      return;
    }

    if (newPin && confirmPin && newPin !== confirmPin) {
      setOtpError('PIN and Confirmation do not match.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    const tryFetch = async (endpoint, options) => {
      const urls = [
        `${BACKEND_URL}${endpoint}`,
        `http://localhost:5000${endpoint}`,
        `http://${window.location.hostname}:5000${endpoint}`
      ];
      let lastErr = null;
      for (const u of urls) {
        try {
          const res = await fetch(u, options);
          return res;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    };

    try {
      const res = await tryFetch('/api/admin/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: otpCode.trim(),
          newPin: newPin ? newPin.trim() : undefined
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('riderxo_admin_token', data.token || 'rx_admin_auth');
        setShowForgotModal(false);
        onLoginSuccess();
      } else {
        setOtpError(data.error || 'Invalid OTP code entered. Please try again.');
      }
    } catch (err) {
      setOtpError('Server connection error. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-yellow-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {!showForgotModal ? (
          /* Normal PIN Login Box */
          <div className="bg-gray-900/90 border border-gray-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-gray-950 shadow-xl shadow-amber-500/20 mb-4 transform hover:scale-105 transition">
                <Shield className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-2xl font-black tracking-tight">
                <span>RIDER</span>
                <span className="text-amber-400">XO</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-400 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold uppercase ml-1">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Restricted Operations & Fleet Control Panel
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 text-center">
                  Enter Security PIN
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    ref={pinInputRef}
                    type="password"
                    maxLength={8}
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="••••"
                    className="w-full bg-gray-950/80 border border-gray-800 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 rounded-2xl py-3.5 pl-11 pr-4 text-center text-2xl tracking-[0.4em] font-mono font-bold text-white placeholder-gray-600 transition outline-none"
                    autoFocus
                  />
                </div>

                {errorMessage && (
                  <div className="mt-3 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium animate-in shake duration-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 hover:shadow-amber-400/30 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Forgot PIN / SMS OTP Option */}
            <div className="mt-6 pt-5 border-t border-gray-800/80 flex items-center justify-between text-xs">
              <span className="text-gray-500">Forgot your PIN?</span>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setOtpStep('request');
                  setOtpError('');
                  setOtpMessage('');
                }}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition underline-offset-4 hover:underline"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Recover via SMS OTP</span>
              </button>
            </div>
          </div>
        ) : (
          /* Forgot PIN / SMS Recovery Modal */
          <div className="bg-gray-900/95 border border-gray-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/90 text-white animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-800">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white transition flex items-center justify-center"
                title="Back to PIN entry"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-center font-bold text-sm text-white">
                Admin SMS OTP Recovery
              </div>
              <div className="w-8" />
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 mb-3">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Owner Mobile Verification</h3>
              <p className="text-xs text-gray-400 mt-1">
                Security OTP will be sent directly to registered owner number:
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-gray-950 border border-amber-400/30 rounded-xl font-mono text-sm font-black text-amber-400 tracking-wider">
                +91 79747 04918
              </div>
            </div>

            {otpStep === 'request' ? (
              <div className="space-y-4">
                {otpError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSendResetOtp}
                  disabled={otpLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending SMS OTP...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      <span>Send 6-Digit SMS OTP</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyResetOtp} className="space-y-4">
                {otpMessage && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{otpMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl py-2.5 px-3 text-center text-xl tracking-[0.3em] font-mono font-bold text-white outline-none"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Set New PIN (Optional)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="e.g. 1234"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl py-2 px-3 text-sm font-mono text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                      Confirm PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="Confirm"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-amber-400 rounded-xl py-2 px-3 text-sm font-mono text-white outline-none"
                    />
                  </div>
                </div>

                {otpError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Didn't get code?</span>
                  {otpTimer > 0 ? (
                    <span className="text-amber-400 font-mono font-bold">Resend in {otpTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendResetOtp}
                      disabled={otpLoading}
                      className="text-amber-400 hover:text-amber-300 font-bold underline"
                    >
                      Resend SMS OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-gray-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-400/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verify & Unlock Dashboard</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
