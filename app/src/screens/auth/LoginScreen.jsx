import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { compressImage } from '../../utils/imageOptimizer';
import {
  Bike,
  ShieldCheck,
  UserCheck,
  Smartphone,
  ArrowRight,
  Zap,
  KeyRound,
  ChevronLeft,
  CheckCircle2,
  Car,
  FileText,
  Sparkles,
  RefreshCw,
  Edit2,
  Camera,
  Upload,
  Clock,
  AlertTriangle,
  Lock,
  Check,
  XCircle,
  Download
} from 'lucide-react';
import { isNativeApp } from '../../utils/nativeLocation.js';

const VEHICLE_CATEGORIES = [
  { id: 'bike_lite', category: 'BIKE', name: 'Bike Lite', tag: '100cc • Lite', defaultModel: 'Hero Splendor / HF Deluxe', icon: Bike },
  { id: 'bike', category: 'BIKE', name: 'Bykneo Bike', tag: '125cc • Moto', defaultModel: 'Honda Shine 125', icon: Bike },
  { id: 'auto', category: 'AUTO', name: 'Auto Rickshaw', tag: '3-Seater Auto', defaultModel: 'Bajaj Compact / Maxima', icon: Car },
  { id: 'cab_economy', category: 'CAB', name: 'Cab Economy', tag: 'AC Hatchback', defaultModel: 'Maruti WagonR / Swift', icon: Car }
];

