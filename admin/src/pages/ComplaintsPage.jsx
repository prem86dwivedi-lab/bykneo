import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, MessageSquare, Clock, ShieldAlert } from 'lucide-react';

export const ComplaintsPage = ({ BACKEND_URL }) => {
  const [complaints, setComplaints] = useState([]);

  const fetchComplaints = () => {
    fetch(`${BACKEND_URL}/api/admin/complaints`)
      .then(res => res.json())
      .then(data => setComplaints(data.complaints || []))
      .catch(console.error);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolve = async (id) => {
    await fetch(`${BACKEND_URL}/api/admin/complaints/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaintId: id,
        status: 'RESOLVED',
        resolutionNotes: 'Reviewed by Bykneo Operations and customer compensated.'
      })
    });
    fetchComplaints();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Complaints Desk</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          Support tickets, ride disputes, helmet safety issues, and resolution management
        </p>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {complaints.map((c) => (
          <div
            key={c.id}
            className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 space-y-2.5 sm:space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 text-brand-yellow flex items-center justify-center font-bold shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs sm:text-sm text-white truncate">{c.subject}</h4>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                    By {c.user_name} • Ride: <span className="font-mono text-gray-300">{c.ride_id}</span>
                  </p>
                </div>
              </div>

              <span
                className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                  c.status === 'RESOLVED'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {c.status}
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-gray-300 bg-gray-850 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-gray-800 leading-relaxed">
              "{c.description}"
            </p>

            {c.status !== 'RESOLVED' && (
              <button
                onClick={() => handleResolve(c.id)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-bold rounded-xl transition active:scale-95"
              >
                Mark as Resolved
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
