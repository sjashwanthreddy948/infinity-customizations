import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

interface VoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'INVOICE' | 'EXPENSE' | 'TRANSACTION';
  entityId: string;
  entityReference: string;
  onSuccess: () => void;
}

export const VoidModal: React.FC<VoidModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityReference,
  onSuccess
}) => {
  const { token, user } = useAuth();
  const { success, error } = useToast();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      error('A mandatory justification (at least 5 characters) is required for audit logs');
      return;
    }

    setIsSubmitting(true);
    try {
      let url = '';
      if (entityType === 'INVOICE') url = `/api/invoices/${entityId}/void`;
      else if (entityType === 'EXPENSE') url = `/api/expenses/${entityId}/void`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to void record');

      success(`${entityType} ${entityReference} marked as VOID`, `Reason recorded by ${user?.full_name}`);
      setReason('');
      onSuccess();
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to void record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Void Financial Record</h2>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Reverses ledger balances & creates audit trail</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleVoid} className="p-6 space-y-4">
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-navy-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              You are about to void <strong className="text-slate-900 dark:text-white font-mono">{entityReference}</strong>.
              In accordance with partnership transparency rules, this record will <strong>NOT</strong> be deleted. Its status will be set to <span className="font-semibold text-rose-500">VOID</span> and both partners will receive an audit alert.
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Reason for Voiding *
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Scope revised by client, duplicate invoice generated, or vendor issued credit note..."
                className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || reason.trim().length < 5}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Voiding...' : 'Confirm & Log Void'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
