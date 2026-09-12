import React, { useState, useEffect } from 'react';
import {
  Phone,
  Navigation,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  User,
  Clock,
  DollarSign,
  MessageSquare,
  XCircle,
  X,
  AlertTriangle
} from 'lucide-react';
import { InRideChatModal } from '../../components/InRideChatModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const DriverTripScreen = ({
  ride,
  onDriverArrived,
  onStartRide,
  onCompleteRide,
  onCancelRide
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');

  const cancelReasons = [
    'Passenger not reachable / no response',
    'Passenger requested to cancel',
    'Pickup point too far or inaccessible',
    'Vehicle breakdown / flat tire',
    'Heavy traffic / road blocked',
    'Personal emergency',
    'Other reason'
  ];

  useEffect(() => {
    if (!socket || !ride?.id) return;
    socket.emit('join_ride', { rideId: ride.id });

    const handleMsg = (msg) => {
      if (String(msg.rideId) === String(ride.id) && msg.senderRole !== 'driver') {
        if (!showChatModal) {
          setHasUnreadChat(true);
        }
      }
    };
    socket.on('ride:chat_message', handleMsg);
    return () => socket.off('ride:chat_message', handleMsg);
  }, [socket, ride?.id, showChatModal]);

  if (!ride) return null;

  const isArrived = ride.status === 'ARRIVED';
  const isInProgress = ride.status === 'IN_PROGRESS';

  const handleVerifyOtpAndStart = async (e) => {
    e.preventDefault();
    if (enteredOtp.length !== 4) {
      setOtpError('Please enter 4-digit OTP from passenger');
      return;
    }
    setOtpError('');
    setLoading(true);

    onStartRide(ride.id, enteredOtp, (res) => {
      setLoading(false);
      if (!res.success) {
        setOtpError(res.message || 'Invalid OTP! Check with passenger.');
      }
    });
  };

  const handleConfirmCancel = () => {
    const finalReason = selectedCancelReason === 'Other reason'
      ? (customCancelReason || 'Cancelled by Captain')
      : (selectedCancelReason || 'Cancelled by Captain');
    
    if (onCancelRide) {
      onCancelRide(ride.id, finalReason);
    }
    setShowCancelModal(false);
  };

  return (
    <>
      <div className="absolute bottom-0 left-0 right-0 z-20 px-2.5 pb-2.5 pb-[env(safe-area-inset-bottom,10px)] pointer-events-none">
        <div className="max-w-md mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-3 shadow-2xl pointer-events-auto space-y-2.5">
          {/* Status Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wide text-brand-yellow flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse shrink-0"></span>
              <span className="truncate">
                {isInProgress
                  ? '🏁 In-Trip: Driving to Drop'
                  : isArrived
                  ? '🔑 Verify Passenger OTP'
                  : '📍 Heading to Pickup Point'}
              </span>
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10.5px] font-bold text-gray-300 bg-gray-800 px-2 py-0.5 rounded-full">
                ₹{Math.round(ride.fare * 0.85)}
              </span>

              {/* Captain Cancel Button */}
              {!isInProgress && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="text-[10.5px] font-bold text-red-400 hover:text-red-300 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 active:scale-95 transition"
                  title="Cancel Ride"
                >
                  <XCircle className="w-3 h-3 text-red-400" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Passenger Contact Card */}
          <div className="bg-gray-850 p-2 rounded-xl border border-gray-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold shrink-0 border border-brand-yellow/30">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white truncate">{ride.rider_name || 'Passenger'}</h4>
                <p className="text-[10.5px] text-gray-400 truncate">Payment: {ride.payment_mode || 'Cash'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => {
                  setShowChatModal(true);
                  setHasUnreadChat(false);
                }}
                className="relative w-8 h-8 rounded-xl bg-brand-yellow/15 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow shadow active:scale-95 transition"
                title="Message Passenger"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {hasUnreadChat && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-gray-900 rounded-full animate-bounce" />
                )}
              </button>
              <a
                href={`tel:${ride.rider_phone || '+919876543210'}`}
                className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow active:scale-95 transition"
                title="Call Passenger"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Route Address Snippet with Distance KM & Duration */}
          <div className="text-[10.5px] text-gray-300 bg-gray-850/80 p-2 rounded-xl border border-gray-800 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-gray-800 text-[10px]">
              <span className="font-bold text-white flex items-center gap-1">
                <Navigation className="w-3 h-3 text-brand-yellow" />
                <span>{ride.distance_km || 3.5} km</span>
                <span className="text-gray-500">•</span>
                <span>~{ride.duration_mins || 10} mins</span>
              </span>
              <span className="font-mono font-bold text-brand-yellow">
                Fare: ₹{ride.fare} (Net ₹{Math.round((ride.fare || 50) * 0.85)})
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-start gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5 shrink-0" />
                <div className="truncate"><span className="text-emerald-400 font-bold">Pick:</span> {ride.pickup_name}</div>
              </div>
              <div className="flex items-start gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-red-400 mt-0.5 shrink-0" />
                <div className="truncate"><span className="text-red-400 font-bold">Drop:</span> {ride.drop_name}</div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS BASED ON RIDE STATE */}
          {ride.status === 'ACCEPTED' && (
            <button
              onClick={() => onDriverArrived(ride.id)}
              className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-yellow/20 active:scale-[0.98] transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I HAVE ARRIVED AT PICKUP</span>
            </button>
          )}

          {isArrived && (
            <form onSubmit={handleVerifyOtpAndStart} className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-2.5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-black uppercase text-brand-yellow flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-brand-yellow" />
                    Rider Verification & Start PIN
                  </span>
                  <span className="text-[9px] font-bold bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded-full border border-brand-yellow/30">
                    4 Digits
                  </span>
                </div>
                <p className="text-[9.5px] text-gray-300">
                  Ask passenger <b className="text-white">{ride.rider_name || 'Rider'}</b> for their 4-digit start PIN:
                </p>
                <input
                  type="tel"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  value={enteredOtp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setEnteredOtp(val);
                    setOtpError('');
                  }}
                  placeholder="• • • •"
                  className="w-full bg-gray-950 border-2 border-brand-yellow focus:border-white rounded-xl py-2 px-3 text-center text-xl font-black tracking-[0.5em] text-brand-yellow focus:outline-none shadow-inner"
                />
              </div>

              {otpError && (
                <div className="text-[11px] text-red-400 bg-red-500/10 p-2 rounded-xl text-center border border-red-500/30 flex items-center justify-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || enteredOtp.length !== 4}
                className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-brand-yellow/20 active:scale-[0.98] transition disabled:opacity-40"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Verifying PIN...' : 'VERIFY PIN & START TRIP'}</span>
              </button>
            </form>
          )}

          {isInProgress && (
            <button
              onClick={() => onCompleteRide(ride.id)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMPLETE RIDE & COLLECT ₹{ride.fare}</span>
            </button>
          )}
        </div>
      </div>

      {/* Driver Cancel Ride Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-red-400 font-black text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Cancel Ride?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Please select a reason for cancelling this trip with passenger <b className="text-white">{ride.rider_name || 'Passenger'}</b>:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cancelReasons.map((reason, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedCancelReason(reason)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition ${
                    selectedCancelReason === reason
                      ? 'bg-red-500/20 border-red-500 text-white'
                      : 'bg-gray-850 border-gray-800 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {selectedCancelReason === 'Other reason' && (
              <input
                type="text"
                value={customCancelReason}
                onChange={(e) => setCustomCancelReason(e.target.value)}
                placeholder="Type your reason here..."
                className="w-full bg-gray-950 border border-gray-750 focus:border-red-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
              />
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 text-white font-bold text-xs rounded-xl transition"
              >
                Keep Ride
              </button>
              <button
                type="button"
                disabled={!selectedCancelReason}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 transition"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Ride Direct Chat (Driver <-> Rider) */}
      <InRideChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        ride={ride}
        currentUserRole="driver"
        socket={socket}
        currentUserId={user?.id}
      />
    </>
  );
};
