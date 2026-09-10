import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Ban,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  DollarSign,
  Trash2,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { InvoicePDFViewer } from '../../components/invoices/InvoicePDFViewer.js';
import { RecordPaymentModal } from '../../components/modals/RecordPaymentModal.js';
import { VoidModal } from '../../components/modals/VoidModal.js';
import { DeleteConfirmModal } from '../../components/common/DeleteConfirmModal.js';
import { Invoice } from '../../types/index.js';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const { refreshTrigger } = useWebSocket();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.email?.includes('jashwanth');

  const fetchInvoice = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      }
    } catch (err) {
      console.error('Error fetching invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id, token, refreshTrigger]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">Invoice not found</h2>
        <button
          onClick={() => navigate('/invoices')}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 text-white"
        >
          Back to Invoices
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/invoices')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-navy-850 hover:bg-slate-200 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                {invoice.invoice_number}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                {invoice.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Customer: <strong className="text-slate-700 dark:text-slate-300">{invoice.customer_name}</strong> • Created by {invoice.created_by_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {invoice.balance_due > 0 && invoice.status !== 'VOID' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <CreditCard className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}

          {invoice.status !== 'VOID' && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-navy-850 dark:hover:bg-rose-950/30 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold text-xs transition-colors active:scale-95"
            >
              <Ban className="w-4 h-4" />
              <span>Void Invoice</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold text-xs transition-colors active:scale-95 cursor-pointer"
              title="Delete Invoice (Admin only)"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Void Notice Banner if Voided */}
      {invoice.status === 'VOID' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Ban className="w-4 h-4" /> This invoice was VOIDED on {invoice.voided_at?.slice(0, 10)} by {invoice.voided_by || 'Partner'}.
          </p>
          <p>Reason: "{invoice.void_reason || 'Reversed'}"</p>
        </div>
      )}

      {/* High-Contrast Calculation Summary Banner */}
      <div className="max-w-[800px] mx-auto p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-blue-900/40 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Calculation Breakdown & Payment Summary</span>
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
            Number(invoice.balance_due) === 0 || invoice.status === 'PAID'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
          }`}>
            {Number(invoice.balance_due) === 0 || invoice.status === 'PAID' ? '✓ Fully Paid' : `Due: ₹${(Number(invoice.balance_due) || 0).toLocaleString('en-IN')}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Subtotal</span>
            <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              ₹{(Number(invoice.subtotal) || Number(invoice.grand_total) || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">GST / Tax</span>
            <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
              {Number(invoice.tax_amount) > 0 ? `+₹${Number(invoice.tax_amount).toLocaleString('en-IN')}` : '₹0 (0%)'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">Amount Paid</span>
            <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              ₹{(Number(invoice.amount_paid) || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className={`p-3 rounded-xl border ${
            Number(invoice.balance_due) > 0
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}>
            <span className="text-[10px] uppercase font-bold block">Balance Due</span>
            <p className="text-base font-black mt-0.5">
              {Number(invoice.balance_due) > 0 ? `₹${(Number(invoice.balance_due) || 0).toLocaleString('en-IN')}` : '₹0'}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice A4 Sheet Preview */}
      <InvoicePDFViewer invoice={invoice} business={invoice.business} />

      {/* Payment History Timeline */}
      <div className="max-w-[800px] mx-auto bg-white dark:bg-navy-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          <span>Payment History & Reconciliations</span>
        </h3>

        {!invoice.payments || invoice.payments.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No payments recorded against this invoice yet.</p>
        ) : (
          <div className="space-y-3">
            {invoice.payments.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold font-mono text-slate-900 dark:text-slate-100">{p.payment_number}</p>
                    <p className="text-slate-500">
                      via {p.method} • Ref: {p.reference_number || 'N/A'} • By {p.recorded_by_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-400">{p.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showPaymentModal && (
        <RecordPaymentModal
          isOpen={true}
          defaultInvoiceId={invoice.id}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showVoidModal && (
        <VoidModal
          isOpen={true}
          entityType="INVOICE"
          entityId={invoice.id}
          entityReference={invoice.invoice_number}
          onClose={() => setShowVoidModal(false)}
          onSuccess={() => fetchInvoice()}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        title="Delete Invoice"
        itemIdentifier={invoice.invoice_number}
        itemDescription={`Customer: ${invoice.customer_name} • Total: ₹${(Number(invoice.grand_total) || 0).toLocaleString('en-IN')}`}
        consequenceText="Deleting this invoice will permanently remove it from all business financial ledgers and reports. This cannot be undone."
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          const res = await fetch(`/api/invoices/${invoice.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            navigate('/invoices');
          } else {
            const err = await res.json();
            alert(err.error || 'Failed to delete invoice');
          }
        }}
      />
    </div>
  );
};
