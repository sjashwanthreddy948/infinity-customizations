import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shirt, Printer, Download, CreditCard, History,
  FileText, CheckCircle2, Clock, AlertCircle, TrendingUp,
  User, Phone, Mail, MapPin, Calendar, Check, X, Layers, Tag, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateOrderPartnerShare } from '../../utils/partnerShare';

const fmt = (val: any) => (Number(val) || 0).toLocaleString('en-IN');

const formatDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return String(dateStr);
  }
};

const formatTime = (dateStr: any) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      setError('');
      let token = localStorage.getItem('partnerledger_token');
      if (!token) {
        token = 'demo-jwt-usr-jashwanth-1-default';
        localStorage.setItem('partnerledger_token', token);
      }
      const res = await fetch(`/api/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      const pending = data.payment_pending !== undefined 
        ? Number(data.payment_pending) 
        : Math.max(0, (Number(data.selling_price) || 0) - (Number(data.payment_received) || 0));
      data.payment_pending = pending;
      setOrder(data);
      if (pending > 0) {
        setPaymentAmount(pending.toString());
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('partnerledger_token');
      const res = await fetch(`/api/activity?search=${order?.order_number || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) return;

    setIsRecordingPayment(true);
    try {
      const token = localStorage.getItem('partnerledger_token');
      const res = await fetch(`/api/orders/${id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          payment_method: paymentMethod,
          notes: paymentNotes
        })
      });

      if (!res.ok) throw new Error('Payment recording failed');
      setIsPaymentOpen(false);
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsRecordingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400">
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{error || 'Order not found'}</h2>
        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#0B3A82] rounded-xl"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  const partnerShare = order?.partner_share_allocation || (order ? calculateOrderPartnerShare(order) : null);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-36 sm:pb-12">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl border border-slate-200 dark:border-blue-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#172033] dark:text-white">
                ORDER #{order.order_number}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                order.payment_status === 'PAID'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : order.payment_status === 'PARTIALLY_PAID'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                {order.payment_status === 'PAID' ? 'Paid' : order.payment_status === 'PARTIALLY_PAID' ? 'Partially Paid' : 'Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Created by <span className="font-semibold text-[#0B3A82] dark:text-[#D4AF37]">{order.created_by_name || 'Partner'}</span> · {formatDate(order.created_at || order.order_date)} {formatTime(order.created_at) ? `at ${formatTime(order.created_at)}` : ''}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {Number(order.payment_pending) > 0 && (
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>Mark Payment</span>
            </button>
          )}

          {order.invoice_id ? (
            <button
              onClick={() => navigate(`/invoices/${order.invoice_id}`)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md flex items-center gap-1.5 transition-all border border-[#D4AF37]/40"
            >
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>View Invoice ({order.invoice_number || 'INV'})</span>
            </button>
          ) : (
            <button
              onClick={() => navigate(`/invoices`)}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] text-white shadow-md flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Invoice</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsHistoryOpen(true);
              fetchHistory();
            }}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-950 flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4" />
            <span>View History</span>
          </button>
        </div>
      </div>

      {/* Main Order Card (White + Blue + Gold Accents) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Product, Customer & Specs */}
        <div className="md:col-span-2 space-y-6">
          {/* Product & Specifications Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B3A82] dark:text-[#D4AF37] flex items-center justify-center font-bold">
                  {order.is_tshirt ? <Shirt className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] dark:text-white">{order.product_name}</h3>
                  <p className="text-xs text-slate-400">Quantity: {order.quantity} units</p>
                </div>
              </div>
              <span className="text-lg font-black text-[#0B3A82] dark:text-white">
                ₹{fmt(order.selling_price)}
              </span>
            </div>

            {/* T-Shirt Multi-Variant / Single Variant Breakdown */}
            {order.is_tshirt === 1 && (() => {
              let parsedVariants: any[] = [];
              if (order.tshirt_variants) {
                try {
                  parsedVariants = typeof order.tshirt_variants === 'string' ? JSON.parse(order.tshirt_variants) : order.tshirt_variants;
                } catch (e) {
                  parsedVariants = [];
                }
              }

              return (
                <div className="space-y-4">
                  {/* Printing details bar */}
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Printer className="w-4 h-4 text-[#0B3A82]" />
                      <span className="font-bold text-[#0B3A82]">Print Method:</span>
                      <span className="font-semibold text-slate-700">{order.tshirt_print_type || 'DTF / Screen Print'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0B3A82]">Placements:</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-700">
                        {order.tshirt_front_print ? <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0B3A82] text-[10px] font-bold">Front</span> : null}
                        {order.tshirt_back_print ? <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0B3A82] text-[10px] font-bold">Back</span> : null}
                        {order.tshirt_sleeve_print ? <span className="px-2 py-0.5 rounded bg-blue-100 text-[#0B3A82] text-[10px] font-bold">Sleeve</span> : null}
                        {!order.tshirt_front_print && !order.tshirt_back_print && !order.tshirt_sleeve_print && (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </div>
                    </div>
                    {order.print_meters > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-bold text-[#0B3A82]">Meters:</span>
                        <span className="font-bold text-slate-800">{order.print_meters}m @ ₹{order.print_rate_per_meter || 300}/m</span>
                      </div>
                    )}
                  </div>

                  {/* If Multiple Variants */}
                  {parsedVariants.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#D4AF37]" />
                          <span>T-Shirt Styles & Batches ({parsedVariants.length})</span>
                        </p>
                        <span className="text-xs font-bold text-slate-500">
                          Total: {order.quantity} T-Shirts
                        </span>
                      </div>

                      {parsedVariants.map((v: any, idx: number) => {
                        const sizesObj = v.sizes || {};
                        const activeSizes = Object.entries(sizesObj).filter(([_, qty]) => Number(qty) > 0);
                        const vCost = (Number(v.cost_per_shirt) || 0) * (Number(v.quantity) || 0);
                        const vSell = (Number(v.selling_price_per_shirt) || 0) * (Number(v.quantity) || 0);
                        const vProfit = vSell - vCost;

                        return (
                          <div key={idx} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                  v.neck_type === 'Collar' 
                                    ? 'bg-[#0B3A82] text-white' 
                                    : 'bg-blue-100 text-[#0B3A82]'
                                }`}>
                                  {v.neck_type || 'Round Neck'}
                                </span>
                                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#D4AF37]/20 text-[#8C7118] border border-[#D4AF37]/30">
                                  {v.fabric || 'Pure Cotton'}
                                </span>
                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700">
                                  Color: <strong className="text-slate-900">{v.color || 'Standard'}</strong>
                                </span>
                              </div>
                              <span className="text-sm font-black text-[#0B3A82]">
                                {v.quantity} pcs
                              </span>
                            </div>

                            {/* Sizes for this variant */}
                            <div>
                              <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Size Breakdown</p>
                              {activeSizes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {activeSizes.map(([sz, qty]) => (
                                    <div key={sz} className="px-3 py-1 bg-white border border-blue-200 rounded-lg shadow-xs flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-[#0B3A82] uppercase">{sz}:</span>
                                      <span className="text-xs font-black text-slate-800">{Number(qty)} pcs</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 italic">No specific size breakdown</p>
                              )}
                            </div>

                            {/* Cost and Selling for this variant */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
                              <div className="p-2 rounded-lg bg-white border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Blank Cost</p>
                                <p className="font-bold text-slate-700">₹{v.cost_per_shirt || 0} <span className="text-[10px] text-slate-400">/pc</span></p>
                                <p className="text-[10px] font-semibold text-slate-400">Total: ₹{fmt(vCost)}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400">Selling Price</p>
                                <p className="font-bold text-[#0B3A82]">₹{v.selling_price_per_shirt || 0} <span className="text-[10px] text-slate-400">/pc</span></p>
                                <p className="text-[10px] font-semibold text-slate-400">Total: ₹{fmt(vSell)}</p>
                              </div>
                              <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100">
                                <p className="text-[10px] uppercase font-bold text-emerald-700">Est. Profit</p>
                                <p className="font-black text-emerald-600">₹{fmt(vProfit)}</p>
                                <p className="text-[10px] font-semibold text-emerald-600/70">+₹{(v.selling_price_per_shirt || 0) - (v.cost_per_shirt || 0)}/pc</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Single T-Shirt Configuration */
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Neck Style</p>
                          <p className="text-sm font-bold text-[#0B3A82] mt-0.5">{order.tshirt_neck_type || 'Round Neck'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Fabric Quality</p>
                          <p className="text-sm font-bold text-[#D4AF37] mt-0.5">{order.tshirt_fabric || 'Pure Cotton'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Color</p>
                          <p className="text-sm font-bold text-[#172033] mt-0.5">{order.tshirt_color || 'Standard'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Quantity</p>
                          <p className="text-sm font-black text-[#0B3A82] mt-0.5">{order.quantity} pcs</p>
                        </div>
                      </div>

                      {/* Sizing Breakdown */}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Size Breakdown</p>
                        {order.tshirt_size_breakdown ? (
                          <div className="flex flex-wrap gap-2">
                            {order.tshirt_size_breakdown.split(',').map((part: string, idx: number) => {
                              const trimmed = part.trim();
                              if (!trimmed) return null;
                              const [size, qty] = trimmed.split(':');
                              return (
                                <div key={idx} className="px-3 py-1 bg-white border border-[#0B3A82]/30 rounded-lg shadow-xs flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-[#0B3A82]">{size?.trim()}:</span>
                                  <span className="text-xs font-black text-slate-800">{qty?.trim() || '0'} pcs</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs font-bold text-[#0B3A82]">{order.tshirt_size || 'Standard Size'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Non-T-Shirt Merchandise Details Card */}
            {!order.is_tshirt && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-blue-950/40 border border-slate-200 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-1.5">
                    <Tag className="w-4 h-4" />
                    <span>Product Summary</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                    Sole Merchandise (100% Jashwanth)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Unit Selling Price</p>
                    <p className="font-bold text-[#0B3A82] dark:text-white mt-0.5">₹{fmt(order.quantity ? Math.round(order.selling_price / order.quantity) : order.selling_price)} / unit</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Unit Cost</p>
                    <p className="font-bold text-rose-600 dark:text-rose-400 mt-0.5">₹{fmt(order.quantity ? Math.round(order.total_cost / order.quantity) : order.total_cost)} / unit</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Unit Profit</p>
                    <p className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5">₹{fmt(order.quantity ? Math.round(order.profit / order.quantity) : order.profit)} / unit</p>
                  </div>
                </div>
              </div>
            )}

            {/* ID Cards Section if Included */}
            {order.has_id_cards === 1 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 via-white to-amber-50/50 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0B3A82]">Custom Printed ID Cards & Lanyards</h4>
                      <p className="text-[11px] text-slate-500">{order.id_card_type || 'ID Card + Multicolor Printed Lanyard'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    {order.id_card_quantity} cards
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-100 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Blank + Print Cost</p>
                    <p className="font-bold text-slate-800">₹{order.id_card_unit_cost || 0} <span className="text-[10px] text-slate-400">/card</span></p>
                    <p className="text-[10px] font-bold text-rose-600">Total: ₹{fmt(order.id_card_total_cost)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Customer Price</p>
                    <p className="font-bold text-[#0B3A82]">₹{order.id_card_unit_price || 0} <span className="text-[10px] text-slate-400">/card</span></p>
                    <p className="text-[10px] font-bold text-blue-700">Total: ₹{fmt(order.id_card_total_price)}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">ID Cards Profit</p>
                    <p className="font-black text-emerald-700 text-sm">
                      ₹{fmt((order.id_card_total_price || 0) - (order.id_card_total_cost || 0))}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">+₹{(order.id_card_unit_price || 0) - (order.id_card_unit_cost || 0)}/card</p>
                  </div>
                </div>
              </div>
            )}

            {order.notes && (
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1">Customer Notes / Instructions</p>
                <p className="text-xs text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-200 italic">
                  "{order.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Customer Information Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] flex items-center gap-2">
              <User className="w-4 h-4 text-[#D4AF37]" />
              <span>Customer Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-700">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700">{order.customer_email}</span>
                </div>
              )}
              {order.customer_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-700">{order.customer_address}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financials, Cost Breakdown & Profit Card */}
        <div className="space-y-6">
          {/* EXACT PROMPT FINANCIAL CARD */}
          <div className="p-6 rounded-2xl bg-[#082A5E] text-white border border-[#D4AF37]/50 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F5E7B2]">Customer Payment</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#D4AF37]">Total Order Price</span>
              </div>
              <p className="text-3xl font-black text-white mt-1">₹{fmt(order.selling_price)}</p>
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37]">Production & Logistics Cost Breakdown</p>

              <div className="flex justify-between text-xs text-slate-300">
                <span>{order.is_tshirt ? 'T-Shirt Blank Procurement' : 'Product / Material Cost'}</span>
                <span className="font-semibold text-white">₹{fmt(order.product_cost)}</span>
              </div>

              {order.has_id_cards === 1 && (Number(order.id_card_total_cost) > 0) && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>ID Cards Production ({order.id_card_quantity} pcs @ ₹{order.id_card_unit_cost || 0})</span>
                  <span className="font-semibold text-white">₹{fmt(order.id_card_total_cost)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-300">
                <span>
                  Printing
                  {order.print_meters > 0
                    ? ` (${order.print_meters}m @ ₹${order.print_rate_per_meter || 300}/m)`
                    : ''}
                </span>
                <span className="font-semibold text-white">₹{fmt(order.printing_cost)}</span>
              </div>

              {(Number(order.tshirt_rapido_cost) > 0) && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>T-Shirt Rapido (Procurement)</span>
                  <span className="font-semibold text-white">₹{fmt(order.tshirt_rapido_cost)}</span>
                </div>
              )}

              {(Number(order.print_rapido_cost) > 0) && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Print Rapido (Drop / Pickup)</span>
                  <span className="font-semibold text-white">₹{fmt(order.print_rapido_cost)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-300">
                <span>Customer Delivery / Rapido</span>
                <span className="font-semibold text-white">₹{fmt(order.delivery_cost)}</span>
              </div>

              {Number(order.other_cost) > 0 && (
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Other / Packaging</span>
                  <span className="font-semibold text-white">₹{fmt(order.other_cost)}</span>
                </div>
              )}

              <div className="border-t border-white/15 pt-2 flex justify-between text-xs font-black text-rose-300">
                <span>TOTAL ORDER COST</span>
                <span className="text-rose-200">₹{fmt(order.total_cost)}</span>
              </div>
            </div>

            {/* Profits & Balances */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#F5E7B2]">NET PROFIT</p>
                  <p className="text-2xl font-black text-[#D4AF37]">₹{fmt(order.profit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-[#F5E7B2]">PROFIT MARGIN</p>
                  <p className="text-lg font-bold text-white">{order.profit_margin || 0}%</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-300">AVAILABLE CASH IN HAND</p>
                  <p className={`text-lg font-black ${Number(order.available_amount) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    ₹{fmt(order.available_amount)}
                  </p>
                  <p className="text-[9px] text-slate-400">Advance Received - Total Cost</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-semibold text-slate-300">ADVANCE RECEIVED</p>
                  <p className="text-base font-bold text-emerald-300">₹{fmt(order.payment_received)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Summary */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Payment Collection</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer Total:</span>
                <span className="font-bold text-[#172033] dark:text-white">₹{fmt(order.selling_price)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Amount Paid:</span>
                <span className="font-bold">₹{fmt(order.payment_received)}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400 border-t border-slate-100 dark:border-blue-900/40 pt-1.5">
                <span>Pending Balance:</span>
                <span className="font-bold">₹{fmt(order.payment_pending)}</span>
              </div>
            </div>
          </div>

          {/* DUAL-PARTNER PROFIT ALLOCATION CARD */}
          {partnerShare && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37]">
                  Partner Profit Split
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  partnerShare.isShared
                    ? 'bg-blue-50 text-[#0B3A82] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {partnerShare.isShared ? '🤝 Shared Category (50/50)' : '🔒 Sole Merchandise (100% Jashwanth)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37]">
                    Jashwanth Reddy
                  </span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    ₹{fmt(partnerShare?.jashwanthShare)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {partnerShare.isShared ? '50% Shared Profit' : '100% Retained Profit'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                    Rajshekar Reddy
                  </span>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">
                    ₹{fmt(partnerShare?.rajshekarShare)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {partnerShare.isShared ? '50% Shared Profit' : 'Excluded from Share (₹0)'}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-blue-50/50 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-100/60 dark:border-blue-900/40 leading-relaxed">
                {partnerShare.explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#082A5E] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
              <h3 className="font-bold text-[#172033] dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Record Customer Payment</span>
              </h3>
              <button onClick={() => setIsPaymentOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-[#172033] dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">Pending: ₹{fmt(order.payment_pending)}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-[#172033] dark:text-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference / Transaction Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref #89324021..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-[#172033] dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-blue-900/40">
                <button
                  type="button"
                  onClick={() => setIsPaymentOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
                >
                  {isRecordingPayment ? 'Saving...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#082A5E] w-full max-w-md h-full p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
              <h3 className="font-bold text-[#172033] dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#0B3A82] dark:text-[#D4AF37]" />
                <span>Partner Activity History</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No specific activity logs found for this order.</p>
              ) : (
                activityLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-blue-950/40 border border-slate-100 dark:border-blue-900/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0B3A82] dark:text-[#D4AF37]">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200">{log.action}: {log.reason || 'Action executed'}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Mobile Sticky Quick Action Bar */}
      <div className="sm:hidden fixed bottom-16 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center gap-2 shadow-lg">
        {Number(order.payment_pending) > 0 ? (
          <button
            onClick={() => setIsPaymentOpen(true)}
            className="flex-1 py-2.5 px-3 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <CreditCard className="w-4 h-4" />
            <span>Mark Payment (₹{fmt(order.payment_pending)})</span>
          </button>
        ) : null}

        {order.invoice_id ? (
          <button
            onClick={() => navigate(`/invoices/${order.invoice_id}`)}
            className="py-2.5 px-3 text-xs font-bold rounded-xl bg-[#0B3A82] text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4 text-[#D4AF37]" />
            <span>Invoice</span>
          </button>
        ) : (
          <button
            onClick={() => navigate(`/invoices`)}
            className="py-2.5 px-3 text-xs font-bold rounded-xl bg-[#0B3A82] text-white shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          >
            <FileText className="w-4 h-4" />
            <span>New Invoice</span>
          </button>
        )}
      </div>
    </div>
  );
};
