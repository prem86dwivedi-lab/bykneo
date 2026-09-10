import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, BACKEND_URL } from '../../context/SocketContext';
import { Power, Radio, DollarSign, Bike, ShieldCheck, Zap, Navigation, MapPin, X, AlertTriangle, Sparkles, QrCode, Clock } from 'lucide-react';
import { DriverSubscriptionModal } from '../../components/DriverSubscriptionModal';

export const DriverHomeScreen = ({
  isOnline,
  onToggleOnline,
  activeRide,
  driverLocation,
  setDriverLocation,
  zoneStatus,
  onOpenKyc
}) => {
  const { user, driverProfile } = useAuth();
  const { socket } = useSocket();
  const [todayEarnings, setTodayEarnings] = useState(
    Math.round(Number(driverProfile?.today_earnings || 0))
  );
  const [subData, setSubData] = useState(null);
  const [remainingPassTime, setRemainingPassTime] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showOutsideZoneModal, setShowOutsideZoneModal] = useState(false);
  const [showKycRequiredModal, setShowKycRequiredModal] = useState(false);

  const fetchSubscription = () => {
    if (!driverProfile?.id) return;
    fetch(`${BACKEND_URL}/api/drivers/subscription/${driverProfile.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) setSubData(data);
      })
      .catch(() => {});
  };

  // Sync today's earnings and subscription from backend API
  useEffect(() => {
    if (!driverProfile?.id) return;
    fetch(`${BACKEND_URL}/api/drivers/earnings/${driverProfile.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.today_earnings !== undefined) {
          setTodayEarnings(Math.round(Number(data.today_earnings)));
        }
      })
      .catch(() => {});

    fetchSubscription();
  }, [driverProfile]);

  // Live countdown timer calculation for the top chip
  useEffect(() => {
    if (!subData?.is_active || !subData?.expires_at) {
      setRemainingPassTime('');
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(subData.expires_at).getTime();
      const diffMs = expiry - now;

      if (diffMs <= 0) {
        setRemainingPassTime('Expired');
        fetchSubscription();
        return;
      }

      const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (totalHours >= 24) {
        const days = Math.floor(totalHours / 24);
        const remHours = totalHours % 24;
        setRemainingPassTime(`${days}d ${remHours}h left`);
      } else if (totalHours > 0) {
        setRemainingPassTime(`${totalHours}h ${mins}m left`);
      } else {
        setRemainingPassTime(`${mins}m left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000);
    return () => clearInterval(interval);
  }, [subData]);

  // Listen to real-time subscription activation socket event
  useEffect(() => {
    if (!socket) return;
    const handleSubUpdate = () => {
      fetchSubscription();
    };
    socket.on('driver:subscription_activated', handleSubUpdate);
    return () => {
      socket.off('driver:subscription_activated', handleSubUpdate);
    };
  }, [socket]);

  const isServiceable = zoneStatus?.isServiceable !== false && !!zoneStatus?.matchedCity;
  const matchedCity = zoneStatus?.matchedCity;
  const activeCities = zoneStatus?.activeCities || [];
  const kycStatus = driverProfile?.kyc_status || 'approved'; // default approved for demo, checked strictly

  // Background GPS updater (Emits real live GPS coordinates to backend without artificial jitter)
  useEffect(() => {
    if (!isOnline || !socket || !driverProfile) return;

    const interval = setInterval(() => {
      if (driverLocation?.lat && driverLocation?.lng) {
        socket.emit('driver:location_ping', {
          driverId: driverProfile.id,
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          heading: 0
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOnline, socket, driverProfile, driverLocation]);

  const handleToggleOnlineClick = () => {
    if (!isOnline && kycStatus !== 'approved') {
      setShowKycRequiredModal(true);
      return;
    }
    if (!isOnline && !isServiceable) {
      setShowOutsideZoneModal(true);
      return;
    }
    onToggleOnline();
  };

  return (
    <>
      {/* Floating Top Banner: If KYC is Rejected by Admin */}
      {kycStatus === 'rejected' && (
        <div className="absolute top-24 left-2.5 right-14 sm:right-auto sm:max-w-xs z-30 bg-red-950/95 border border-red-500/80 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">KYC Rejected</div>
              <div className="text-[9px] text-red-200/90 truncate">
                {driverProfile?.kyc_rejection_reason ? `Reason: ${driverProfile.kyc_rejection_reason}` : 'Please re-upload clear documents.'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenKyc}
            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] rounded-lg shrink-0 active:scale-95 transition shadow-sm"
          >
            Re-Submit
          </button>
        </div>
      )}

      {/* Floating Top Banner: If KYC is Pending Review */}
      {kycStatus === 'pending' && (
        <div className="absolute top-24 left-2.5 right-14 sm:right-auto sm:max-w-xs z-30 bg-amber-950/95 border border-amber-500/60 rounded-xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-2 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-white truncate">KYC Under Review</div>
              <div className="text-[9px] text-amber-200/90 truncate">
                Admin review in progress. Activated soon.
              </div>
            </div>
          </div>
          <button
            onClick={onOpenKyc}
            className="px-2 py-1 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-bold text-[9px] rounded-lg shrink-0 active:scale-95 transition shadow-sm"
          >
            View Docs
          </button>
        </div>
      )}

      {/* Radar Overlay Animation when Online and Idle */}
      {isOnline && !activeRide && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-56 h-56 rounded-full border border-brand-yellow/20 animate-radar" />
          <div className="w-40 h-40 rounded-full border border-brand-yellow/30 animate-radar [animation-delay:0.7s]" />
        </div>
      )}

      {/* KYC Required Modal Alert */}
      {showKycRequiredModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-brand-yellow/50 rounded-2xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-1.5 text-brand-yellow font-black text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>KYC Verification Required</span>
              </div>
              <button
                onClick={() => setShowKycRequiredModal(false)}
                className="w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              In accordance with Motor Vehicle Aggregator regulations, Captains must submit their Driving License (DL), Vehicle RC, and Aadhaar before accepting rides.
            </p>

            <button
              onClick={() => {
                setShowKycRequiredModal(false);
                if (onOpenKyc) onOpenKyc();
              }}
              className="w-full py-2.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg transition"
            >
              COMPLETE KYC NOW →
            </button>
          </div>
        </div>
      )}

      {/* Outside Zone Modal Alert */}
      {showOutsideZoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-red-500/40 rounded-2xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-1.5 text-red-400 font-black text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Outside Operating Zone</span>
              </div>
              <button
                onClick={() => setShowOutsideZoneModal(false)}
                className="w-6 h-6 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              Your device GPS is outside Bykneo's active service zones. Captains can only go online and receive rides inside our operational zones:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activeCities.map((c) => (
                <div
                  key={c.id || c.name}
                  className="w-full p-2.5 rounded-xl bg-gray-850 border border-gray-750 flex items-center justify-between"
                >
                  <div className="text-[11px] font-bold text-white">📍 {c.name}</div>
                  <span className="text-[9px] bg-gray-800 text-gray-300 font-bold px-1.5 py-0.5 rounded">
                    Active Zone
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowOutsideZoneModal(false)}
              className="w-full py-2 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl transition"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Bottom Main Action Button - Floating, Sleek & Compact with Safe-Area clearance */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 px-4 pointer-events-none flex justify-center pb-[env(safe-area-inset-bottom,16px)]">
        <button
          onClick={handleToggleOnlineClick}
          className={`pointer-events-auto py-2.5 px-5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition active:scale-[0.96] backdrop-blur-md ${
            isOnline
              ? 'bg-red-950/90 hover:bg-red-900 text-red-300 border border-red-500/50 shadow-red-950/50'
              : !isServiceable
              ? 'bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-500/50 shadow-amber-950/50'
              : 'bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 shadow-brand-yellow/30 border border-amber-400'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>
            {isOnline
              ? 'GO OFFLINE (STOP RECEIVING RIDES)'
              : !isServiceable
              ? 'OUTSIDE ACTIVE ZONE'
              : 'GO ONLINE & START EARNING'}
          </span>
        </button>
      </div>

      {/* 24-Hour Subscription Purchase Modal */}
      <DriverSubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        onSubscriptionActivated={() => fetchSubscription()}
      />
    </>
  );
};

