import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileText, Check, Truck, Package, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { BackButton } from '../common/BackButton.js';

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

const PRESET_PRODUCTS = [
  { name: 'Collar Polo T-Shirt (Pure Cotton, Custom Print)', rate: 550, tax_rate: 0 },
  { name: 'Round Neck T-Shirt (Pure Cotton, Custom Print)', rate: 450, tax_rate: 0 },
  { name: 'Collar Polo T-Shirt (Poly Cotton)', rate: 450, tax_rate: 0 },
  { name: 'Round Neck T-Shirt (Poly Cotton)', rate: 380, tax_rate: 0 },
  { name: 'Custom Oversized Streetwear T-Shirt (240 GSM)', rate: 480, tax_rate: 0 },
  { name: 'Custom Printed ID Card with Sublimation Lanyard', rate: 75, tax_rate: 0 },
  { name: 'PVC ID Card with Badge Clip / Yoyo Retractor', rate: 65, tax_rate: 0 },
  { name: 'Custom Embroidered / Printed Cap', rate: 250, tax_rate: 0 },
  { name: 'Custom Heavyweight Hoodie / Sweatshirt', rate: 850, tax_rate: 0 },
  { name: 'DTF Printing Film Roll (Per Meter)', rate: 300, tax_rate: 0 }
];

