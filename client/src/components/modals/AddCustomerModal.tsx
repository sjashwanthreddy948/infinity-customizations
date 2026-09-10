import React, { useState } from 'react';
import { X, Users, Building, Phone, Mail, FileText, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { BackButton } from '../common/BackButton.js';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCustomer: any) => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Customer or company name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          address: address.trim() || null,
          gstin: gstin.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add customer');

      success(`Added ${name}!`);
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err: any) {
      error(err.message || 'Error adding customer');
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
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <BackButton onClick={onClose} label="Back" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add Customer</h2>
                <p className="text-xs text-slate-500">Create client profile for billing & ledger</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Company / Customer Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter customer name" className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">GSTIN (Optional)</label>
              <input type="text" value={gstin} onChange={(e) => setGstin(e.target.value)} placeholder="Enter GSTIN number" className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0B3A82]" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Billing Address</label>
              <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter address details" className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/30 disabled:opacity-50">
                {isSubmitting ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
