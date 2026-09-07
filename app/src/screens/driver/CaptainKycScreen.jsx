import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Bike,
  FileText,
  CreditCard,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Camera,
  Car,
  Clock,
  XCircle,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  UserCheck,
  Lock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { BACKEND_URL } from '../../context/SocketContext';

export const VEHICLE_TYPES = [
  {
    id: 'bike_lite',
    category: 'BIKE',
    name: 'Bike Lite',
    tag: '100cc • Lite',
    iconSrc: '/vehicles/bike_lite.png',
    fallbackEmoji: '🏍️',
    description: '100-110cc Solo Ride',
    defaultModel: 'Hero Splendor / HF Deluxe'
  },
  {
    id: 'bike',
    category: 'BIKE',
    name: 'Bykneo Bike',
    tag: '125cc • Moto',
    iconSrc: '/vehicles/bike.png',
    fallbackEmoji: '🏍️',
    description: '125cc+ Standard Moto',
    defaultModel: 'Honda Shine 125'
  },
  {
    id: 'auto_lite',
    category: 'AUTO',
    name: 'Auto Lite',
    tag: 'Compact Auto',
    iconSrc: '/vehicles/auto_lite.png',
    fallbackEmoji: '🛺',
    description: 'Compact 3-Seater Auto',
    defaultModel: 'Bajaj Compact Auto'
  },
  {
    id: 'auto',
    category: 'AUTO',
    name: 'Bykneo Auto',
    tag: 'Standard Auto',
    iconSrc: '/vehicles/auto.png',
    fallbackEmoji: '🛺',
    description: 'Standard Auto / EV',
    defaultModel: 'Bajaj Maxima / RE'
  },
  {
    id: 'cab_economy',
    category: 'CAB',
    name: 'Cab Economy',
    tag: 'AC Hatchback',
    iconSrc: '/vehicles/cab_economy.png',
    fallbackEmoji: '🚗',
    description: 'Compact AC Hatchback',
    defaultModel: 'Maruti WagonR / Swift'
  },
  {
    id: 'cab_premium',
    category: 'CAB',
    name: 'Cab Premium',
    tag: 'AC Sedan',
    iconSrc: '/vehicles/cab_premium.png',
    fallbackEmoji: '🚘',
    description: 'Spacious AC Sedan',
    defaultModel: 'Maruti Dzire / Etios'
  }
];

