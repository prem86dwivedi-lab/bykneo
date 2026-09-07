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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-brand-yellow shrink-0" />
          <span>Payments & Commission</span>
        </h2>
        <p className="text-[11px] sm:text-xs text-gray-400">
          Platform revenue, driver payouts, and 15% platform commission accounting
        </p>
      </div>

      {/* Revenue Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase">Gross Trip Volume</span>
          <div className="text-2xl sm:text-3xl font-black text-white">₹{stats?.total_gross_revenue || '0.00'}</div>
          <span className="text-[9.5px] sm:text-[10px] text-gray-500">100% total rider payments</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-gray-900 to-gray-900 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase">Bykneo Commission (15%)</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            ₹{stats?.platform_commission || '0.00'}
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-emerald-500/80">Net platform revenue earned</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl space-y-1">
          <span className="text-[10px] sm:text-xs font-bold text-brand-yellow uppercase">Captains Payout (85%)</span>
          <div className="text-2xl sm:text-3xl font-black text-brand-yellow">
            ₹{Math.round((stats?.total_gross_revenue || 0) * 0.85)}
          </div>
          <span className="text-[9.5px] sm:text-[10px] text-gray-500">Credited to driver wallets</span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-3.5 sm:p-4 border-b border-gray-800 font-bold text-xs sm:text-sm text-white">
          Recent Payment Transactions
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-gray-850 text-gray-400 uppercase font-bold border-b border-gray-800 text-[10px] sm:text-xs">
              <tr>
                <th className="p-3 sm:p-4">Transaction ID</th>
                <th className="p-3 sm:p-4">Gross Fare</th>
                <th className="p-3 sm:p-4">Platform Fee (15%)</th>
                <th className="p-3 sm:p-4">Captain Cut</th>
                <th className="p-3 sm:p-4">Method</th>
                <th className="p-3 sm:p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-850/50 transition">
                  <td className="p-3 sm:p-4 font-mono font-bold text-white text-xs">{p.id}</td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm font-black text-white">₹{p.amount}</td>
                  <td className="p-3 sm:p-4 font-bold text-emerald-400 text-xs">+₹{p.commission_amount}</td>
                  <td className="p-3 sm:p-4 font-bold text-brand-yellow text-xs">₹{p.driver_amount}</td>
                  <td className="p-3 sm:p-4 uppercase font-bold text-gray-400 text-[11px]">{p.method}</td>
                  <td className="p-3 sm:p-4">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full text-[9.5px]">
                      <CheckCircle2 className="w-3 h-3" />
                      {p.status}
                    </span>
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
