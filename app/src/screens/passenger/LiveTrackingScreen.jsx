import React, { useState, useEffect } from 'react';
import {
  Phone,
  Shield,
  Star,
  KeyRound,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Navigation,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  MessageSquare
} from 'lucide-react';
import { InRideChatModal } from '../../components/InRideChatModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const LiveTrackingScreen = ({ ride, onCancelRide }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [showSosModal, setShowSosModal]         = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showChatModal, setShowChatModal]       = useState(false);
  const [hasUnreadChat, setHasUnreadChat]       = useState(false);
  const [isExpanded, setIsExpanded]             = useState(false);

  useEffect(() => {
    if (!socket || !ride?.id) return;
    socket.emit('join_ride', { rideId: ride.id });

    const handleMsg = (msg) => {
      if (String(msg.rideId) === String(ride.id) && msg.senderRole !== 'rider') {
        if (!showChatModal) {
          setHasUnreadChat(true);
        }
      }
    };
    socket.on('ride:chat_message', handleMsg);
    return () => socket.off('ride:chat_message', handleMsg);
  }, [socket, ride?.id, showChatModal]);

  if (!ride) return null;

  const isArrived    = ride.status === 'ARRIVED';
  const isInProgress = ride.status === 'IN_PROGRESS';

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-4 pb-[env(safe-area-inset-bottom,16px)] pointer-events-none">
      <div className="max-w-lg mx-auto bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl pointer-events-auto overflow-hidden">

        {/* ── Drag Handle ── */}
        <div
          className="flex justify-center pt-2.5 pb-1 cursor-pointer"
          onClick={() => setIsExpanded(v => !v)}
          aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        <div className="px-4 pb-4 space-y-3">

          {/* ── Status Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-yellow opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-yellow" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-brand-yellow">
                {isInProgress
                  ? '🚀 Trip in Progress to Destination'
                  : isArrived
                  ? '📍 Captain Arrived at Pickup!'
                  : '🏍️ Captain Approaching Pickup'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-300 bg-gray-800 px-2.5 py-1 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-yellow" />
              {isInProgress ? `${ride.duration_mins || 10}m left` : 'ETA ~3 mins'}
            </span>
          </div>

          {/* ── Start Ride OTP Card ── */}
          {!isInProgress && (
            <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-brand-yellow/40 p-3 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-yellow text-gray-950 flex items-center justify-center font-black shadow-md">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">
                    Start Ride PIN (Share with Captain)
                  </div>
                  <div className="text-xl font-black text-brand-yellow tracking-widest">
                    {ride.otp || '4829'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-bold uppercase">Estimated Fare</span>
                <span className="text-base font-black text-brand-yellow">₹{ride.fare}</span>
              </div>
            </div>
          )}

          {/* ── Captain Details Card ── */}
          <div className="bg-gray-850 p-3.5 rounded-2xl border border-gray-800 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={ride.driver_avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'}
                  alt="Captain"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-brand-yellow/60 shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 bg-gray-950 rounded-full p-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-gray-950" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{ride.driver_name || 'Captain Partner'}</h4>
                <p className="text-xs font-semibold text-brand-yellow">
                  {ride.vehicle_model || 'Bykneo Vehicle'} •{' '}
                  <span className="text-white font-mono font-bold">
                    {ride.vehicle_number || 'MP 04 AB 4589'}
                  </span>
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                  <span className="text-xs font-bold text-gray-300">{ride.driver_rating || '4.85'}</span>
                  <span className="text-gray-500 text-xs">•</span>
                  <span className="text-[11px] text-gray-400">Verified Driver</span>
                </div>
              </div>
            </div>

            {/* Chat, Call & SOS Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setShowChatModal(true);
                  setHasUnreadChat(false);
                }}
                className="relative w-10 h-10 rounded-2xl bg-brand-yellow/15 hover:bg-brand-yellow/25 border border-brand-yellow/40 flex items-center justify-center text-brand-yellow shadow-lg active:scale-95 transition"
                title="Message Captain"
              >
                <MessageSquare className="w-4 h-4" />
                {hasUnreadChat && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-gray-900 rounded-full animate-bounce" />
                )}
              </button>
              <a
                href={`tel:${ride.driver_phone || '+919123456780'}`}
                className="w-10 h-10 rounded-2xl bg-gray-800 hover:bg-gray-750 border border-gray-700 flex items-center justify-center text-emerald-400 shadow-lg active:scale-95 transition"
                title="Call Captain"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowSosModal(true)}
                className="w-10 h-10 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg active:scale-95 transition"
                title="Emergency SOS"
              >
                <Shield className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Expand / Collapse Toggle Bar ── */}
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="w-full flex items-center justify-between bg-gray-850/80 border border-gray-700 rounded-2xl px-3 py-2.5 text-xs active:scale-[0.98] transition-transform"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Hide trip details' : 'Show trip details'}
          >
            {/* Left: distance + time */}
            <div className="flex items-center gap-1.5 text-gray-300">
              <Navigation className="w-3.5 h-3.5 text-brand-yellow" />
              <span className="font-bold text-white">{ride.distance_km || 3.5} km</span>
              <span className="text-gray-500">•</span>
              <span>~{ride.duration_mins || 10} mins</span>
            </div>

            {/* Centre: Trip Details & Fare */}
            <span
              onClick={e => { e.stopPropagation(); setShowDetailsModal(true); }}
              className="text-[11px] font-black text-brand-yellow flex items-center gap-1 bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-1 rounded-lg active:scale-95 transition"
            >
              <FileText className="w-3 h-3" />
              Trip Details & Fare
              <ChevronRight className="w-3 h-3" />
            </span>

            {/* Right: expand icon */}
            <span className="ml-2 text-gray-400">
              {isExpanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronUp   className="w-4 h-4" />}
            </span>
          </button>

          {/* ── Collapsible section: Pickup / Drop + Cancel ── */}
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: isExpanded ? '200px' : '0px', opacity: isExpanded ? 1 : 0 }}
          >
            <div className="space-y-3 pt-1">
              {/* Pickup & Drop addresses */}
              <div className="bg-gray-850/80 rounded-2xl px-3 py-2.5 border border-gray-800 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Pickup Location</span>
                    <span className="text-white font-medium truncate block">{ride.pickup_name}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Drop Destination</span>
                    <span className="text-white font-medium truncate block">{ride.drop_name}</span>
                  </div>
                </div>
              </div>

              {/* Cancel ride */}
              {!isInProgress && (
                <button
                  onClick={() => onCancelRide(ride.id)}
                  className="w-full py-2.5 rounded-xl bg-gray-850 hover:bg-gray-800 text-red-400 text-xs font-bold transition active:scale-95 border border-red-500/20"
                >
                  Cancel Ride
                </button>
              )}
            </div>
          </div>

        </div>{/* /px-4 pb-4 */}
      </div>

      {/* ── Trip Details & Fare Modal ── */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-brand-yellow/30 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 text-left pointer-events-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Trip & Fare Details</h3>
                  <p className="text-[10px] text-gray-400">Ride #{ride.id?.slice(-8) || 'BYK-1049'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-7 h-7 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-gray-850 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Distance</span>
                <span className="text-base font-black text-white">{ride.distance_km || 3.5} <span className="text-xs text-gray-400">km</span></span>
              </div>
              <div className="bg-gray-850 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Est. Time</span>
                <span className="text-base font-black text-white">{ride.duration_mins || 10} <span className="text-xs text-gray-400">min</span></span>
              </div>
              <div className="bg-gray-850 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Fare</span>
                <span className="text-base font-black text-brand-yellow">₹{ride.fare}</span>
              </div>
            </div>

            <div className="bg-gray-850 p-3 rounded-2xl border border-gray-800 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[9.5px] font-bold text-gray-400 uppercase block">Pickup Location</span>
                  <p className="text-white font-medium leading-tight">{ride.pickup_name}</p>
                </div>
              </div>
              <div className="h-[1px] bg-gray-800 ml-4" />
              <div className="flex items-start gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[9.5px] font-bold text-gray-400 uppercase block">Drop Destination</span>
                  <p className="text-white font-medium leading-tight">{ride.drop_name}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-850 p-3 rounded-2xl border border-gray-800 space-y-1.5 text-xs">
              <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Fare Breakdown</span>
              <div className="flex items-center justify-between text-gray-300">
                <span>Base Fare (First 1.5 km)</span><span>₹25.00</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>Distance Fare ({ride.distance_km || 3.5} km)</span>
                <span>₹{Math.max(0, (ride.fare || 50) - 25).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-300">
                <span>Platform Convenience Fee</span>
                <span className="text-emerald-400 font-bold">FREE</span>
              </div>
              <div className="pt-2 border-t border-gray-800 flex items-center justify-between font-black text-sm text-brand-yellow">
                <span>Total Amount to Pay</span><span>₹{ride.fare}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                <span>Payment Mode:</span>
                <span className="font-bold text-white uppercase">{ride.payment_mode || 'Cash / UPI'}</span>
              </div>
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="w-full py-3 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition"
            >
              CLOSE TRIP DETAILS
            </button>
          </div>
        </div>
      )}

      {/* ── SOS Emergency Modal ── */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/50 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl text-left pointer-events-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Emergency Safety & SOS</h3>
                <p className="text-xs text-gray-400">Instant Police & Emergency Alert</p>
              </div>
            </div>
            <p className="text-xs text-gray-300">
              Your live GPS location and ride details will be shared immediately with Bykneo 24/7 Safety Team and local authorities (112).
            </p>
            <div className="space-y-2">
              <a
                href="tel:112"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Police (112)
              </a>
              <button
                onClick={() => setShowSosModal(false)}
                className="w-full py-2.5 bg-gray-800 text-gray-300 rounded-2xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── In-Ride Chat Modal (Rider <-> Driver) ── */}
      <InRideChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        ride={ride}
        currentUserRole="rider"
        socket={socket}
        currentUserId={user?.id}
      />
    </div>
  );
};