const PRESET_EXPENSES = [
  { name: 'Delivery / Rapido Logistics Charge', rate: 100, tax_rate: 0 },
  { name: 'Screen / DTF Printing Setup Fee', rate: 200, tax_rate: 0 },
  { name: 'Custom Graphic Design / Artwork Fee', rate: 250, tax_rate: 0 },
  { name: 'Express Rush Processing Fee', rate: 300, tax_rate: 0 }
];

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({ isOpen, onClose, defaultCustomerId }) => {
  const { token } = useAuth();
  const { success, error } = useToast();
  const { refreshTrigger } = useWebSocket();

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState(defaultCustomerId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('Thank you for choosing Infinity Customizations!');
  const [terms, setTerms] = useState('Payment is due upon receipt. Customized orders are non-refundable once printed.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [items, setItems] = useState<any[]>([
    { description: 'Custom Printed T-Shirt (Bio-wash Cotton, Custom Print)', quantity: 1, rate: 450, discount: 0, tax_rate: 0 }
  ]);

  useEffect(() => {
    if (!isOpen || !token) return;
    fetch('/api/customers', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        if (data.length > 0 && !customerId) {
          const first = data[0];
          setCustomerId(defaultCustomerId || first.id);
          setCustomerName(first.name);
          setCustomerPhone(first.phone);
        }
      })
      .catch(console.error);
  }, [isOpen, token, defaultCustomerId, refreshTrigger]);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = customers.find(x => x.id === id);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
    }
  };

  const handleAddItem = (preset?: { name: string; rate: number; tax_rate: number }) => {
    if (preset) {
      setItems(prev => [...prev, { description: preset.name, quantity: 1, rate: preset.rate, discount: 0, tax_rate: preset.tax_rate }]);
    } else {
      setItems(prev => [...prev, { description: '', quantity: 1, rate: 0, discount: 0, tax_rate: 0 }]);
    }
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

  // Live calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  items.forEach(it => {
    const raw = (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    const disc = raw * ((Number(it.discount) || 0) / 100);
    const taxable = raw - disc;
    const tax = taxable * ((Number(it.tax_rate) || 0) / 100);

    subtotal += raw;
    totalDiscount += disc;
    totalTax += tax;
  });

  const grandTotal = subtotal - totalDiscount + totalTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId && !customerName) {
      error('Please select or specify a customer');
      return;
    }
    if (items.some(i => !i.description || Number(i.rate) < 0)) {
      error('Please provide a valid description and rate for all line items');
      return;
    }

    setIsSubmitting(true);
    try {
      const processedItems = items.map(it => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate) || 0;
        const discPct = Number(it.discount) || 0;
        const taxRate = Number(it.tax_rate) || 0;
        const raw = qty * rate;
        const disc = raw * (discPct / 100);
        const taxable = raw - disc;
        const tax = taxable * (taxRate / 100);
        return {
          description: it.description,
          quantity: qty,
          rate,
          unit_price: rate,
          discount: discPct,
          tax_rate: taxRate,
          amount: Math.round(taxable + tax)
        };
      });

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId,
          customer_id: customerId,
          customerName,
          customer_name: customerName,
          customerPhone,
          customer_phone: customerPhone,
          issueDate,
          issue_date: issueDate,
          dueDate,
          due_date: dueDate,
          items: processedItems,
          subtotal: Math.round(subtotal),
          discount: Math.round(totalDiscount),
          tax_amount: Math.round(totalTax),
          grand_total: Math.round(grandTotal),
          amount_paid: 0,
          balance_due: Math.round(grandTotal),
          notes,
          terms
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      success(`Invoice ${data.invoice_number} created successfully!`, `Total: ₹${(Number(data.grand_total) || 0).toLocaleString('en-IN')}`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Error creating invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white text-slate-900 w-full max-w-4xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-slate-200 overflow-hidden flex flex-col my-0 sm:my-6 font-sans"
      >
        {/* Header - Royal Navy Bar with Gold Details */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 bg-[#082A5E] text-white border-b border-[#D4AF37]/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BackButton onClick={onClose} label="Back" />
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>CREATE NEW INVOICE</span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E]">
                  Infinity Customizations
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-300">Add merchandise items, Rapido shipping & other expenses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Pure White Background */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 max-h-none sm:max-h-[78vh] bg-white">
          
          {/* Customer & Date Selection */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-[#0B3A82] mb-1">Select Existing Customer</label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
              />
            </div>
          </div>

          {/* QUICK ADD ACTION BUTTONS: USER REQUESTED (ADD PRODUCTS & OTHER EXPENSES) */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#0B3A82] uppercase tracking-wider">Quick Add Presets</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Products:</span>
              {PRESET_PRODUCTS.slice(0, 6).map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleAddItem(p)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-blue-200 bg-blue-50/50 text-[#0B3A82] hover:bg-blue-100 transition-colors"
                >
                  + {p.name.split('(')[0].trim()} (₹{p.rate})
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Other Expenses:</span>
              {PRESET_EXPENSES.map(exp => (
                <button
                  key={exp.name}
                  type="button"
                  onClick={() => handleAddItem(exp)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors flex items-center gap-1"
                >
                  <Truck className="w-3 h-3 text-[#B89327]" />
                  <span>+ {exp.name} (₹{exp.rate})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0B3A82]">
                Invoice Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg bg-[#0B3A82] text-white hover:bg-[#082A5E] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Blank Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
                return (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white grid grid-cols-12 gap-2.5 items-center shadow-2xs">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Item Description</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                      />
                    </div>

                    <div className="col-span-3 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Rate (₹)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                      />
                    </div>

                    <div className="col-span-4 sm:col-span-1 text-right">
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">Amount</span>
                      <span className="text-xs font-black text-[#0B3A82]">₹{lineTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        disabled={items.length === 1}
                        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-xs text-slate-500 max-w-sm">
              <p>Notes: {notes}</p>
              <p className="text-[10px] text-slate-400">{terms}</p>
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-[#0B3A82] border-t-2 border-slate-300 pt-2">
                <span>Total Invoice Value:</span>
                <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Submit Actions: Sticky Bottom Bar */}
          <div className="sticky bottom-0 -mx-3.5 sm:-mx-6 -mb-3.5 sm:-mb-6 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-end gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{isSubmitting ? 'Generating Invoice...' : `Create Invoice (₹${grandTotal.toLocaleString('en-IN')})`}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
