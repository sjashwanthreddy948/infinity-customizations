import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Search, Filter, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal.js';
import { BackButton } from '../../components/common/BackButton.js';
import { Payment } from '../../types/index.js';

export const PaymentsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshTrigger } = useWebSocket();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  const fetchPayments = async () => {
    if (!token) return;
    try {
      let url = `/api/payments?method=${selectedMethod}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [token, selectedMethod, search, refreshTrigger]);

  const currencySymbol = user?.currency_symbol || '₹';

  return (
    <div className="space-y-6">
      <div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Payments Received
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-tracked collections, UTR reference tracking & account deposits
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/40 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment #, customer, or UTR..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
          />
        </div>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
        >
          <option value="ALL">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Cheque">Cheque</option>
        </select>
      </div>

      {/* Mobile Payments Cards (Phones < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">No payments recorded.</div>
        ) : (
          payments.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-xs text-[#0B3A82] font-mono">{p.payment_number}</span>
                  <p className="font-bold text-sm text-slate-900 mt-0.5">{p.customer_name || 'General Payment'}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">
                  {p.method}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{p.date}</span>
                {p.invoice_number && <span className="font-mono text-[11px] text-slate-600">Inv: {p.invoice_number}</span>}
              </div>

              {p.reference_number && (
                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  UTR / Ref: {p.reference_number}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                    {p.recorded_by_name?.charAt(0) || 'P'}
                  </span>
                  <span>{p.recorded_by_name}</span>
                </div>
                <div className="text-right font-mono font-black text-emerald-600 text-sm">
                  {currencySymbol}{p.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Payments Table (Hidden on phones < md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading payments...</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No payments recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Record cash, UPI, or bank transfer payments to reconcile customer invoices.
            </p>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 rounded-xl bg-[#0B3A82] text-white font-bold text-xs shadow-md">
              Record Payment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-navy-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Payment #</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Linked Invoice</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference (UTR)</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/40 dark:hover:bg-navy-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B3A82] dark:text-blue-400">
                      {p.payment_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-medium">{p.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {p.customer_name || 'General Payment'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {p.invoice_number || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {p.method}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {p.reference_number || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {currencySymbol}{p.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{p.recorded_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecordPaymentModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};
