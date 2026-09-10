import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export const PaymentsPage = ({ BACKEND_URL, stats }) => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/admin/payments`)
      .then(res => res.json())
      .then(data => setPayments(data.payments || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-yellow shrink-0" />
          <span>Payments & Commission</span>
        </h2>
        <p className="text-[10.5px] sm:text-xs text-gray-400">
          Platform revenue, driver payouts, and 15% platform commission accounting
        </p>
      </div>

      {/* Revenue Stat Cards - Single Line (3 Columns) on Mobile */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {/* Card 1: Gross Trip Volume */}
        <div className="bg-gray-900 border border-gray-800 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-0.5 sm:space-y-1 shadow-md">
          <span className="text-[7.5px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate block">
            Gross Volume
          </span>
          <div className="text-sm sm:text-2xl font-black text-white font-mono leading-tight">
            ₹{stats?.total_gross_revenue || '0.00'}
          </div>
          <span className="text-[6.5px] sm:text-[9px] text-gray-500 truncate block">
            100% rider fares
          </span>
        </div>

        {/* Card 2: Bykneo Commission */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-gray-900 to-gray-900 border border-emerald-500/30 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-0.5 sm:space-y-1 shadow-md">
          <span className="text-[7.5px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider truncate block">
            Commission (15%)
          </span>
          <div className="text-sm sm:text-2xl font-black text-emerald-400 font-mono leading-tight">
            ₹{stats?.platform_commission || '0.00'}
          </div>
          <span className="text-[6.5px] sm:text-[9px] text-emerald-500/80 truncate block">
            Platform revenue
          </span>
        </div>

        {/* Card 3: Captains Payout */}
        <div className="bg-gray-900 border border-gray-800 p-2 sm:p-3.5 rounded-xl sm:rounded-2xl space-y-0.5 sm:space-y-1 shadow-md">
          <span className="text-[7.5px] sm:text-[10px] font-bold text-brand-yellow uppercase tracking-wider truncate block">
            Payout (85%)
          </span>
          <div className="text-sm sm:text-2xl font-black text-brand-yellow font-mono leading-tight">
            ₹{Math.round((stats?.total_gross_revenue || 0) * 0.85)}
          </div>
          <span className="text-[6.5px] sm:text-[9px] text-gray-500 truncate block">
            Driver earnings
          </span>
        </div>
      </div>

      {/* Transaction Table - 100% Responsive Single Screen Layout (No Scrollbar) */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
        <div className="p-2 sm:p-3.5 border-b border-gray-800 font-bold text-xs sm:text-sm text-white flex items-center justify-between">
          <span>Recent Payment Transactions</span>
          <span className="text-[9px] sm:text-[10px] text-gray-400 font-mono">{payments.length} records</span>
        </div>
        <div className="w-full">
          <table className="w-full text-left table-fixed">
            <thead className="bg-gray-850 text-gray-400 uppercase font-bold border-b border-gray-800 text-[8px] sm:text-[10.5px]">
              <tr>
                <th className="p-1.5 sm:p-3 w-[26%] sm:w-[22%]">Transaction</th>
                <th className="p-1.5 sm:p-3 w-[18%] sm:w-[16%]">Gross</th>
                <th className="p-1.5 sm:p-3 w-[20%] sm:w-[18%]">Platform</th>
                <th className="p-1.5 sm:p-3 w-[20%] sm:w-[18%]">Captain</th>
                <th className="p-1.5 sm:p-3 w-[16%] sm:w-[14%] text-right sm:text-left">Status</th>
                <th className="hidden sm:table-cell p-3 w-[12%] text-right">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-[9.5px] sm:text-xs">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-850/50 transition">
                  <td className="p-1.5 sm:p-3 min-w-0">
                    <div className="font-mono font-bold text-white text-[8.5px] sm:text-xs truncate" title={p.id}>
                      {p.id}
                    </div>
                    <div className="text-[7.5px] text-gray-500 font-bold uppercase sm:hidden truncate">
                      {p.method}
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-3 font-black text-white text-[9.5px] sm:text-sm font-mono truncate">
                    ₹{p.amount}
                  </td>
                  <td className="p-1.5 sm:p-3 font-bold text-emerald-400 text-[9px] sm:text-xs font-mono truncate">
                    +₹{p.commission_amount}
                  </td>
                  <td className="p-1.5 sm:p-3 font-bold text-brand-yellow text-[9px] sm:text-xs font-mono truncate">
                    ₹{p.driver_amount}
                  </td>
                  <td className="p-1.5 sm:p-3 text-right sm:text-left">
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold bg-emerald-500/15 px-1 sm:px-2 py-0.2 sm:py-0.5 rounded-full text-[7.5px] sm:text-[9.5px]">
                      <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 shrink-0" />
                      <span className="truncate">{p.status || 'PAID'}</span>
                    </span>
                  </td>
                  <td className="hidden sm:table-cell p-3 uppercase font-bold text-gray-400 text-[10px] sm:text-[11px] text-right">
                    {p.method}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
