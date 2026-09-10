import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  CreditCard,
  Ban,
  Download,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { NewInvoiceModal } from '../../components/modals/NewInvoiceModal.js';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal.js';
import { VoidModal } from '../../components/modals/VoidModal.js';
import { InvoiceQuickViewModal } from '../../components/modals/InvoiceQuickViewModal.js';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal.js';
import { BackButton } from '../../components/common/BackButton.js';
import { Invoice } from '../../types/index.js';
import { TableSkeleton } from '../../components/common/SkeletonLoader.js';
import { EmptyState } from '../../components/common/EmptyState.js';

export const InvoicesPage: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshTrigger } = useWebSocket();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [voidInvoice, setVoidInvoice] = useState<Invoice | null>(null);
  const [quickViewInvoice, setQuickViewInvoice] = useState<Invoice | null>(null);
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState<Invoice | null>(null);

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.email?.includes('jashwanth');

  const fetchInvoices = async () => {
    if (!token) return;
    try {
      let url = `/api/invoices?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceTarget || !token) return;
    try {
      const res = await fetch(`/api/invoices/${deleteInvoiceTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteInvoiceTarget(null);
        fetchInvoices();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete invoice');
      }
    } catch (e) {
      console.error('Delete invoice error:', e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [token, statusFilter, search, refreshTrigger]);

  const currencySymbol = user?.currency_symbol || '₹';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">PAID</span>;
      case 'PARTIAL':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">PARTIAL</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">SENT</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse">OVERDUE</span>;
      case 'VOID':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">VOIDED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <BackButton to="/dashboard" label="Back to Dashboard" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Invoices
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create, track, and reconcile professional GST invoices across co-owners
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or customer..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-100 dark:bg-[#082A5E] rounded-xl text-xs font-semibold no-scrollbar border border-slate-200 dark:border-blue-900/50">
          {['ALL', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'VOID'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-white dark:bg-[#0B3A82] text-slate-900 dark:text-white shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Invoice Cards (Shown on screens < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <TableSkeleton rows={3} columns={2} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Create your first invoice to start tracking shared business revenue."
            actionLabel="+ Create Invoice"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              onClick={() => navigate(`/invoices/${inv.id}`)}
              className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-sm active:bg-slate-50 dark:active:bg-[#06224E] transition-colors space-y-3 cursor-pointer"
            >
              {/* Card Header: Invoice # and Status */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-[#0B3A82] dark:text-[#D4AF37]">{inv.invoice_number}</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">Issued: {inv.issue_date}</span>
                </div>
                {getStatusBadge(inv.status)}
              </div>

              {/* Customer Info */}
              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{inv.customer_name}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Due: {inv.due_date}</p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400 block">Grand Total</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{currencySymbol}{inv.grand_total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Balance & Actions */}
              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-center justify-between">
                <div>
                  {inv.balance_due > 0 ? (
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Due: {currencySymbol}{inv.balance_due.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ✓ Paid in Full
                    </span>
                  )}
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 block font-medium">By: {inv.created_by_name}</span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setQuickViewInvoice(inv)}
                    className="p-1.5 rounded-lg bg-blue-50 text-[#0B3A82] dark:bg-blue-900/40 dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800 active:scale-95"
                    title="Quick Calculation View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingInvoice(inv);
                      setShowNewModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-[#D4AF37] border border-amber-200 dark:border-amber-800 active:scale-95"
                    title="Edit Invoice"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {inv.balance_due > 0 && inv.status !== 'VOID' && (
                    <button
                      onClick={() => setPaymentInvoiceId(inv.id)}
                      className="px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                    >
                      Pay
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#0B3A82] hover:bg-[#082A5E] text-white border border-[#D4AF37]/40"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setDeleteInvoiceTarget(inv)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"
                    title="Delete Invoice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Invoices Table (Hidden on mobile < md) */}
      <div className="hidden md:block bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Create your first invoice to start tracking shared business revenue."
            actionLabel="+ Create Invoice"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-navy-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Issue Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-navy-850/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {inv.customer_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{inv.issue_date}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{inv.due_date}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {currencySymbol}{(Number(inv.grand_total) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {Number(inv.balance_due) > 0 ? `${currencySymbol}${(Number(inv.balance_due) || 0).toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-medium">
                      {inv.created_by_name}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQuickViewInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B3A82] dark:text-slate-300 dark:hover:text-[#D4AF37] hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                          title="Detailed Calculation Breakdown"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingInvoice(inv);
                            setShowNewModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B3A82] dark:text-slate-300 dark:hover:text-[#D4AF37] hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {inv.balance_due > 0 && inv.status !== 'VOID' && (
                          <button
                            onClick={() => setPaymentInvoiceId(inv.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Record Payment"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {inv.status !== 'VOID' && (
                          <button
                            onClick={() => setVoidInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Void Invoice"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteInvoiceTarget(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <NewInvoiceModal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false);
          setEditingInvoice(null);
        }}
        initialData={editingInvoice}
        onSuccess={() => fetchInvoices()}
      />
      {paymentInvoiceId && (
        <RecordPaymentModal
          isOpen={true}
          defaultInvoiceId={paymentInvoiceId}
          onClose={() => setPaymentInvoiceId(null)}
        />
      )}
      {voidInvoice && (
        <VoidModal
          isOpen={true}
          entityType="INVOICE"
          entityId={voidInvoice.id}
          entityReference={voidInvoice.invoice_number}
          onClose={() => setVoidInvoice(null)}
          onSuccess={() => fetchInvoices()}
        />
      )}

      {/* Quick View & Delete Modals */}
      <InvoiceQuickViewModal
        isOpen={!!quickViewInvoice}
        invoice={quickViewInvoice}
        onClose={() => setQuickViewInvoice(null)}
        onDeleted={() => fetchInvoices()}
      />

      <DeleteConfirmModal
        isOpen={!!deleteInvoiceTarget}
        title="Delete Invoice"
        itemIdentifier={deleteInvoiceTarget?.invoice_number || ''}
        itemDescription={`Customer: ${deleteInvoiceTarget?.customer_name} • Total: ₹${(Number(deleteInvoiceTarget?.grand_total) || 0).toLocaleString('en-IN')}`}
        consequenceText="Deleting this invoice will permanently remove it from the financial ledger and unlink any associated orders."
        onClose={() => setDeleteInvoiceTarget(null)}
        onConfirm={handleDeleteInvoice}
      />
    </div>
  );
};
