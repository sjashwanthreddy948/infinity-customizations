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
  AlertCircle,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { BackButton } from '../common/BackButton.js';

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

export const QUOTATION_PRESETS = [
  { name: 'Custom Round Neck T-Shirt (100% Cotton, DTF Print)', defaultQty: 50, rate: 350 },
  { name: 'Custom Collar / Polo T-Shirt (Poly Cotton, Screen Print)', defaultQty: 50, rate: 380 },
  { name: 'Custom Oversized Streetwear T-Shirt (240 GSM Pure Cotton)', defaultQty: 30, rate: 480 },
  { name: 'Custom ID Cards + Multicolor Printed Lanyards + Holders', defaultQty: 100, rate: 70 },
  { name: 'Standard PVC ID Cards + Ribbon Lanyards', defaultQty: 100, rate: 55 },
  { name: 'Custom Premium Hoodies & Sweatshirts (320 GSM)', defaultQty: 25, rate: 750 },
  { name: 'Custom Embroidered Caps', defaultQty: 50, rate: 150 },
  { name: 'Custom DTF Printing Roll (per meter)', defaultQty: 10, rate: 280 }
];

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
      description: 'Custom Round Neck T-Shirt (100% Cotton, DTF Print)',
      quantity: 50,
      rate: 350,
      amount: 17500
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

  const addPresetItem = (preset: typeof QUOTATION_PRESETS[0]) => {
    const newId = String(Date.now());
    setItems(prev => [
      ...prev,
      {
        id: newId,
        description: preset.name,
        quantity: preset.defaultQty,
        rate: preset.rate,
        amount: preset.defaultQty * preset.rate
      }
    ]);
  };

  const applyPresetToRow = (id: string, presetName: string) => {
    const preset = QUOTATION_PRESETS.find(p => p.name === presetName);
    if (!preset) return;
    setItems(prev =>
      prev.map(it => {
        if (it.id !== id) return it;
        const qty = it.quantity > 0 ? it.quantity : preset.defaultQty;
        return {
          ...it,
          description: preset.name,
          quantity: qty,
          rate: preset.rate,
          amount: qty * preset.rate
        };
      })
    );
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
        valid_until: validUntil,
        notes: notes.trim(),
        terms: terms.trim(),
        items: items.map(it => ({
          description: it.description.trim() || 'Custom Merchandise Item',
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          amount: Number(it.amount) || 0
        })),
        subtotal,
        discount: Number(discount) || 0,
        tax_rate: Number(taxRate) || 0,
        tax_amount: taxAmount,
        grand_total: grandTotal
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || 'demo-jwt-usr-jashwanth-1-default'}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create quotation');
      }

      const created = await res.json();
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save quotation.');
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
          className="relative w-full max-w-4xl my-6 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-bold shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-[#0B3A82] dark:text-white flex items-center gap-2">
                  <span>CREATE FORMAL QUOTATION</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E]">
                    Infinity Customizations
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Itemized estimates for colleges, corporations, and client orders
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <BackButton onClick={onClose} label="Back" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Customer & Quote Details */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] block">
                  1. Client / Customer Details
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
                        placeholder="Enter customer or institution name"
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
                        placeholder="Enter phone number"
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
                        placeholder="Enter email address (optional)"
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
                        placeholder="Enter campus or delivery address"
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] block">
                      2. Quotation Line Items & Auto-Select Presets
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Select presets for instant pricing or add custom items
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#0B3A82] dark:bg-blue-950 dark:text-[#D4AF37] hover:bg-blue-100 font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Item</span>
                    </button>
                  </div>
                </div>

                {/* Auto-select preset quick pill buttons */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-blue-950/40 border border-amber-200/80 dark:border-blue-900/40 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Auto-Select Fast Product Presets (Click to add directly):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUOTATION_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => addPresetItem(p)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 hover:border-[#0B3A82] dark:hover:border-[#D4AF37] text-slate-800 dark:text-white font-semibold text-[10px] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <span>+ {p.name.split('(')[0].trim()}</span>
                        <strong className="text-[#0B3A82] dark:text-[#D4AF37]">₹{p.rate}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-blue-900/60 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#051E44] text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-blue-900/60 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Item Description & Auto-Select</th>
                        <th className="py-2.5 px-3 w-24 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-28 text-right">Unit Rate (₹)</th>
                        <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/20">
                          <td className="py-2 px-3 space-y-1">
                            <input
                              type="text"
                              required
                              placeholder="Enter item description"
                              value={item.description}
                              onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                            />
                            {/* In-Row Auto Select Dropdown */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                              <span>Auto-select:</span>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    applyPresetToRow(item.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                defaultValue=""
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-blue-950 border border-slate-200 dark:border-blue-900 text-slate-700 dark:text-slate-300 font-medium focus:outline-none"
                              >
                                <option value="" disabled>Choose product preset...</option>
                                {QUOTATION_PRESETS.map(p => (
                                  <option key={p.name} value={p.name}>
                                    {p.name} (₹{p.rate})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td className="py-2 px-3 align-top pt-3">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 text-center rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                            />
                          </td>
                          <td className="py-2 px-3 align-top pt-3">
                            <input
                              type="number"
                              min="0"
                              required
                              value={item.rate}
                              onChange={e => handleItemChange(item.id, 'rate', e.target.value)}
                              className="w-full px-2 py-1.5 text-right font-mono rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-slate-900 dark:text-white align-top pt-4">
                            ₹{(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-2 text-center align-top pt-3">
                            <button
                              type="button"
                              onClick={() => removeItemRow(item.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation Bar */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1.5 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      GST / Tax Rate
                    </label>
                    <select
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value) || 0)}
                      className="w-28 px-2 py-1.5 rounded-lg bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="0">0% (Nil)</option>
                      <option value="5">5% GST</option>
                      <option value="12">12% GST</option>
                      <option value="18">18% GST</option>
                    </select>
                  </div>
                </div>

                <div className="w-full sm:w-60 space-y-1.5 bg-white dark:bg-[#082A5E] p-3 rounded-xl border border-slate-200 dark:border-blue-900/60 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono font-bold">-₹{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>GST ({taxRate}%):</span>
                      <span className="font-mono font-bold">₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-[#0B3A82] dark:text-[#D4AF37] border-t border-slate-200 dark:border-blue-900/40 pt-1.5">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes & Payment Schedule
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter quotation notes / payment terms"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Validity & Production Terms
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter validity & delivery terms"
                    value={terms}
                    onChange={e => setTerms(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-300 dark:border-blue-900/60 text-slate-900 dark:text-white focus:outline-none focus:border-[#0B3A82]"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] flex items-center justify-between gap-3 shrink-0">
              <BackButton onClick={onClose} label="Back to Quotations" />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-blue-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md border border-[#D4AF37]/50 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isSubmitting ? 'Saving Quotation...' : 'Create Quotation (₹' + grandTotal.toLocaleString('en-IN') + ')'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NewQuotationModal;
