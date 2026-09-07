import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle2, Bike, HeartHandshake, ArrowRight } from 'lucide-react';
import { BACKEND_URL } from '../../context/SocketContext';

export const RideCompleteModal = ({ ride, onClose }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  const handleSubmitReview = async () => {
    if (ride?.id) {
      fetch(`${BACKEND_URL}/api/rides/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: ride.id,
          rating,
          feedback,
          ratedBy: 'rider'
        })
      }).catch(console.error);
    }
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-xl">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-black text-white">Ride Completed!</h3>
          <p className="text-xs text-gray-400 mt-1">Hope you had a fast & safe ride with Bykneo</p>
        </div>

        {/* Fare Receipt Card */}
        <div className="bg-gray-850 p-4 rounded-2xl border border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Total Fare Paid</span>
            <span className="text-xs font-bold text-emerald-400">
              PAID ({ride?.payment_mode || 'UPI'})
            </span>
          </div>
          <div className="text-3xl font-black text-brand-yellow">₹{ride?.fare || 65}</div>
          <div className="text-[11px] text-gray-500">
            {ride?.distance_km} km distance covered
          </div>
        </div>

        {/* Rating Stars */}
        <div>
          <div className="text-xs font-bold text-gray-300 mb-2">
            Rate Captain {ride?.driver_name || 'Vikram'}
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 hover:scale-125 transition active:scale-95"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating
                      ? 'text-brand-yellow fill-brand-yellow'
                      : 'text-gray-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Input */}
        <input
          type="text"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Leave a compliment (e.g. Smooth riding, on time)"
          className="w-full bg-gray-850 border border-gray-800 focus:border-brand-yellow rounded-xl py-2.5 px-3 text-xs text-white placeholder-gray-500 focus:outline-none"
        />

        <button
          onClick={handleSubmitReview}
          className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellowHover text-gray-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-brand-yellow/15 active:scale-[0.98] transition"
        >
          {submitted ? 'Thank You!' : 'Done & Submit Rating'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
