import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Shirt,
  X,
  Printer,
  CreditCard,
  Trash2,
  ExternalLink,
  FileText,
  User,
  Phone,
  Layers,
  Sparkles,
  TrendingUp,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal.js';
import { calculateOrderPartnerShare } from '../../utils/partnerShare.js';

interface OrderQuickViewModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const OrderQuickViewModal: React.FC<OrderQuickViewModalProps> = ({
  order,
  isOpen,
  onClose,
  onDeleted
}) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !order) return null;

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.email?.includes('jashwanth');
  const fmt = (val: any) => (Number(val) || 0).toLocaleString('en-IN');

  const partnerShare = order.partner_share_allocation || calculateOrderPartnerShare(order);

  // Parse size breakdown
  const sizeEntries = order.tshirt_size_breakdown
    ? order.tshirt_size_breakdown.split(',').map((part: string) => {
        const [sz, qty] = part.split(':');
        return { size: sz?.trim() || '', quantity: qty?.trim() || '0' };
      }).filter((entry: any) => entry.size)
    : [];

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token || 'demo-jwt-usr-jashwanth-1-default'}`
        }
      });
      if (res.ok) {
        setShowDeleteConfirm(false);
        onClose();
        if (onDeleted) onDeleted();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete order');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete order');
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-2xl my-8 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-blue-900/60 bg-slate-50/80 dark:bg-[#051E44] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-bold shrink-0 shadow-xs">
                  {order.is_tshirt ? <Shirt className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black font-mono text-[#0B3A82] dark:text-white">
                      #{order.order_number}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.payment_status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : order.payment_status === 'PARTIALLY_PAID'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {order.payment_status === 'PAID' ? 'Paid' : order.payment_status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Date: <strong className="text-slate-800 dark:text-slate-200">{order.order_date}</strong> · Creator: <strong className="text-[#0B3A82] dark:text-[#D4AF37]">{order.created_by_name || 'Partner'}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
              {/* Customer & Product Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Customer Details</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0B3A82] dark:text-[#D4AF37]" />
                    <span>{order.customer_name}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{order.customer_phone}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Item & Batch Quantity</span>
                  <p className="text-sm font-bold text-[#0B3A82] dark:text-[#F5E7B2]">{order.product_name}</p>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-[#0B3A82] text-white font-bold text-xs">
                    {order.quantity} units
                  </span>
                </div>
              </div>

              {/* T-Shirt Specs & Size Breakdown if applicable */}
              {order.is_tshirt === 1 && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-[#0B3A82] dark:text-[#D4AF37] font-bold text-[11px]">
                        {order.tshirt_neck_type || 'Round Neck'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#D4AF37]/20 text-[#8C7118] dark:text-[#F5E7B2] font-bold text-[11px]">
                        {order.tshirt_fabric || 'Pure Cotton'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        Color: <strong className="text-slate-900 dark:text-white">{order.tshirt_color || 'Standard'}</strong>
                      </span>
                    </div>

                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Print: <strong className="text-slate-800 dark:text-slate-200">{order.tshirt_print_type || 'DTF Print'}</strong>
                      {order.print_meters > 0 && ` (${order.print_meters}m @ ₹${order.print_rate_per_meter || 300}/m)`}
                    </div>
                  </div>

                  {/* Size Breakdown */}
                  {sizeEntries.length > 0 ? (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1.5">
                        Size Distribution Breakdown:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {sizeEntries.map((entry: any, idx: number) => (
                          <div key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#082A5E] border border-blue-200 dark:border-blue-900/60 shadow-2xs flex items-center gap-1.5">
                            <span className="font-bold text-[#0B3A82] dark:text-[#D4AF37]">{entry.size}:</span>
                            <span className="font-black text-slate-800 dark:text-white">{entry.quantity} pcs</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : order.tshirt_size ? (
                    <p className="text-slate-700 dark:text-slate-300">
                      Standard Size: <strong className="text-[#0B3A82] dark:text-[#D4AF37]">{order.tshirt_size}</strong>
                    </p>
                  ) : null}
                </div>
              )}

              {/* ID Cards summary if present */}
              {order.has_id_cards === 1 && (
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        Custom Printed ID Cards & Lanyards
                      </span>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        {order.id_card_quantity} pcs @ ₹{order.id_card_unit_price || 0}/card
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">ID Card Total</span>
                    <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm">₹{fmt(order.id_card_total_price)}</span>
                  </div>
                </div>
              )}

              {/* Crystal-Clear Cost & Rate Calculation Table */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#0B3A82] dark:text-[#D4AF37]" />
                  <span>Cost & Production Line Breakdown</span>
                </h4>
                <div className="border border-slate-200 dark:border-blue-900/50 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#051E44] text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-blue-900/50 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Expense Head</th>
                        <th className="py-2.5 px-3 text-center">Qty / Metrics</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {order.is_tshirt ? 'Blank T-Shirt Procurement' : 'Base Material / Product'}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                          {order.quantity} pcs
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{order.quantity ? Math.round(order.product_cost / order.quantity) : 0}/pc
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          ₹{fmt(order.product_cost)}
                        </td>
                      </tr>

                      {Number(order.printing_cost) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            Printing (DTF / Screen)
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                            {order.print_meters > 0 ? `${order.print_meters} meters` : `${order.quantity} pcs`}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            {order.print_rate_per_meter ? `₹${order.print_rate_per_meter}/m` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            ₹{fmt(order.printing_cost)}
                          </td>
                        </tr>
                      )}

                      {order.has_id_cards === 1 && Number(order.id_card_total_cost) > 0 && (
                        <tr>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            ID Cards Production
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-700 dark:text-slate-300 font-bold">
                            {order.id_card_quantity} cards
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            ₹{order.id_card_unit_cost || 0}/card
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                            ₹{fmt(order.id_card_total_cost)}
                          </td>
                        </tr>
                      )}

                      {Number(order.tshirt_rapido_cost) > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">T-Shirt Rapido (Procurement)</td>
                          <td className="py-2 px-3 text-center text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">₹{fmt(order.tshirt_rapido_cost)}</td>
                        </tr>
                      )}

                      {Number(order.print_rapido_cost) > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">Print Rapido (Drop / Pickup)</td>
                          <td className="py-2 px-3 text-center text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">₹{fmt(order.print_rapido_cost)}</td>
                        </tr>
                      )}

                      {Number(order.delivery_cost) > 0 && (
                        <tr>
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-300">Customer Delivery / Rapido</td>
                          <td className="py-2 px-3 text-center text-slate-400">-</td>
                          <td className="py-2 px-3 text-right text-slate-400">-</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">₹{fmt(order.delivery_cost)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4 Financial Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Customer Price</span>
                  <p className="text-base font-black text-[#0B3A82] dark:text-white mt-0.5">
                    ₹{fmt(order.selling_price)}
                  </p>
                  <p className="text-[9px] text-slate-400">₹{order.quantity ? Math.round(order.selling_price / order.quantity) : 0}/unit</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Cost</span>
                  <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    ₹{fmt(order.total_cost)}
                  </p>
                  <p className="text-[9px] text-slate-400">Production + Rapido</p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-[#D4AF37]/50">
                  <span className="text-[10px] uppercase font-bold text-amber-900 dark:text-[#F5E7B2] block">Net Profit</span>
                  <p className="text-base font-black text-[#9A7B1C] dark:text-[#D4AF37] mt-0.5">
                    ₹{fmt(order.profit)}
                  </p>
                  <p className="text-[9px] text-[#8C7118] dark:text-[#F5E7B2] font-semibold">{order.profit_margin || 0}% margin</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Cash In Hand</span>
                  <p className={`text-base font-black mt-0.5 ${Number(order.available_amount) >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}`}>
                    ₹{fmt(order.available_amount)}
                  </p>
                  <p className="text-[9px] text-emerald-600/70">Advance - Cost</p>
                </div>
              </div>

              {/* 50/50 Equal Partnership Split Banner */}
              <div className="p-4 rounded-xl bg-[#082A5E] text-white border border-[#D4AF37]/40 flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#F5E7B2] block">
                    Equal 50/50 Partnership Split
                  </span>
                  <p className="text-lg font-black text-white mt-0.5">
                    Net Profit: <strong className="text-[#D4AF37]">₹{fmt(order.profit)}</strong>
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Calculated accurately per Infinity Customizations partnership agreement
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-white/10 border border-white/15 text-right space-y-1">
                  <p className="text-xs font-bold text-white">
                    Jashwanth: <strong className="text-[#D4AF37]">₹{fmt(partnerShare?.jashwanthShare ?? Math.round(order.profit / 2))}</strong>
                  </p>
                  <p className="text-xs font-bold text-white">
                    Rajshekar: <strong className="text-[#D4AF37]">₹{fmt(partnerShare?.rajshekarShare ?? Math.round(order.profit / 2))}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Left Admin Actions */}
              <div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Delete order (Admin only)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Order</span>
                  </button>
                )}
              </div>

              {/* Right User Actions */}
              <div className="flex items-center gap-2">
                {order.invoice_id && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate(`/invoices/${order.invoice_id}`);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#082A5E] text-[#0B3A82] dark:text-[#D4AF37] border border-slate-200 dark:border-blue-900/60 shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>View Invoice</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/orders/${order.id}`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md border border-[#D4AF37]/50 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Full Order View</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Order"
        itemIdentifier={`#${order.order_number}`}
        itemDescription={`Customer: ${order.customer_name} • Total: ₹${fmt(order.selling_price)}`}
        consequenceText="Deleting this order will permanently remove it and all related cost records from your ledger. This action cannot be undone."
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </>
  );
};