export const CaptainKycScreen = ({ driverProfile, onBack, onKycSubmitted }) => {
  const initialVehicleId =
    driverProfile?.vehicle_id ||
    (driverProfile?.vehicle_category === 'CAB'
      ? 'cab_economy'
      : driverProfile?.vehicle_category === 'AUTO'
      ? 'auto'
      : 'bike');

  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const [vehicleModel, setVehicleModel] = useState(driverProfile?.vehicle_model || 'Honda Shine 125');
  const [vehicleNumber, setVehicleNumber] = useState(driverProfile?.vehicle_number || 'MP 04 AB 4589');
  const [licenseNumber, setLicenseNumber] = useState(driverProfile?.license_number || 'MP-04-2023-0098765');
  const [rcNumber, setRcNumber] = useState(driverProfile?.rc_number || 'RC-MP04-998877');
  const [aadhaarNumber, setAadhaarNumber] = useState(driverProfile?.aadhaar_number || '9876 5432 1098');
  const [payoutUpi, setPayoutUpi] = useState(driverProfile?.payout_upi || `${driverProfile?.phone || '9876543210'}@upi`);

  // Document photo preview states
  const [dlPhoto, setDlPhoto] = useState(driverProfile?.dl_photo || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400');
  const [rcPhoto, setRcPhoto] = useState(driverProfile?.rc_photo || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400');
  const [aadhaarPhoto, setAadhaarPhoto] = useState(driverProfile?.aadhaar_photo || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400');
  const [selfiePhoto, setSelfiePhoto] = useState(driverProfile?.selfie_photo || '');

  // File Input Refs for Real Document Uploads
  const dlFileInputRef = useRef(null);
  const vrcFileInputRef = useRef(null);
  const aadhaarFileInputRef = useRef(null);

  const handleDocumentFileUpload = (setter) => (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Live Camera states & refs (Strict Real-Time Camera Only - Anti Fraud)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' (front selfie camera) | 'environment'
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const kycStatus = driverProfile?.kyc_status || 'unsubmitted';
  const currentVehicle = VEHICLE_TYPES.find((v) => v.id === selectedVehicleId) || VEHICLE_TYPES[1];

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.error('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setIsCameraActive(false);
  };

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

  // Sync stream to video whenever isCameraActive changes or video element renders
  useEffect(() => {
    if (isCameraActive && streamRef.current) {
      bindStreamToVideo(streamRef.current);
    }
  }, [isCameraActive]);

  const startCamera = async (overrideFacing) => {
    setCameraError(null);
    const targetFacing = overrideFacing || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device is required for live selfie verification.');
      }

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
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

      // Attempt immediate binding if video element already mounted
      bindStreamToVideo(stream);
    } catch (err) {
      console.warn('Camera start error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission is required for identity verification. Please allow camera access in your browser.');
      } else {
        setCameraError('Could not open front camera. Please ensure camera is connected and not in use by another app.');
      }
      setIsCameraActive(false);
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const captureSelfie = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (facingMode === 'user') {
      // Mirror horizontally for front-facing selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
    setSelfiePhoto(dataUrl);
    stopCameraStream();
  };

  const handleSelectVehicle = (v) => {
    setSelectedVehicleId(v.id);
    if (!vehicleModel || VEHICLE_TYPES.some((vt) => vt.defaultModel === vehicleModel)) {
      setVehicleModel(v.defaultModel);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selfiePhoto) {
      setStatusMessage({
        type: 'error',
        text: 'Please capture a Live Front Camera Selfie to verify your DL identity before submitting.'
      });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    const activeVehicle = VEHICLE_TYPES.find((v) => v.id === selectedVehicleId) || VEHICLE_TYPES[1];

    try {
      const res = await fetch(`${BACKEND_URL}/api/drivers/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driverProfile?.id,
          vehicle_id: activeVehicle.id,
          vehicle_category: activeVehicle.category,
          vehicle_type_name: activeVehicle.name,
          vehicle_model: vehicleModel,
          vehicle_number: vehicleNumber,
          license_number: licenseNumber,
          rc_number: rcNumber,
          aadhaar_number: aadhaarNumber,
          payout_upi: payoutUpi,
          dl_photo: dlPhoto,
          rc_photo: rcPhoto,
          aadhaar_photo: aadhaarPhoto,
          selfie_photo: selfiePhoto
        })
      });

      const data = await res.json();
      setSubmitting(false);

      if (data.success) {
        if (data.auto_approved) {
          setStatusMessage({
            type: 'success',
            text: '🎉 Real Owner AI Verified! Profile activated instantly. You are now authorized to go ONLINE.'
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: '✅ KYC documents & selfie submitted! Admin review in progress.'
          });
        }
        if (onKycSubmitted) {
          onKycSubmitted(data.driver);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to submit documents. Please try again.'
        });
      }
    } catch (err) {
      setSubmitting(false);
      setStatusMessage({
        type: 'error',
        text: 'Network error. Please check your connection and try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2.5 pb-12 overflow-y-auto">
      <div className="max-w-md mx-auto space-y-2.5">
        {/* Top Header - Compact for Mobile */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={onBack}
            className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-300 hover:text-white active:scale-90 transition shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div>
            <h1 className="text-sm font-black text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
              Captain KYC & Verification
            </h1>
            <p className="text-[9px] text-gray-400">
              Submit government documents to activate your Captain profile
            </p>
          </div>
        </div>

        {/* Current Status Pill - Sleek & Ultra-Compact */}
        <div
          className={`p-2 rounded-xl border flex items-center gap-2 ${
            kycStatus === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : kycStatus === 'pending'
              ? 'bg-amber-500/10 border-brand-yellow/30 text-amber-300'
              : kycStatus === 'rejected'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-gray-900 border-gray-800 text-gray-300'
          }`}
        >
          {kycStatus === 'approved' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : kycStatus === 'pending' ? (
            <Clock className="w-4 h-4 text-brand-yellow shrink-0 animate-pulse" />
          ) : kycStatus === 'rejected' ? (
            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-brand-yellow shrink-0" />
          )}

          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-wider">
              {kycStatus === 'approved'
                ? '✅ KYC Approved & Verified'
                : kycStatus === 'pending'
                ? '⏳ Under Admin Review (10-30 Mins)'
                : kycStatus === 'rejected'
                ? '❌ Verification Rejected'
                : '⚠️ Action Required: Submit KYC'}
            </div>
            <p className="text-[8.5px] opacity-90 leading-tight truncate">
              {kycStatus === 'approved'
                ? 'Authorized to go online & receive rides in active zones.'
                : kycStatus === 'pending'
                ? 'Documents under verification by admin.'
                : kycStatus === 'rejected'
                ? `Reason: ${driverProfile?.kyc_rejection_reason || 'Document mismatch. Please re-upload.'}`
                : 'Upload DL, RC, and Aadhaar to unlock the online toggle.'}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-2 rounded-xl text-[10px] font-bold text-center ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Section 1: Exact 6 Vehicle Categories Selection */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 space-y-2 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-gray-300 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-brand-yellow" />
                1. Select Vehicle Type (6 Options)
              </h3>
              <span className="text-[8.5px] font-bold text-brand-yellow bg-brand-yellow/10 px-1.5 py-0.5 rounded border border-brand-yellow/20">
                {currentVehicle.name}
              </span>
            </div>

            {/* 6 Vehicle Grid: 3 Columns x 2 Rows Ultra-Compact Tabs */}
            <div className="grid grid-cols-3 gap-1.5">
              {VEHICLE_TYPES.map((v) => {
                const isSelected = selectedVehicleId === v.id;
                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={`py-1.5 px-1.5 rounded-lg border text-left transition flex items-center gap-1.5 relative ${
                      isSelected
                        ? 'bg-brand-yellow text-gray-950 border-brand-yellow font-black shadow-sm'
                        : 'bg-gray-850 border-gray-800 text-gray-300 hover:border-gray-700 hover:bg-gray-800/80'
                    }`}
                  >
                    {/* Vehicle Thumbnail */}
                    <div className="w-5 h-4.5 flex items-center justify-center shrink-0">
                      <img
                        src={v.iconSrc}
                        alt={v.name}
                        className="max-h-3.5 max-w-full object-contain filter drop-shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                        }}
                      />
                      <span className="text-xs hidden">{v.fallbackEmoji}</span>
                    </div>

                    {/* Text Details */}
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-black truncate leading-tight">
                        {v.name}
                      </div>
                      <div
                        className={`text-[7px] truncate leading-none mt-0.5 ${
                          isSelected ? 'text-gray-950 font-bold' : 'text-gray-400'
                        }`}
                      >
                        {v.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vehicle Inputs */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-gray-800/80">
              <div>
                <label className="text-[8.5px] font-bold text-gray-400 uppercase block mb-0.5">
                  Vehicle Model / Make
                </label>
                <input
                  type="text"
                  required
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder={`e.g. ${currentVehicle.defaultModel}`}
                  className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[8.5px] font-bold text-gray-400 uppercase block mb-0.5">
                  Plate / VRC Number
                </label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MP 04 AB 1234"
                  className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] font-mono font-bold text-brand-yellow placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Government Documents - 1-Row Horizontal Upload Layout */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 space-y-2 shadow-md">
            <h3 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-brand-yellow" />
              2. Government Documents & KYC
            </h3>

            {/* Hidden File Inputs for Document Uploads */}
            <input
              ref={dlFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDocumentFileUpload(setDlPhoto)}
            />
            <input
              ref={vrcFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDocumentFileUpload(setRcPhoto)}
            />
            <input
              ref={aadhaarFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleDocumentFileUpload(setAadhaarPhoto)}
            />

            {/* Driving License */}
            <div className="bg-gray-850 p-2 rounded-xl border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">Driving License (DL)</span>
                <span className="text-[8.5px] text-emerald-400 font-semibold uppercase">Commercial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="DL Number (e.g. MP-04-2023...)"
                  className="flex-1 min-w-0 bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] font-mono text-white focus:outline-none"
                />
                {dlPhoto && (
                  <img
                    src={dlPhoto}
                    alt="DL"
                    onClick={() => dlFileInputRef.current?.click()}
                    title="Click to replace DL photo"
                    className="w-8 h-7 rounded-md object-cover border border-gray-700 shrink-0 cursor-pointer hover:border-brand-yellow transition"
                  />
                )}
                <button
                  type="button"
                  onClick={() => dlFileInputRef.current?.click()}
                  className="shrink-0 py-1.5 px-2 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-[9px] font-bold text-gray-200 flex items-center gap-1 transition active:scale-95 whitespace-nowrap"
                >
                  <Camera className="w-3 h-3 text-brand-yellow" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Vehicle Registration Certificate (VRC) */}
            <div className="bg-gray-850 p-2 rounded-xl border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">Vehicle Registration Certificate (VRC)</span>
                <span className="text-[8.5px] text-brand-yellow font-semibold uppercase">Ownership</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  value={rcNumber}
                  onChange={(e) => setRcNumber(e.target.value.toUpperCase())}
                  placeholder="VRC Number (e.g. RC-MP04...)"
                  className="flex-1 min-w-0 bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] font-mono text-white focus:outline-none"
                />
                {rcPhoto && (
                  <img
                    src={rcPhoto}
                    alt="VRC"
                    onClick={() => vrcFileInputRef.current?.click()}
                    title="Click to replace VRC photo"
                    className="w-8 h-7 rounded-md object-cover border border-gray-700 shrink-0 cursor-pointer hover:border-brand-yellow transition"
                  />
                )}
                <button
                  type="button"
                  onClick={() => vrcFileInputRef.current?.click()}
                  className="shrink-0 py-1.5 px-2 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-[9px] font-bold text-gray-200 flex items-center gap-1 transition active:scale-95 whitespace-nowrap"
                >
                  <Camera className="w-3 h-3 text-brand-yellow" />
                  <span>Upload</span>
                </button>
              </div>
            </div>

            {/* Aadhaar Card */}
            <div className="bg-gray-850 p-2 rounded-xl border border-gray-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white">Aadhaar Identity Card</span>
                <span className="text-[8.5px] text-blue-400 font-semibold uppercase">ID Proof</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  required
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="12-digit Aadhaar Number"
                  className="flex-1 min-w-0 bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] font-mono text-white focus:outline-none"
                />
                {aadhaarPhoto && (
                  <img
                    src={aadhaarPhoto}
                    alt="Aadhaar"
                    onClick={() => aadhaarFileInputRef.current?.click()}
                    title="Click to replace Aadhaar photo"
                    className="w-8 h-7 rounded-md object-cover border border-gray-700 shrink-0 cursor-pointer hover:border-brand-yellow transition"
                  />
                )}
                <button
                  type="button"
                  onClick={() => aadhaarFileInputRef.current?.click()}
                  className="shrink-0 py-1.5 px-2 bg-gray-800 hover:bg-gray-750 rounded-lg border border-gray-700 text-[9px] font-bold text-gray-200 flex items-center gap-1 transition active:scale-95 whitespace-nowrap"
                >
                  <Camera className="w-3 h-3 text-brand-yellow" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Live Front-Camera Selfie (Real Driver Identity Verification) */}
          <div className="bg-gray-900 border border-brand-yellow/30 rounded-xl p-2.5 space-y-2 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-brand-yellow flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-yellow animate-spin-slow" />
                3. Live Front Selfie (DL Face-Match)
              </h3>
              <span className="text-[8px] font-black uppercase bg-brand-yellow/15 text-brand-yellow px-1.5 py-0.5 rounded border border-brand-yellow/30">
                Anti-Fraud Check
              </span>
            </div>

            <p className="text-[8.5px] text-gray-400 leading-tight">
              Take a live front-camera selfie to verify that you are the real registered owner of this Driving License.
            </p>

            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Viewfinder Mode */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black border-2 border-brand-yellow p-1 space-y-2">
                <div className="relative w-full h-56 bg-black rounded-lg overflow-hidden flex items-center justify-center">
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
                    <div className="w-28 h-36 border-2 border-dashed border-brand-yellow/80 rounded-[50%] animate-pulse shadow-lg" />
                    <span className="text-[8px] font-black bg-gray-950/80 text-brand-yellow px-2 py-0.5 rounded-full mt-1.5 border border-brand-yellow/40">
                      Center Face in Oval
                    </span>
                  </div>

                  {/* Switch Camera Button (Front / Back) */}
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800 text-white p-1.5 rounded-lg border border-gray-700 backdrop-blur-sm active:scale-95 transition flex items-center gap-1 text-[9px] font-bold"
                    title="Flip camera"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Flip</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={captureSelfie}
                    className="flex-1 py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
                  >
                    <Camera className="w-3.5 h-3.5 fill-current" />
                    <span>Capture Live Selfie</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="py-2.5 px-3 bg-gray-800 hover:bg-gray-750 text-gray-300 font-bold text-[10px] rounded-lg border border-gray-700 active:scale-95 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : selfiePhoto ? (
              /* Selfie Captured - Side by Side Comparison Preview */
              <div className="bg-gray-850 p-2 rounded-xl border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-black text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Real-Time Selfie Face Captured
                  </span>
                  <button
                    type="button"
                    onClick={() => startCamera('user')}
                    className="text-[8.5px] font-bold text-brand-yellow hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    Retake Live Selfie
                  </button>
                </div>

                {/* DL vs Selfie Face Comparison Card */}
                <div className="grid grid-cols-2 gap-2 bg-gray-950/80 p-2 rounded-lg border border-gray-800">
                  <div className="text-center space-y-1">
                    <span className="text-[7.5px] font-bold text-emerald-400 block uppercase">1. Live Driver Face</span>
                    <img
                      src={selfiePhoto}
                      alt="Live Selfie"
                      className="w-full h-20 object-cover rounded-lg border border-emerald-500/50 shadow-sm"
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <span className="text-[7.5px] font-bold text-brand-yellow block uppercase">2. DL Document Face</span>
                    <img
                      src={dlPhoto}
                      alt="DL Photo"
                      className="w-full h-20 object-cover rounded-lg border border-brand-yellow/50 shadow-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[8px] text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-800">
                  <ShieldCheck className="w-3 h-3 text-brand-yellow shrink-0" />
                  <span>Real-time front camera verified: Driver physically matches DL photo.</span>
                </div>
              </div>
            ) : (
              /* Prompt to Capture Live Selfie - Strict Real Time Front Camera */
              <div className="bg-gray-850 p-3 rounded-xl border border-dashed border-brand-yellow/40 space-y-2.5 text-center">
                <div className="flex flex-col items-center justify-center py-1">
                  <div className="w-11 h-11 rounded-full bg-brand-yellow/10 border border-brand-yellow/30 flex items-center justify-center text-brand-yellow mb-1.5">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-black text-white">Live Front Camera Face Check</div>
                  <div className="text-[9px] text-gray-400 max-w-xs leading-tight">
                    Must be captured live with your front camera to confirm you are the genuine Driving License owner. (Saved gallery photos not allowed).
                  </div>
                </div>

                {cameraError && (
                  <div className="text-[8.5px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/30 flex items-center gap-1.5 text-left">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => startCamera('user')}
                  className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-[11px] rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <Camera className="w-4 h-4 fill-current" />
                  <span>Open Front Camera for Live Selfie</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 4: Daily Earnings Payout Account */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-2.5 space-y-1.5 shadow-md">
            <h3 className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-brand-yellow" />
              4. Direct Earnings Payout (UPI / Bank)
            </h3>

            <div>
              <input
                type="text"
                required
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value)}
                placeholder="UPI ID (e.g. 9876543210@paytm)"
                className="w-full bg-gray-950 border border-gray-800 focus:border-brand-yellow rounded-lg py-1.5 px-2 text-[10px] text-brand-yellow font-bold placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg shadow-brand-yellow/20 active:scale-[0.98] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            {submitting ? 'Submitting Documents & Selfie...' : 'SUBMIT DOCUMENTS FOR VERIFICATION'}
          </button>
        </form>
      </div>
    </div>
  );
};
