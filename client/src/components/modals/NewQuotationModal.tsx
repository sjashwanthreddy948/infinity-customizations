import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  FileSpreadsheet,
  Calculator,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface NewQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newQuote: any) => void;
}

interface QuoteItemInput {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const NewQuotationModal: React.FC<NewQuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { token, user } = useAuth();

  // Customer Information
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Validity and Notes
  const defaultValidUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [notes, setNotes] = useState(
    'Payment Terms: 50% advance to confirm order and start production; balance 50% upon delivery.'
  );
  const [terms, setTerms] = useState(
    'Quotation valid for 15 days from issue date. Delivery within 5-7 business days from sample approval.'
  );

  // Line items
  const [items, setItems] = useState<QuoteItemInput[]>([
    {
      id: '1',
      description: 'Round Neck 100% Cotton Customized T-Shirts (DTF Print)',
      quantity: 50,
      rate: 320,
      amount: 16000
    }
  ]);

  // Tax & Discount
  const [discount, setDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0); // 0%, 5%, 12%, 18%
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Calculation logic
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const taxAmount = Math.round(discountedSubtotal * ((Number(taxRate) || 0) / 100));
  const grandTotal = discountedSubtotal + taxAmount;

  const handleItemChange = (id: string, field: keyof QuoteItemInput, value: any) => {
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          const qty = field === 'quantity' ? Number(value) || 0 : Number(it.quantity) || 0;
          const r = field === 'rate' ? Number(value) || 0 : Number(it.rate) || 0;
          updated.amount = qty * r;
        }
        return updated;
      })
    );
  };

  const addItemRow = () => {
    const newId = String(Date.now());
    setItems(prev => [
      ...prev,
      {
        id: newId,
        description: '',
        quantity: 10,
        rate: 300,
        amount: 3000
      }
    ]);
  };

  const removeItemRow = (id: string) => {
    if (items.length <= 1) {
      alert('A quotation must contain at least 1 item.');
      return;
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Customer contact phone number is required.');
      return;
    }
    if (items.length === 0 || subtotal <= 0) {
      setError('Please add at least one item with valid quantity and rate.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        items: items.map(it => ({
          description: it.description.trim() || 'Custom Item',
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          amount: (Number(it.quantity) || 1) * (Number(it.rate) || 0)
        })),
        subtotal,
        discount: Number(discount) || 0,
        tax_rate: Number(taxRate) || 0,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        valid_until: validUntil,
        status: 'SENT',
        notes: notes.trim(),
        terms: terms.trim()
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'demo-jwt-usr-jashwanth-1-default'}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess(data);
        onClose();
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to create quotation');
      }
    } catch (err) {
      console.error('Create quotation error:', err);
      setError('An error occurred while creating the quotation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-3xl my-8 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-blue-900/60 bg-slate-50/80 dark:bg-[#051E44] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-bold shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0B3A82] dark:text-white">
                  Create New Quotation / Estimate
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generate professional quotation for prospective merchandise orders
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Details */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] block">
                1. Customer & College / Corporate Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Institution Name *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. BVRIT Hyderabad / TCS Hyderabad"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B3A82]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98490 12345"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B3A82]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="coordinator@college.ac.in"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B3A82]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quote Valid Until (Date)
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery / Campus Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. BVRIT Campus, Bachupally, Hyderabad"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B3A82]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Multi-Product Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37]">
                  2. Quotation Line Items & Unit Rates
                </span>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B3A82] dark:bg-blue-950 dark:text-[#D4AF37] hover:bg-blue-100 font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Item</span>
                </button>
              </div>

              <div className="border border-slate-200 dark:border-blue-900/60 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-[#051E44] text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-blue-900/60 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/20">
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Round Neck Pure Cotton T-Shirt with DTF Print"
                            value={item.description}
                            onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.quantity}
                            onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 text-center font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            required
                            value={item.rate}
                            onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                            className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 text-right font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white">
                          ₹{(item.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations & Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Terms & Notes */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Terms & Advance Note
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3A82]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Terms & Delivery Timelines
                  </label>
                  <textarea
                    rows={2}
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0B3A82]"
                  />
                </div>
              </div>

              {/* Right Column: Calculations Breakdown Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Items Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ₹{subtotal.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">Special Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value) || 0)}
                    className="w-24 px-2 py-1 text-right font-mono font-bold rounded-lg border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#082A5E] text-emerald-600"
                  />
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">GST / Tax Rate (%):</span>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-24 px-2 py-1 text-right font-bold rounded-lg border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#082A5E] text-slate-900 dark:text-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Apparel)</option>
                    <option value={12}>12% (Print)</option>
                    <option value={18}>18% (Standard)</option>
                  </select>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Calculated GST ({taxRate}%):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      +₹{taxAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-blue-900/60 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37]">
                    Quotation Total:
                  </span>
                  <span className="text-lg font-black font-mono text-[#0B3A82] dark:text-[#D4AF37]">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-blue-900/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md border border-[#D4AF37]/50 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                <span>{isSubmitting ? 'Generating Quotation...' : 'Create & Send Quotation'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
