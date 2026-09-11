import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, Phone, User, Bike } from 'lucide-react';
import { BACKEND_URL } from '../context/SocketContext';
import { playNotificationSound } from '../utils/notification';

export const InRideChatModal = ({
  isOpen,
  onClose,
  ride,
  currentUserRole = 'rider', // 'rider' | 'driver'
  socket,
  currentUserId
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const isDriver = currentUserRole === 'driver';
  const otherPartyName = isDriver ? (ride?.rider_name || 'Rider') : (ride?.driver_name || 'Captain');
  const otherPartyRole = isDriver ? 'Rider' : 'Captain';
  const otherPartyPhone = isDriver ? ride?.rider_phone : ride?.driver_phone;

  // Quick message shortcuts
  const riderShortcuts = [
    '📍 I am at pickup location',
    '🚪 Coming out of main gate',
    '⏳ Please wait 2 minutes',
    '👕 Wearing black shirt/jacket',
    'Call me when you reach'
  ];

  const driverShortcuts = [
    '📍 I have reached pickup point',
    '🏍️ Reaching in 2-3 mins',
    '🚦 In slight traffic, coming',
    '🔑 Please keep your 4-digit PIN ready',
    'Call me once outside'
  ];

  const shortcuts = isDriver ? driverShortcuts : riderShortcuts;

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  // Fetch message history from REST API on mount/open
  useEffect(() => {
    if (!isOpen || !ride?.id) return;

    let isMounted = true;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rides/${ride.id}/messages`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.messages) && isMounted) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const combined = [...prev];
              data.messages.forEach((m) => {
                if (!existingIds.has(m.id)) {
                  combined.push(m);
                }
              });
              return combined.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            });
          }
        }
      } catch (err) {
        console.warn('Failed to fetch chat history:', err);
      }
    };

    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, [isOpen, ride?.id]);

  // Listen for socket chat messages & join ride room
  useEffect(() => {
    if (!socket || !ride?.id) return;

    // Join the ride room for chat
    socket.emit('join_ride', { rideId: ride.id });

    const handleIncomingMessage = (msg) => {
      if (String(msg.rideId) === String(ride.id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Play chime sound if message is from the other party
        if (msg.senderRole !== currentUserRole) {
          playNotificationSound();
        }
      }
    };

    socket.on('ride:chat_message', handleIncomingMessage);

    return () => {
      socket.off('ride:chat_message', handleIncomingMessage);
    };
  }, [socket, ride?.id, currentUserRole]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !ride?.id) return;

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      rideId: ride.id,
      senderId: currentUserId || 'usr_unknown',
      senderRole: currentUserRole,
      senderName: isDriver ? (ride.driver_name || 'Captain') : (ride.rider_name || 'Rider'),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    };

    // Optimistically add to local message list
    setMessages((prev) => [...prev, messageObj]);
    setInputText('');

    // Emit via WebSocket
    if (socket) {
      socket.emit('ride:send_chat_message', messageObj);
    }

    // Persist to REST API
    try {
      await fetch(`${BACKEND_URL}/api/rides/${ride.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageObj)
      });
    } catch (err) {
      console.warn('Failed to persist message via REST:', err);
    }
  };

  if (!isOpen || !ride) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full h-[88vh] sm:h-[600px] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 pointer-events-auto">
        {/* Header */}
        <div className="px-4 py-3.5 bg-gray-850 border-b border-gray-800 flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center font-bold border border-brand-yellow/30">
                {isDriver ? <User className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-gray-900 rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white truncate">{otherPartyName}</h3>
                <span className="text-[9px] bg-gray-800 text-brand-yellow px-1.5 py-0.5 rounded font-bold uppercase">
                  {otherPartyRole}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate">
                Ride #{ride.id?.slice(-6) || 'BYK'} • ₹{ride.fare}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {otherPartyPhone && (
              <a
                href={`tel:${otherPartyPhone}`}
                className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-750 text-emerald-400 flex items-center justify-center border border-gray-700 active:scale-95 transition"
                title="Call"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center border border-gray-600 active:scale-90 transition cursor-pointer shadow-md shrink-0"
              title="Close Chat"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/60">
          <div className="text-center my-2">
            <span className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full inline-block">
              🔒 In-ride direct chat. Messages auto-clear after trip.
            </span>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 text-brand-yellow flex items-center justify-center mx-auto shadow-inner">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-300">Start chat with {otherPartyName}</p>
              <p className="text-[11px] text-gray-400">Use quick chips below or type a message.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderRole === currentUserRole;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                    isMe
                      ? 'bg-brand-yellow text-gray-950 rounded-br-none font-medium'
                      : 'bg-gray-850 text-white border border-gray-800 rounded-bl-none font-normal'
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.text}</p>
                </div>
                <span className="text-[9.5px] text-gray-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Message Shortcut Chips */}
        <div className="px-3 py-2 bg-gray-900 border-t border-gray-800 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {shortcuts.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(chip)}
              className="shrink-0 bg-gray-850 hover:bg-gray-800 border border-gray-750 text-gray-300 hover:text-white px-2.5 py-1 rounded-full text-[10.5px] font-medium transition active:scale-95 whitespace-nowrap shadow-sm"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-gray-850 border-t border-gray-800 flex items-center gap-2 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${otherPartyName}...`}
            className="flex-1 bg-gray-950 border border-gray-750 focus:border-brand-yellow rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-400 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 bg-brand-yellow hover:bg-brand-yellowHover disabled:opacity-40 text-gray-950 rounded-xl flex items-center justify-center font-bold shrink-0 transition active:scale-95 shadow-md shadow-brand-yellow/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
