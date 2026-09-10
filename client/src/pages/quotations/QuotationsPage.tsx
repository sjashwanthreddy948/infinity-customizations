import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Eye,
  Share2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { Quotation } from '../../types/index.js';
import { NewQuotationModal } from '../../components/modals/NewQuotationModal.js';
import { QuotationPDFViewer } from '../../components/modals/QuotationPDFViewer.js';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal.js';
import { TableSkeleton } from '../../components/common/SkeletonLoader.js';
import { EmptyState } from '../../components/common/EmptyState.js';

export const QuotationsPage: React.FC = () => {
  const { token, user } = useAuth();
  const { refreshTrigger } = useWebSocket();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.email?.includes('jashwanth');

  const fetchQuotations = async () => {
    if (!token) return;
    try {
      setLoading(true);
      let url = `/api/quotations?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuotations(data);
      }
    } catch (err) {
      console.error('Error fetching quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [token, statusFilter, search, refreshTrigger]);

  const handleDeleteQuotation = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/quotations/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchQuotations();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete quotation');
      }
    } catch (e) {
      console.error('Delete quotation error:', e);
    }
  };

  const handleConvertQuotation = async (q: Quotation) => {
    const confirmConvert = window.confirm(
      `Convert Quotation ${q.quotation_number} into an active Order & Invoice for ₹${(q.grand_total || 0).toLocaleString('en-IN')}?`
    );
    if (!confirmConvert) return;

    try {
      const res = await fetch(`/api/quotations/${q.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        fetchQuotations();
        navigate(`/orders/${data.order.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to convert quotation');
      }
    } catch (e) {
      console.error(e);
      alert('Error converting quotation');
    }
  };

  // Metrics
  const totalQuotationsCount = quotations.length;
  const totalPipelineValue = quotations.reduce((acc, q) => acc + (Number(q.grand_total) || 0), 0);
  const convertedCount = quotations.filter(q => q.status === 'CONVERTED').length;
  const convertedValue = quotations
    .filter(q => q.status === 'CONVERTED')
    .reduce((acc, q) => acc + (Number(q.grand_total) || 0), 0);
  const activeCount = quotations.filter(q => q.status !== 'CONVERTED' && q.status !== 'EXPIRED').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONVERTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            ✓ Converted
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0B3A82] dark:bg-blue-950/60 dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800">
            Accepted
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Sent / Active
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0B3A82] dark:text-white uppercase flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#D4AF37]" />
            <span>Quotations & Estimates</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
            Generate and send official price quotes to clients, then convert directly into orders.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ New Quotation</span>
        </button>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Quotes</span>
          <p className="text-xl sm:text-2xl font-black text-[#0B3A82] dark:text-white mt-1">
            {totalQuotationsCount}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">All estimates created</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Total Quoted Value</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{totalPipelineValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Client estimate pipeline</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Converted to Orders</span>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{convertedValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {convertedCount} quotes converted ({totalQuotationsCount > 0 ? Math.round((convertedCount / totalQuotationsCount) * 100) : 0}%)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Active / Pending</span>
          <p className="text-xl sm:text-2xl font-black text-[#D4AF37] mt-1">
            {activeCount} Quotes
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting customer response</p>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search quotes, clients, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0B3A82]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'SENT', 'ACCEPTED', 'CONVERTED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0B3A82] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-blue-950/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-blue-900/40'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Quotation Cards (< md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <TableSkeleton rows={3} columns={3} />
        ) : quotations.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No quotations found"
            description="Create your first client estimate to send pricing via WhatsApp or PDF."
            actionLabel="+ Create Quotation"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          quotations.map(q => (
            <div
              key={q.id}
              onClick={() => setViewQuotation(q)}
              className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-2xs space-y-3 cursor-pointer active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-[#0B3A82] dark:text-[#D4AF37]">
                    {q.quotation_number}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Valid Until: {q.valid_until}</span>
                </div>
                {getStatusBadge(q.status)}
              </div>

              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-start justify-between">
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">{q.customer_name}</p>
                  <p className="text-[11px] text-slate-500">{q.customer_phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Quoted Amount</span>
                  <span className="text-sm font-black text-[#0B3A82] dark:text-[#F5E7B2]">
                    ₹{(q.grand_total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-blue-900/40 pt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500 text-[11px]">
                  {q.items?.length || 1} line item(s) · By {q.created_by_name}
                </span>

                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setViewQuotation(q)}
                    className="p-1.5 rounded-lg bg-blue-50 text-[#0B3A82] dark:bg-blue-900/40 dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800"
                    title="View Full Quotation"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {q.status !== 'CONVERTED' && (
                    <button
                      onClick={() => handleConvertQuotation(q)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
                      title="Convert to Order"
                    >
                      Convert
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(q)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50"
                      title="Delete Quotation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Quotation Table (>= md) */}
      <div className="hidden md:block bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-2xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={4} columns={7} />
        ) : quotations.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No quotations found"
            description="Create your first client estimate to send pricing via WhatsApp or PDF."
            actionLabel="+ Create Quotation"
            onAction={() => setShowNewModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-blue-900/40 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
                {quotations.map(q => (
                  <tr
                    key={q.id}
                    onClick={() => setViewQuotation(q)}
                    className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#0B3A82] dark:text-[#D4AF37]">
                      {q.quotation_number}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{q.customer_name}</p>
                      <p className="text-[11px] text-slate-500">{q.customer_phone}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      <p className="font-medium truncate max-w-xs">
                        {q.items?.[0]?.description || 'Custom Merchandise'}
                      </p>
                      {q.items && q.items.length > 1 && (
                        <span className="text-[10px] text-slate-400">
                          +{q.items.length - 1} more item(s)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-white">
                      ₹{(Number(q.grand_total) || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {q.valid_until}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(q.status)}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {q.created_by_name}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewQuotation(q)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-[#0B3A82] dark:text-slate-300 dark:hover:text-[#D4AF37] hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                          title="View / Print Quotation"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {q.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleConvertQuotation(q)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 active:scale-95 shadow-2xs"
                            title="Convert to Order"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(q)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Quotation (Admin)"
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

      {/* New Quotation Modal */}
      <NewQuotationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={() => fetchQuotations()}
      />

      {/* Quotation PDF & WhatsApp Viewer Modal */}
      <QuotationPDFViewer
        isOpen={!!viewQuotation}
        quotation={viewQuotation}
        onClose={() => setViewQuotation(null)}
        onConverted={() => {
          setViewQuotation(null);
          fetchQuotations();
        }}
      />

      {/* Admin Delete Quotation Confirmation */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Quotation"
        itemIdentifier={deleteTarget?.quotation_number || ''}
        itemDescription={`Client: ${deleteTarget?.customer_name} • Value: ₹${(Number(deleteTarget?.grand_total) || 0).toLocaleString('en-IN')}`}
        consequenceText="Deleting this quotation will permanently remove it from your quotation records."
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteQuotation}
      />
    </div>
  );
};
