import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, ArrowUpDown, Shirt, Package, Eye,
  IndianRupee, TrendingUp, AlertCircle, CheckCircle2, Clock, Sparkles, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { BackButton } from '../../components/common/BackButton.js';
import { NewOrderModal } from '../../components/modals/NewOrderModal.js';
import { OrderQuickViewModal } from '../../components/modals/OrderQuickViewModal.js';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal.js';
import { TableSkeleton } from '../../components/common/SkeletonLoader.js';
import { EmptyState } from '../../components/common/EmptyState.js';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [quickViewOrder, setQuickViewOrder] = useState<any | null>(null);
  const [deleteOrderTarget, setDeleteOrderTarget] = useState<any | null>(null);

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.email?.includes('jashwanth') || localStorage.getItem('infinity_admin_authenticated') === 'true';

  const isPartnershipOrder = (o: any) => {
    if (o.is_tshirt === 1 || o.has_id_cards === 1 || o.is_partner_shared === 1) return true;
    const prod = (o.product_type || o.product_name || '').toLowerCase();
    return prod.includes('t-shirt') || prod.includes('tshirt') || prod.includes('id card') || prod.includes('idcard') || prod.includes('cap');
  };

  const visibleOrders = isAdmin ? orders : orders.filter(isPartnershipOrder);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('partnerledger_token');
      let url = '/api/orders?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (productFilter) url += `product=${encodeURIComponent(productFilter)}&`;
      if (paymentFilter) url += `payment_status=${encodeURIComponent(paymentFilter)}&`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderTarget) return;
    try {
      const token = localStorage.getItem('partnerledger_token') || 'demo-jwt-usr-jashwanth-1-default';
      const res = await fetch(`/api/orders/${deleteOrderTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteOrderTarget(null);
        fetchOrders();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete order');
      }
    } catch (e) {
      console.error('Delete order error:', e);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, productFilter, paymentFilter]);

  // Aggregate stats of visible orders
  const totalRevenue = visibleOrders.reduce((sum, o) => sum + (o.selling_price || 0), 0);
  const totalCost = visibleOrders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
  const totalProfit = visibleOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalAvailable = visibleOrders.reduce((sum, o) => sum + (o.available_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Back to Dashboard Navigation */}
      <div className="flex items-center justify-between">
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
            <Shirt className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
            <span>Customer Orders</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track order intake, production costs, delivery & net profit per order
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => navigate('/ai-invoice')}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl border border-[#D4AF37]/60 bg-amber-50 dark:bg-amber-950/30 text-[#0B3A82] dark:text-[#F5E7B2] hover:bg-amber-100/80 transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>AI Fast Entry</span>
          </button>
          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] border border-[#D4AF37]/50"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ New Order</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Cards (Blue + Gold Accents) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[11px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Filtered Revenue</p>
          <p className="text-xl font-bold text-[#0B3A82] dark:text-white mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[11px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Total Order Costs</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{totalCost.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-blue-900/40 border border-[#D4AF37]/50 shadow-card">
          <p className="text-[11px] uppercase font-bold tracking-wider text-amber-900 dark:text-[#F5E7B2]">Net Calculated Profit</p>
          <p className="text-xl font-black text-[#9A7B1C] dark:text-[#D4AF37] mt-1">₹{totalProfit.toLocaleString('en-IN')}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[11px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Available Money</p>
          <p className={`text-xl font-bold mt-1 ${totalAvailable >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            ₹{totalAvailable.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Order #, Customer, Phone, Product, or Specifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full sm:w-auto px-2.5 sm:px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
          >
            <option value="">{isAdmin ? 'All Products' : 'All Shared Products'}</option>
            <option value="Custom Printed T-Shirt">T-Shirts</option>
            <option value="ID Card">ID Cards & Lanyards</option>
            <option value="Custom Cap">Caps</option>
            {isAdmin && (
              <>
                <option value="Photo Frame">Photo Frames</option>
                <option value="Bouquet">Bouquets</option>
                <option value="Custom Mug">Mugs</option>
                <option value="Personalized Album">Albums</option>
                <option value="Polaroid Prints (Pack of 20)">Polaroids</option>
                <option value="Customized Calendar">Calendars</option>
                <option value="Fridge Magnets (Set of 4)">Fridge Magnets</option>
              </>
            )}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full sm:w-auto px-2.5 sm:px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Mobile Orders Cards List (Shown on screens < md) */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <TableSkeleton rows={3} columns={2} />
        ) : visibleOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="No orders match your filter criteria. Record a new customized order to get started."
            actionLabel="+ New Order"
            onAction={() => setIsNewOrderOpen(true)}
          />
        ) : (
          visibleOrders.map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-sm active:bg-slate-50 dark:active:bg-[#06224E] transition-colors space-y-3 cursor-pointer"
            >
              {/* Card Header: Order #, Date, and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-[#0B3A82] dark:text-[#D4AF37]">#{o.order_number}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">{o.order_date}</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  o.payment_status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : o.payment_status === 'PARTIALLY_PAID'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  {o.payment_status === 'PAID' ? 'Paid' : o.payment_status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                </span>
              </div>

              {/* Customer & Product Info */}
              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{o.customer_name}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{o.customer_phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#0B3A82] dark:text-[#D4AF37] flex items-center justify-end gap-1">
                    <span>{o.product_name}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-blue-950 text-[10px] font-bold">x{o.quantity}</span>
                  </p>
                  {o.is_tshirt ? (
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                      <p className="font-semibold text-[#0B3A82] dark:text-[#F5E7B2]">
                        {o.tshirt_neck_type || 'Round Neck'} · {o.tshirt_fabric || 'Pure Cotton'}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {o.tshirt_size_breakdown || o.tshirt_size || 'Custom'} · {o.tshirt_color || 'Standard'}
                      </p>
                    </div>
                  ) : null}
                  {o.has_id_cards === 1 && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-[#0B3A82] dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800 text-[9px] font-bold">
                      + ID Cards ({o.id_card_quantity} pcs)
                    </span>
                  )}
                </div>
              </div>

              {/* 4 Financial Metrics in 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50">
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Customer Total</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">₹{o.selling_price?.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50">
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Total Cost</span>
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400">₹{o.total_cost?.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-[#D4AF37]/40">
                  <span className="text-[9px] uppercase font-bold text-amber-900 dark:text-[#F5E7B2] block">Net Profit</span>
                  <span className="text-xs font-black text-[#9A7B1C] dark:text-[#D4AF37]">₹{o.profit?.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50">
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Available Cash</span>
                  <span className={`text-xs font-black ${o.available_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                    ₹{o.available_amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Footer: Creator attribution, quick view, and admin delete */}
              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[9px] font-bold">
                    {o.created_by_name?.charAt(0) || 'P'}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{o.created_by_name}</span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setQuickViewOrder(o)}
                    className="p-1 rounded-lg bg-blue-50 text-[#0B3A82] dark:bg-blue-900/40 dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800 active:scale-95"
                    title="Quick Calculation View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteOrderTarget(o)}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"
                      title="Delete Order (Admin)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="text-[#0B3A82] dark:text-[#D4AF37] font-bold flex items-center gap-0.5 ml-1"
                  >
                    Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Orders Table (Hidden on mobile < md, shown on tablet/desktop) */}
      <div className="hidden md:block bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} columns={8} />
        ) : visibleOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders found"
            description="No orders match your filter criteria. Record a new customized order to get started."
            actionLabel="+ New Order"
            onAction={() => setIsNewOrderOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-blue-900/40 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Product & Specs</th>
                  <th className="py-3.5 px-4 text-right">Customer Total</th>
                  <th className="py-3.5 px-4 text-right">Total Cost</th>
                  <th className="py-3.5 px-4 text-right">Profit & Margin</th>
                  <th className="py-3.5 px-4 text-right">Available</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                {visibleOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/orders/${o.id}`)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0B3A82] dark:text-white flex items-center gap-1.5">
                        {o.order_number}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{o.order_date}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#172033] dark:text-slate-100">{o.customer_name}</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">{o.customer_phone}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {o.is_tshirt ? (
                          <span className="w-2 h-2 rounded-full bg-[#0B3A82]" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                        <span className="font-semibold text-[#172033] dark:text-slate-200">{o.product_name}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-blue-900/60 font-semibold text-slate-800 dark:text-slate-200">
                          x{o.quantity}
                        </span>
                      </div>
                      {o.is_tshirt ? (
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 space-y-0.5 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0B3A82] text-[9px] font-bold">
                              {o.tshirt_neck_type || 'Round Neck'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#D4AF37]/20 text-[#8C7118] text-[9px] font-bold">
                              {o.tshirt_fabric || 'Pure Cotton'}
                            </span>
                          </div>
                          {o.tshirt_size_breakdown ? (
                            <p className="font-semibold text-[#0B3A82]">
                              Sizes: <span className="font-bold text-slate-800 dark:text-slate-100">{o.tshirt_size_breakdown}</span>
                            </p>
                          ) : o.tshirt_size ? (
                            <p>
                              Size: <span className="font-bold text-slate-800 dark:text-slate-100">{o.tshirt_size}</span>
                            </p>
                          ) : null}
                          <p className="text-slate-600 dark:text-slate-300">
                            {o.tshirt_color || 'Standard'} · {o.tshirt_print_type || 'Print'}
                            {o.print_meters > 0 ? ` · ${o.print_meters}m print` : ''}
                          </p>
                          {o.has_id_cards === 1 && (
                            <p className="pt-0.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                                + ID Cards ({o.id_card_quantity} pcs)
                              </span>
                            </p>
                          )}
                        </div>
                      ) : (
                        o.has_id_cards === 1 && (
                          <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold">
                              + ID Cards ({o.id_card_quantity} pcs)
                            </span>
                          </div>
                        )
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-[#172033] dark:text-white">
                      ₹{o.selling_price.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-bold">
                      ₹{o.total_cost.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <p className="font-black text-[#9A7B1C] dark:text-[#D4AF37]">
                        ₹{o.profit.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-600 dark:text-slate-300 font-semibold">{o.profit_margin}% margin</p>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${o.available_amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                        ₹{o.available_amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.payment_status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : o.payment_status === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {o.payment_status === 'PAID' ? 'Paid' : o.payment_status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                          {o.created_by_name?.charAt(0) || 'P'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">
                          {o.created_by_name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setQuickViewOrder(o)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B3A82] dark:text-slate-300 dark:hover:text-[#D4AF37] hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                          title="Detailed Calculations (Eye View)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteOrderTarget(o)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Order (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSuccess={() => fetchOrders()}
      />

      {/* Quick View & Delete Modals */}
      <OrderQuickViewModal
        isOpen={!!quickViewOrder}
        order={quickViewOrder}
        onClose={() => setQuickViewOrder(null)}
        onDeleted={() => fetchOrders()}
      />

      <DeleteConfirmModal
        isOpen={!!deleteOrderTarget}
        title="Delete Order"
        itemIdentifier={`#${deleteOrderTarget?.order_number}`}
        itemDescription={`Customer: ${deleteOrderTarget?.customer_name} • Total: ₹${(Number(deleteOrderTarget?.selling_price) || 0).toLocaleString('en-IN')}`}
        consequenceText="Deleting this order will permanently remove it and all related cost records from your ledger."
        onClose={() => setDeleteOrderTarget(null)}
        onConfirm={handleDeleteOrder}
      />
    </div>
  );
};