export const LoginScreen = () => {
  const { sendOtp, resendOtp, verifyOtp, completeProfile, loginWithPhone, setDriverProfile } = useAuth();
  const { socket } = useSocket();

  // Step state: 'phone' | 'otp' | 'details' | 'pending_kyc' | 'rejected_kyc'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState('passenger'); // 'passenger' | 'driver'
  
  // 6-digit OTP state
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // KYC Rejection Reason state
  const [rejectionReason, setRejectionReason] = useState('');

  // Registration details state (Step 3)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    vehicle_id: 'bike',
    vehicle_category: 'BIKE',
    vehicle_type_name: 'Bykneo Bike',
    vehicle_model: 'Honda Shine 125',
    vehicle_number: '',
    license_number: '',
    rc_number: '',
    aadhaar_number: '',
    payout_upi: '',
    dl_photo: '',
    rc_photo: '',
    aadhaar_photo: '',
    selfie_photo: ''
  });

  // Live selfie camera state for Captain KYC
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front camera) | 'environment' (rear camera)
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const bindStreamToVideo = (stream) => {
    if (videoRef.current && stream) {
      try {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((e) => console.log('Video play error on metadata:', e));
        };
        videoRef.current.play().catch((e) => console.log('Video play direct error:', e));
      } catch (err) {
        console.error('Error binding stream to video element:', err);
      }
    }
  };

  // Sync stream to video whenever isCameraActive changes
  useEffect(() => {
    if (isCameraActive && streamRef.current) {
      bindStreamToVideo(streamRef.current);
    }
  }, [isCameraActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
      }
    };
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpInputRefs = useRef([]);

  // Timer countdown for Resend OTP
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // Auto focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Listen for real-time KYC Approval while on 'pending_kyc' screen
  useEffect(() => {
    if (!socket || (step !== 'pending_kyc' && step !== 'rejected_kyc')) return;

    const handleKycUpdate = ({ status, rejectionReason: reason, driver }) => {
      console.log('🛡️ Received real-time KYC update:', status);
      if (status === 'approved') {
        setSuccessMsg('🎉 KYC Approved by Admin! Loading Captain Dashboard...');
        if (driver) setDriverProfile(driver);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (status === 'rejected') {
        setRejectionReason(reason || 'Documents could not be verified. Please re-upload clear photos.');
        setStep('rejected_kyc');
      }
    };

    socket.on('driver:kyc_status_updated', handleKycUpdate);
    return () => {
      socket.off('driver:kyc_status_updated', handleKycUpdate);
    };
  }, [socket, step, setDriverProfile]);

  // Direct APK Download Handler (triggered only on manual click)
  const handleDownloadApk = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const link = document.createElement('a');
    link.href = '/bykneo.apk';
    link.setAttribute('download', 'bykneo.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle individual 6-digit OTP input changes
  const handleOtpChange = (index, value) => {
    const sanitized = value.replace(/\D/g, '');
    if (!sanitized && value !== '') return;

    const newValues = [...otpValues];
    // Handle pasted full 6-digit code
    if (sanitized.length > 1) {
      const pastedDigits = sanitized.slice(0, 6).split('');
      pastedDigits.forEach((digit, i) => {
        if (i < 6) newValues[i] = digit;
      });
      setOtpValues(newValues);
      setError('');
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();

      if (newValues.every((d) => d !== '')) {
        submitOtp(newValues.join(''));
      }
      return;
    }

    newValues[index] = sanitized;
    setOtpValues(newValues);
    setError('');

    if (sanitized && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto submit when all 6 digits are filled
    if (newValues.every((d) => d !== '')) {
      submitOtp(newValues.join(''));
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // STEP 1: Handle Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setLoading(true);
    const res = await sendOtp(phone, selectedRole);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setOtpValues(['', '', '', '', '', '']);
      setTimer(30);
      setCanResend(false);
      setSuccessMsg(res.message || '6-digit OTP sent successfully via SMS!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError(res.error || 'Failed to send OTP. Please check your internet connection.');
    }
  };

  // STEP 1.5: Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);
    const res = await resendOtp(phone);
    setLoading(false);

    if (res.success) {
      setTimer(30);
      setCanResend(false);
      setSuccessMsg('New 6-digit OTP sent to your phone!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setError(res.error || 'Failed to resend OTP');
    }
  };

  // STEP 2: Handle Verify OTP
  const submitOtp = async (codeToVerify) => {
    const fullCode = codeToVerify || otpValues.join('');
    if (!fullCode || fullCode.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);
    const res = await verifyOtp(phone, fullCode, selectedRole);
    setLoading(false);

    if (res.success) {
      if (res.isNewUser) {
        // Direct new user to fill their details & KYC
        setStep('details');
        setFormData((prev) => ({
          ...prev,
          name: res.existingDriver?.name || '',
          email: '',
          vehicle_id: res.existingDriver?.vehicle_id || 'bike',
          vehicle_category: res.existingDriver?.vehicle_category || 'BIKE',
          vehicle_model: res.existingDriver?.vehicle_model || (selectedRole === 'driver' ? 'Honda Shine 125' : ''),
          vehicle_number: res.existingDriver?.vehicle_number || '',
          license_number: res.existingDriver?.license_number || '',
          rc_number: res.existingDriver?.rc_number || '',
          aadhaar_number: res.existingDriver?.aadhaar_number || ''
        }));
      } else {
        // For Captain: Check KYC Status
        if (selectedRole === 'driver') {
          if (res.kycStatus === 'rejected') {
            setRejectionReason(res.kycRejectionReason || 'Admin rejected previous submission. Please re-upload clear photos.');
            if (res.driverProfile) {
              setFormData((prev) => ({
                ...prev,
                ...res.driverProfile
              }));
            }
            setStep('rejected_kyc');
          } else if (res.kycStatus === 'pending') {
            if (res.driverProfile) {
              setFormData((prev) => ({
                ...prev,
                ...res.driverProfile
              }));
            }
            setStep('pending_kyc');
          }
        }
      }
    } else {
      setError(res.error || 'Invalid OTP code. Please try again.');
    }
  };

  // Live Camera Controls for Live Selfie (Anti Fraud DL Verification)
  const startCamera = async (overrideFacing) => {
    setError('');
    const targetFacing = overrideFacing || facingMode;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera not supported on this browser or insecure origin. You can also upload a photo below.');
        return;
      }

      // Stop any existing stream first
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        streamRef.current = null;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: targetFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (constraintErr) {
        console.warn('Strict constraints failed, falling back to basic camera request:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Bind immediately or on next frame
      setTimeout(() => {
        bindStreamToVideo(stream);
      }, 50);
    } catch (e) {
      console.warn('Camera error:', e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please allow camera access in your browser or upload a photo below.');
      } else {
        setError('Camera unavailable. You can upload a photo below.');
      }
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureSelfie = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    try {
      const compressed = await compressImage(dataUrl, 800, 800, 0.75);
      setFormData((prev) => ({ ...prev, selfie_photo: compressed || dataUrl }));
    } catch (e) {
      setFormData((prev) => ({ ...prev, selfie_photo: dataUrl }));
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (field, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      if (compressed) {
        setFormData((prev) => ({ ...prev, [field]: compressed }));
      }
    } catch (err) {
      console.error('File compression error:', err);
    }
  };

  // STEP 3: Complete Profile & Submit KYC
  const handleCompleteProfile = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }

    if (selectedRole === 'driver') {
      if (!formData.vehicle_model?.trim()) {
        setError('Please enter vehicle model');
        return;
      }
      if (!formData.vehicle_number?.trim() || formData.vehicle_number.trim().length < 4) {
        setError('Please enter vehicle plate number (e.g. DL 01 AB 1234)');
        return;
      }
      if (!formData.license_number?.trim() || formData.license_number.trim().length < 4) {
        setError('Please enter your driving license number');
        return;
      }
      if (!formData.aadhaar_number?.trim() || formData.aadhaar_number.trim().length < 4) {
        setError('Please enter your Aadhaar card number');
        return;
      }
    }

    setError('');
    setLoading(true);

    const activeVeh = VEHICLE_CATEGORIES.find((v) => v.id === formData.vehicle_id) || VEHICLE_CATEGORIES[1];

    try {
      const [optDl, optRc, optAadhaar, optSelfie] = await Promise.all([
        compressImage(formData.dl_photo, 900, 900, 0.75),
        compressImage(formData.rc_photo, 900, 900, 0.75),
        compressImage(formData.aadhaar_photo, 900, 900, 0.75),
        compressImage(formData.selfie_photo, 800, 800, 0.75)
      ]);

      const res = await completeProfile({
        phone,
        role: selectedRole,
        ...formData,
        dl_photo: optDl || formData.dl_photo,
        rc_photo: optRc || formData.rc_photo,
        aadhaar_photo: optAadhaar || formData.aadhaar_photo,
        selfie_photo: optSelfie || formData.selfie_photo,
        vehicle_id: activeVeh.id,
        vehicle_category: activeVeh.category,
        vehicle_type_name: activeVeh.name
      });
      setLoading(false);

      if (res.success) {
        if (selectedRole === 'driver') {
          if (res.driverProfile?.kyc_status === 'pending') {
            setStep('pending_kyc');
          }
        }
      } else {
        setError(res.error || 'Failed to save details. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Network error. Please check your connection and try again.');
    }
  };

  // Quick 1-Click Demo Accounts Handler
  const handleQuickDemo = async (demoPhone, demoRole) => {
    setError('');
    setLoading(true);
    await loginWithPhone(demoPhone, demoRole);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-4 max-w-md mx-auto relative overflow-x-hidden">
      {/* Background Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand-yellow/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="pt-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full shadow-lg">
            <Zap className="w-3.5 h-3.5 text-brand-yellow" />
            <span className="text-xs font-semibold text-gray-300">Fast Urban Bike Mobility</span>
          </div>

          {step !== 'phone' && step !== 'pending_kyc' && step !== 'rejected_kyc' && (
            <button
              onClick={() => {
                setError('');
                if (step === 'details') setStep('otp');
                else setStep('phone');
              }}
              className="px-2.5 py-1.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-xl text-xs text-gray-300 flex items-center gap-1 active:scale-95 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2 mt-3">
          BYK<span className="text-brand-yellow">NEO</span>
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Fastest bike rides & instant daily commuting.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-3 relative z-10">
        {/* ======================================================== */}
        {/* STEP 1: MOBILE NUMBER & ROLE SELECTION */}
        {/* ======================================================== */}
        {step === 'phone' && (
          <div className="animate-in fade-in duration-200">
            {/* Role Selector Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1.5 rounded-2xl border border-gray-800 mb-4">
              <button
                type="button"
                onClick={() => setSelectedRole('passenger')}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedRole === 'passenger'
                    ? 'bg-brand-yellow text-gray-950 shadow-lg font-black'
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
                    ? 'bg-brand-yellow text-gray-950 shadow-lg font-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Bike className="w-4 h-4" />
                Captain (Driver)
              </button>
            </div>

            {/* Mobile Form */}
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Enter Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <span className="text-sm font-bold text-brand-yellow">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    maxLength={14}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full bg-gray-900 border border-gray-800 focus:border-brand-yellow rounded-2xl py-3.5 pl-14 pr-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow font-bold tracking-wide transition"
                  />
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl animate-in fade-in duration-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 transition active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Sending 6-Digit OTP...' : `Continue as ${selectedRole === 'driver' ? 'Captain' : 'Rider'}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="mt-7 pt-4 border-t border-gray-850">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">
                🚀 Quick 1-Click Demo Accounts
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('+91 9876543210', 'passenger')}
                  className="p-3 bg-gray-900/80 hover:bg-gray-850 border border-gray-800 rounded-xl text-left transition flex flex-col justify-between active:scale-95"
                >
                  <div className="text-xs font-bold text-white">Rahul (Rider)</div>
                  <div className="text-[10px] text-gray-400 mt-1">Book rides & live track</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('+91 9123456780', 'driver')}
                  className="p-3 bg-gray-900/80 hover:bg-gray-850 border border-gray-800 rounded-xl text-left transition flex flex-col justify-between active:scale-95"
                >
                  <div className="text-xs font-bold text-brand-yellow">Vikram (Captain)</div>
                  <div className="text-[10px] text-gray-400 mt-1">Accept rides & earn</div>
                </button>
              </div>
            </div>

            {/* Direct Android APK Download Button (Compact Card Style) */}
            {!isNativeApp() && (
              <div className="mt-3 pt-2.5 border-t border-gray-850 flex justify-center">
                <a
                  href="/bykneo.apk"
                  download="bykneo.apk"
                  onClick={handleDownloadApk}
                  className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-950/60 via-emerald-900/40 to-emerald-950/60 hover:from-emerald-900/60 hover:to-emerald-850/50 border border-emerald-500/40 hover:border-emerald-400 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Download now
                  </span>
                  <div className="w-5 h-5 rounded-md bg-emerald-500 text-gray-950 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-400 transition-colors shrink-0">
                    <Download className="w-3 h-3" />
                  </div>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {/* ======================================================== */}
        {step === 'otp' && (
          <div className="animate-in fade-in slide-in-from-right duration-200 space-y-4">
            <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow">
                  <KeyRound className="w-5 h-5" />
                </div>
                <button
                  onClick={() => {
                    setStep('phone');
                    setError('');
                  }}
                  className="text-xs text-brand-yellow flex items-center gap-1 hover:underline font-bold"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit Number
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Verify 6-Digit OTP</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter the 6-digit code sent via MSG91 to{' '}
                  <span className="text-brand-yellow font-bold">+91 {phone.replace(/\D/g, '')}</span>
                </p>
              </div>

              {successMsg && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* 6 Individual OTP Boxes */}
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-6 gap-2">
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`h-14 text-center text-xl font-black rounded-2xl bg-gray-950 border transition focus:outline-none ${
                        digit
                          ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/5'
                          : 'border-gray-800 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow'
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => submitOtp()}
                  disabled={loading || otpValues.some((d) => !d)}
                  className="w-full bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Verifying OTP...' : 'Verify & Continue'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Resend Timer & Button */}
              <div className="pt-2 flex items-center justify-between text-xs text-gray-400 border-t border-gray-850">
                <span>Didn't receive SMS?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-brand-yellow font-bold flex items-center gap-1 hover:underline active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-500 font-medium">Resend in {timer}s</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3A: NEW RIDER REGISTRATION FORM */}
        {/* ======================================================== */}
        {step === 'details' && selectedRole === 'passenger' && (
          <div className="animate-in fade-in slide-in-from-right duration-200 space-y-4">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Complete Rider Profile</h3>
                  <p className="text-[11px] text-gray-400">Enter your name to start booking rides</p>
                </div>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-3.5 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-3 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-3 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  />
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Saving Profile...' : 'Save & Enter Rider Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3B: FULL CAPTAIN KYC & VEHICLE REGISTRATION */}
        {/* ======================================================== */}
        {step === 'details' && selectedRole === 'driver' && (
          <div className="animate-in fade-in slide-in-from-right duration-200 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow font-black">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Captain Registration & KYC</h3>
                  <p className="text-[11px] text-gray-400">Fill vehicle & identity details for verification</p>
                </div>
              </div>

              <form onSubmit={handleCompleteProfile} className="space-y-3.5 pt-1">
                {/* Full Name & Email */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Captain Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  />
                </div>

                {/* Vehicle Category Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">
                    Vehicle Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_CATEGORIES.map((v) => {
                      const IconComp = v.icon;
                      const isSelected = formData.vehicle_id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              vehicle_id: v.id,
                              vehicle_category: v.category,
                              vehicle_type_name: v.name,
                              vehicle_model: v.defaultModel
                            })
                          }
                          className={`py-2 px-2.5 rounded-xl border text-left transition ${
                            isSelected
                              ? 'bg-brand-yellow text-gray-950 border-brand-yellow shadow-md'
                              : 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <IconComp className="w-3.5 h-3.5" />
                            {v.name}
                          </div>
                          <div className="text-[9px] mt-0.5 opacity-80">{v.tag}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Model & Number */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Vehicle Model *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                      placeholder="Honda Shine"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Plate No. (RC) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vehicle_number}
                      onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                      placeholder="DL 01 AB 1234"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow uppercase font-bold"
                    />
                  </div>
                </div>

                {/* DL & Aadhaar Numbers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      DL Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })}
                      placeholder="DL-14202..."
                      className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      Aadhaar No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
                      placeholder="XXXX XXXX 1234"
                      className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    />
                  </div>
                </div>

                {/* Live Driver Selfie Photo Capture / Upload */}
                <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-brand-yellow flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Live Driver Selfie Photo
                    </span>
                    {formData.selfie_photo && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-3 h-3" /> Attached
                      </span>
                    )}
                  </div>

                  {isCameraActive ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden border-2 border-brand-yellow flex items-center justify-center shadow-lg">
                        <video
                          ref={(el) => {
                            videoRef.current = el;
                            if (el && streamRef.current && el.srcObject !== streamRef.current) {
                              el.srcObject = streamRef.current;
                              el.onloadedmetadata = () => {
                                el.play().catch((e) => console.log('ref metadata play error:', e));
                              };
                              el.play().catch((e) => console.log('ref play error:', e));
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${
                            facingMode === 'user' ? 'transform -scale-x-100' : ''
                          }`}
                        />
                        {/* Oval Face Guide Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <div className="w-24 h-32 border-2 border-dashed border-brand-yellow/80 rounded-[50%] animate-pulse shadow-md" />
                          <span className="text-[8px] font-black bg-gray-950/80 text-brand-yellow px-2 py-0.5 rounded-full mt-1 border border-brand-yellow/40">
                            Center Face in Oval
                          </span>
                        </div>
                        {/* Flip Camera Button */}
                        <button
                          type="button"
                          onClick={toggleFacingMode}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white p-1.5 rounded-lg border border-gray-700 backdrop-blur-sm active:scale-95 transition flex items-center gap-1 text-[9px] font-bold"
                          title="Flip camera"
                        >
                          <RefreshCw className="w-3 h-3 text-brand-yellow" />
                          <span>Flip</span>
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={captureSelfie}
                          className="flex-1 py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
                        >
                          <Camera className="w-3.5 h-3.5 fill-current" /> Snap Photo
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-xs rounded-xl border border-gray-700 active:scale-95 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : formData.selfie_photo ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={formData.selfie_photo}
                        alt="Selfie"
                        className="w-14 h-14 rounded-xl object-cover border border-brand-yellow"
                      />
                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-xs text-brand-yellow hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Retake Selfie
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5 text-brand-yellow" /> Open Front Camera
                      </button>
                      <label className="px-3 py-2 bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1">
                        <Upload className="w-3.5 h-3.5" /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('selfie_photo', e)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* DL & RC Photos upload */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl cursor-pointer hover:border-brand-yellow transition text-center block">
                    <div className="text-[10px] font-bold text-gray-300">
                      {formData.dl_photo ? '✅ DL Photo Attached' : '📄 DL Photo (Front)'}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">Click to upload</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('dl_photo', e)}
                    />
                  </label>

                  <label className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl cursor-pointer hover:border-brand-yellow transition text-center block">
                    <div className="text-[10px] font-bold text-gray-300">
                      {formData.rc_photo ? '✅ RC Photo Attached' : '📄 Vehicle RC Photo'}
                    </div>
                    <div className="text-[9px] text-gray-500 mt-0.5">Click to upload</div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload('rc_photo', e)}
                    />
                  </label>
                </div>

                {error && (
                  <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/10 transition active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'Submitting KYC...' : 'Submit Details for Verification'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4A: CAPTAIN KYC REJECTED SCREEN */}
        {/* ======================================================== */}
        {step === 'rejected_kyc' && (
          <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4 text-center">
            <div className="bg-gray-900/95 border-2 border-red-500/60 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 mx-auto shadow-xl">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold mb-2">
                  ❌ Verification Rejected
                </span>
                <h3 className="text-lg font-black text-white">Action Required on Documents</h3>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  The Admin reviewed your application and requested updates before approving your Captain account.
                </p>
              </div>

              {/* Admin Feedback Box */}
              <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-2xl text-left space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                  Admin Feedback & Reason:
                </div>
                <div className="text-xs font-bold text-white leading-relaxed">
                  "{rejectionReason || 'Please upload clear photos of your Driving License and Vehicle RC.'}"
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('details');
                }}
                className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" /> Update & Re-Submit Documents
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtpValues(['', '', '', '', '', '']);
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-xs rounded-xl transition"
              >
                Back to Login / Switch Role
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4B: CAPTAIN KYC UNDER REVIEW / PENDING SCREEN */}
        {/* ======================================================== */}
        {step === 'pending_kyc' && (
          <div className="animate-in fade-in zoom-in-95 duration-200 space-y-4 text-center">
            <div className="bg-gray-900/95 border border-brand-yellow/40 rounded-3xl p-6 space-y-4 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-brand-yellow/15 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow mx-auto shadow-xl">
                <Clock className="w-8 h-8 animate-pulse text-brand-yellow" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold mb-2">
                  ⏳ Verification In Progress
                </span>
                <h3 className="text-lg font-black text-white">Documents Under Review</h3>
                <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                  Your Captain profile and vehicle documents have been submitted to Bykneo Admin for verification.
                </p>
              </div>

              <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Registered Mobile:</span>
                  <span className="font-bold text-white">+91 {phone.replace(/\D/g, '')}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Captain Name:</span>
                  <span className="font-bold text-brand-yellow">{formData.name || 'Bykneo Captain'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Vehicle Model:</span>
                  <span className="font-bold text-white">{formData.vehicle_model || 'Standard Bike'}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Plate Number:</span>
                  <span className="font-bold text-white">{formData.vehicle_number || 'Under Verification'}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400">
                ⚡ As soon as the Admin approves your profile, this screen will automatically unlock your dashboard!
              </p>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtpValues(['', '', '', '', '', '']);
                }}
                className="w-full py-3 bg-gray-800 hover:bg-gray-750 text-gray-200 font-bold text-xs rounded-xl transition"
              >
                Back to Home / Switch Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-gray-500 pb-2 relative z-10">
        By continuing, you agree to Bykneo's Terms & Privacy Policy.
      </div>
    </div>
  );
};

export default LoginScreen;
