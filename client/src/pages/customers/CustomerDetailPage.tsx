import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Plus, FileText, CreditCard, Phone, Mail, MapPin,
  Package, TrendingUp, IndianRupee, Eye, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import { NewOrderModal } from '../../components/modals/NewOrderModal.js';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      const token = localStorage.getItem('partnerledger_token');
      const res = await fetch(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCustomer(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading) {
    return <div className="p-16 text-center text-xs text-slate-400">Loading customer profile...</div>;
  }

  if (!customer) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-white">Customer not found</h2>
        <button onClick={() => navigate('/customers')} className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#0B3A82] text-white">
          Back to Customers
        </button>
      </div>
    );
  }

  const orders = customer.orders || [];
  const invoices = customer.invoices || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/customers')}
            className="p-2 rounded-xl border border-slate-200 dark:border-blue-900/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-950 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] dark:text-white">{customer.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-blue-900/60 font-mono text-slate-600 dark:text-slate-300">
                {customer.customer_code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {customer.phone}</span>
              {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>}
              {customer.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {customer.address}</span>}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md transition-all border border-[#D4AF37]/40 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ New Order for {customer.name.split(' ')[0]}</span>
        </button>
      </div>

      {/* 5 Core Customer Profile Metric Cards (Prompt Specified) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Orders</p>
          <p className="text-xl font-bold text-[#0B3A82] dark:text-white mt-1">{customer.total_orders || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold text-slate-400">Total Spent</p>
          <p className="text-xl font-bold text-[#172033] dark:text-white mt-1">₹{(customer.total_spent || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold text-slate-400">Amount Paid</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(customer.total_paid || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold text-slate-400">Amount Pending</p>
          <p className={`text-xl font-bold mt-1 ${(customer.outstanding_balance || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
            ₹{(customer.outstanding_balance || 0).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-blue-900/50 border border-[#D4AF37]/50 shadow-card col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase font-bold text-amber-800 dark:text-[#F5E7B2]">Profit Generated</p>
          <p className="text-xl font-black text-[#D4AF37] mt-1">₹{(customer.total_profit_generated || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Order History */}
      <div className="bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-100 dark:border-blue-900/50 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </h3>
        </div>

        {/* Mobile Order History Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-blue-900/30">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No orders recorded for this customer yet.</div>
          ) : (
            orders.map((o: any) => (
              <div
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-[#051E44] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-[#0B3A82] dark:text-[#D4AF37]">#{o.order_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    o.payment_status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}>
                    {o.payment_status}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">{o.product_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{o.order_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#0B3A82] dark:text-white">₹{o.selling_price.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] font-bold text-[#9A7B1C] dark:text-[#D4AF37]">+₹{o.profit.toLocaleString('en-IN')} profit</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Orders Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Product & Specs</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Profit</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-slate-400">No orders recorded for this customer yet.</td></tr>
              ) : (
                orders.map((o: any) => (
                  <tr key={o.id} onClick={() => navigate(`/orders/${o.id}`)} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0B3A82] dark:text-white">{o.order_number}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">{o.order_date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{o.product_name}</span>
                      {o.is_tshirt === 1 && o.tshirt_size && (
                        <span className="ml-1.5 text-[10px] font-bold text-[#0B3A82] dark:text-[#D4AF37]">
                          ({o.tshirt_size} · {o.tshirt_color})
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">₹{o.selling_price.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-black text-[#9A7B1C] dark:text-[#D4AF37]">₹{o.profit.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.payment_status === 'PAID' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{o.created_by_name}</td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.id}`); }} className="p-1 text-slate-400 hover:text-[#0B3A82]">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-100 dark:border-blue-900/50 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Invoice History ({invoices.length})</span>
          </h3>
        </div>

        {/* Mobile Invoice History Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-blue-900/30">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No invoices generated for this customer yet.</div>
          ) : (
            invoices.map((inv: any) => (
              <div
                key={inv.id}
                onClick={() => navigate(`/invoices/${inv.id}`)}
                className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-[#051E44] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-[#0B3A82] dark:text-[#D4AF37]">{inv.invoice_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                  }`}>
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Issued: {inv.issue_date}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">Total: ₹{inv.grand_total.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Balance Due</p>
                    <p className={`text-xs font-bold ${inv.balance_due > 0 ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-slate-500 dark:text-slate-400'}`}>
                      ₹{inv.balance_due.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Invoice Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {invoices.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No invoices generated for this customer yet.</td></tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv.id} onClick={() => navigate(`/invoices/${inv.id}`)} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors">
                    <td className="py-3 px-4 font-bold text-[#0B3A82] dark:text-white">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{inv.issue_date}</td>
                    <td className="py-3 px-4 text-right font-bold">₹{inv.grand_total.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">₹{inv.amount_paid.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-bold text-amber-600">₹{inv.balance_due.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }} className="p-1 text-slate-400 hover:text-[#0B3A82]">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewOrderModal
        isOpen={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
        onSuccess={() => fetchCustomer()}
        initialData={{
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email,
          customer_address: customer.address
        }}
      />
    </div>
  );
};
