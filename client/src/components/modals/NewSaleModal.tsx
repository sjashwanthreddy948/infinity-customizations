import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<any[]>([
    { description: 'Viral Social Media Reels/Shorts (Pack of 10)', quantity: 1, unit_price: 30000, discount: 0, tax_rate: 18 }
  ]);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        if (data.length > 0 && !customerId) setCustomerId(data[0].id);
      });
  }, [isOpen, token]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 18 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  let grandTotal = 0;
  items.forEach(it => {
    const raw = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0);
    const disc = raw * ((Number(it.discount) || 0) / 100);
    const taxable = raw - disc;
    const tax = taxable * ((Number(it.tax_rate) || 0) / 100);
    grandTotal += taxable + tax;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      error('Please select a customer');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          date,
          paymentMethod,
          paymentStatus,
          items,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record sale');

      success(`Sale ${data.sale_number} recorded!`, `Total: ₹${data.grand_total.toLocaleString('en-IN')}`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Error creating sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-3xl bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 my-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Record Direct Sale</h2>
                <p className="text-xs text-slate-500">Immediately records revenue & updates customer stats</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Customer *</label>
                <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700" required>
                  <option value="">Select Customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Date *</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700">
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Products & Services</h3>
                <button type="button" onClick={handleAddItem} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>

              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input type="text" placeholder="Description" value={it.description} onChange={(e) => handleItemChange(idx, 'description', e.target.value)} className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700" required />
                    <input type="number" min="1" placeholder="Qty" value={it.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="w-16 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-center" required />
                    <input type="number" min="0" placeholder="Price (₹)" value={it.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)} className="w-24 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-700 text-right font-mono" required />
                    <button type="button" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1} className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-30">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase">Grand Total (incl GST):</span>
              <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{Math.round(grandTotal).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50">
                {isSubmitting ? 'Recording...' : 'Record Sale'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
