import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { InRideChatModal } from '../../components/InRideChatModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const DriverTripScreen = ({
  ride,
  onDriverArrived,
  onStartRide,
  onCompleteRide
}) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

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

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4 pb-[env(safe-area-inset-bottom,16px)] pointer-events-none">
      <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 shadow-2xl pointer-events-auto space-y-3.5">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-brand-yellow flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow animate-pulse"></span>
            {isInProgress
              ? '🏁 In-Trip: Driving to Destination'
              : isArrived
              ? '🔑 Verify Passenger OTP'
              : '📍 Heading to Pickup Point'}
          </span>

          <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full">
            Earning: ₹{Math.round(ride.fare * 0.85)}
          </span>
        </div>

        {/* Passenger Contact Card */}
        <div className="bg-gray-850 p-3 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">{ride.rider_name || 'Rahul Sharma'}</h4>
              <p className="text-xs text-gray-400">Payment: {ride.payment_mode || 'Cash'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowChatModal(true);
                setHasUnreadChat(false);
              }}
              className="relative w-10 h-10 rounded-2xl bg-brand-yellow/15 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow shadow-lg active:scale-95 transition"
              title="Message Passenger"
            >
              <MessageSquare className="w-4 h-4" />
              {hasUnreadChat && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-gray-900 rounded-full animate-bounce" />
              )}
            </button>
            <a
              href={`tel:${ride.rider_phone || '+919876543210'}`}
              className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg active:scale-95 transition"
              title="Call Passenger"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Route Address Snippet with Distance KM & Duration */}
        <div className="text-xs text-gray-300 bg-gray-850/80 p-3 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-800 text-[11px]">
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

          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0" />
              <div className="truncate"><span className="text-emerald-400 font-bold">Pick:</span> {ride.pickup_name}</div>
            </div>
            <div className="flex items-start gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-1 shrink-0" />
              <div className="truncate"><span className="text-red-400 font-bold">Drop:</span> {ride.drop_name}</div>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS BASED ON RIDE STATE */}
        {ride.status === 'ACCEPTED' && (
          <button
            onClick={() => onDriverArrived(ride.id)}
            className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/20 active:scale-[0.98] transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>I HAVE ARRIVED AT PICKUP</span>
          </button>
        )}

        {isArrived && (
          <form onSubmit={handleVerifyOtpAndStart} className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-brand-yellow flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-brand-yellow" />
                  Rider Verification & Start PIN
                </span>
                <span className="text-[9px] font-bold bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded-full border border-brand-yellow/30">
                  4 Digits
                </span>
              </div>
              <p className="text-[10px] text-gray-300">
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
                className="w-full bg-gray-950 border-2 border-brand-yellow focus:border-white rounded-xl py-2.5 px-4 text-center text-2xl font-black tracking-[0.5em] text-brand-yellow focus:outline-none shadow-inner"
              />
            </div>

            {otpError && (
              <div className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl text-center border border-red-500/30 flex items-center justify-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || enteredOtp.length !== 4}
              className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/20 active:scale-[0.98] transition disabled:opacity-40"
            >
              <KeyRound className="w-5 h-5" />
              <span>{loading ? 'Verifying PIN...' : 'VERIFY PIN & START TRIP'}</span>
            </button>
          </form>
        )}

        {isInProgress && (
          <button
            onClick={() => onCompleteRide(ride.id)}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>COMPLETE RIDE & COLLECT ₹{ride.fare}</span>
          </button>
        )}
      </div>

      {/* In-Ride Direct Chat (Driver <-> Rider) */}
      <InRideChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        ride={ride}
        currentUserRole="driver"
        socket={socket}
        currentUserId={user?.id}
      />
    </div>
  );
};
