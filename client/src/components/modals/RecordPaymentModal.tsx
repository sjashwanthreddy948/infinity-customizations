import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultInvoiceId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, defaultInvoiceId }) => {
  const { token, user } = useAuth();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(defaultInvoiceId || '');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetch('/api/invoices?status=SENT', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        // combine with partial and overdue
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(all => {
            const pending = all.filter((inv: any) => inv.balance_due > 0 && inv.status !== 'VOID');
            setInvoices(pending);
            if (defaultInvoiceId) {
              const match = pending.find((i: any) => i.id === defaultInvoiceId);
              if (match) {
                setSelectedInvoiceId(match.id);
                setAmount(String(match.balance_due));
              }
            } else if (pending.length > 0 && !selectedInvoiceId) {
              setSelectedInvoiceId(pending[0].id);
              setAmount(String(pending[0].balance_due));
            }
          });
      });
  }, [isOpen, token, defaultInvoiceId]);

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const inv = invoices.find(i => i.id === id);
    if (inv) {
      setAmount(String(inv.balance_due));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      error('Please enter a valid payment amount');
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = '/api/payments';
      let body: any = {
        amount,
        method,
        referenceNumber,
        date,
        notes
      };

      if (selectedInvoiceId) {
        endpoint = `/api/invoices/${selectedInvoiceId}/payments`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      success(`Payment recorded successfully!`, `Amount: ₹${Number(amount).toLocaleString('en-IN')} via ${method}`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Error recording payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentInv = invoices.find(i => i.id === selectedInvoiceId);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto my-auto bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10"
        >
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#0B3A82] dark:text-[#D4AF37]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Payment</h2>
                <p className="text-xs text-slate-500">Reconciles invoices & updates bank/cash balances</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Link to Invoice (Optional)
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
              >
                <option value="">General Payment / Direct Customer</option>
                {invoices.map(inv => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.customer_name} (Due: ₹{inv.balance_due.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {currentInv && (
              <div className="p-3 bg-blue-50/60 dark:bg-navy-800 rounded-xl border border-blue-100 dark:border-blue-900/40 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-xs">
                <div>
                  <span className="text-slate-500">Customer: </span>
                  <strong className="text-[#0B3A82] dark:text-[#D4AF37]">{currentInv.customer_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Pending Balance: </span>
                  <strong className="text-slate-900 dark:text-white font-mono">
                    ₹{currentInv.balance_due.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Payment Method *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                >
                  <option value="UPI">UPI (Google Pay/PhonePe/Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Reference / UTR / Cheque #
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. UTR1982739182"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bank confirmation remarks or invoice milestone..."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/30 disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
