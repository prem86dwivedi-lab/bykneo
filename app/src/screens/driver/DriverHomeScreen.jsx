import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket, BACKEND_URL } from '../../context/SocketContext';
import { Power, Radio, DollarSign, Bike, ShieldCheck, Zap, Navigation, MapPin, X, AlertTriangle } from 'lucide-react';

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
  const [todayEarnings, setTodayEarnings] = useState(driverProfile?.today_earnings || 780.00);
  const [showOutsideZoneModal, setShowOutsideZoneModal] = useState(false);
  const [showKycRequiredModal, setShowKycRequiredModal] = useState(false);

  const isServiceable = zoneStatus?.isServiceable !== false && !!zoneStatus?.matchedCity;
  const matchedCity = zoneStatus?.matchedCity;
  const activeCities = zoneStatus?.activeCities || [];
  const kycStatus = driverProfile?.kyc_status || 'approved'; // default approved for demo, checked strictly

  // Background GPS updater (Simulates live GPS navigation pinging every 3 seconds)
  useEffect(() => {
    if (!isOnline || !socket || !driverProfile) return;

    const interval = setInterval(() => {
      setDriverLocation(prev => {
        const baseLat = prev?.lat || 23.2599;
        const baseLng = prev?.lng || 77.4126;
        // Small realistic GPS jitter/movement (approx 10-20 meters)
        const newLat = Number((baseLat + (Math.random() - 0.48) * 0.0006).toFixed(6));
        const newLng = Number((baseLng + (Math.random() - 0.48) * 0.0006).toFixed(6));

        // Emit GPS ping to backend
        socket.emit('driver:location_ping', {
          driverId: driverProfile.id,
          lat: newLat,
          lng: newLng,
          heading: Math.floor(Math.random() * 360)
        });

        return { lat: newLat, lng: newLng };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOnline, socket, driverProfile]);

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
      {/* Top Floating Captain Status Card - Height matches h-9 of Location and Layer buttons */}
      <div className="absolute top-14 left-3 z-30 pointer-events-none max-w-[calc(100%-92px)]">
        <div className="h-9 inline-flex items-center gap-1.5 px-2 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-xl pointer-events-auto">
          {/* Left: Online Status & Operating Zone */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline && isServiceable
                  ? 'bg-emerald-400 animate-ping'
                  : !isServiceable
                  ? 'bg-red-400'
                  : 'bg-gray-600'
              }`}
            />
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              {matchedCity && (
                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold truncate">
                  {matchedCity.name}
                </span>
              )}
            </div>
          </div>

          <div className="h-4 w-[1px] bg-gray-800 shrink-0"></div>

          {/* Center/Right: Clickable Compact KYC Chip & Today's Earnings */}
          <button
            onClick={onOpenKyc}
            className={`h-6 px-1.5 rounded-lg border text-[8.5px] font-bold flex items-center gap-1 transition active:scale-95 shrink-0 ${
              kycStatus === 'approved'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : kycStatus === 'pending'
                ? 'bg-amber-500/15 border-brand-yellow/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25'
            }`}
            title="Click to view/update KYC documents"
          >
            <ShieldCheck className="w-2.5 h-2.5 text-brand-yellow shrink-0" />
            <span>{kycStatus === 'approved' ? 'KYC Verified' : kycStatus === 'pending' ? 'KYC Review' : 'Submit KYC'}</span>
          </button>

          <div className="h-6 bg-gray-850 px-1.5 rounded-lg border border-gray-800 flex items-center gap-1 shrink-0">
            <span className="text-[7.5px] text-gray-400 font-bold leading-none">TODAY</span>
            <span className="text-[10.5px] font-black text-brand-yellow leading-none">₹{todayEarnings}</span>
          </div>
        </div>
      </div>

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
              Your device GPS is outside Bykneo's active service zones. Captains can only go online and receive rides inside our operational geofenced zones:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {activeCities.map((c) => (
                <div
                  key={c.id || c.name}
                  className="w-full p-2.5 rounded-xl bg-gray-850 border border-gray-750 flex items-center justify-between"
                >
                  <div>
                    <div className="text-[11px] font-bold text-white">📍 {c.name}</div>
                    <div className="text-[9px] text-brand-yellow font-semibold">
                      Operating Radius: {c.radius_km} KM
                    </div>
                  </div>
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

      {/* Bottom Main Action Button - Floating, Sleek & Compact without outer container */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4 pointer-events-none flex justify-center">
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
    </>
  );
};
