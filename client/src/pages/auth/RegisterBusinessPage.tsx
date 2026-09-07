import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, UserCheck, ShieldCheck, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const RegisterBusinessPage: React.FC = () => {
  const { registerBusiness } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'Partnership',
    businessCategory: 'Video & Creative Services',
    businessEmail: '',
    phone: '',
    currency: 'INR',
    currencySymbol: '₹',
    address: '',
    gstin: '',
    partner1: {
      name: '',
      email: '',
      password: '',
      phone: '',
      share: 50
    },
    partner2: {
      name: '',
      email: '',
      password: '',
      phone: '',
      share: 50
    }
  });

  const updateBusiness = (field: string, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const updatePartner = (pKey: 'partner1' | 'partner2', field: string, val: any) => {
    setFormData(prev => ({
      ...prev,
      [pKey]: { ...prev[pKey], [field]: val }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerBusiness(formData);
      success('Business and partner accounts created successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black text-xl mb-3 shadow-lg shadow-brand-500/20">
          PL
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Register Partnership Business
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Set up one shared workspace with two independent partner credentials
        </p>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>1</span>
            <span>Business</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-800" />
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>2</span>
            <span>Partner 1</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200 dark:bg-slate-800" />
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>3</span>
            <span>Partner 2</span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-navy-900 py-8 px-6 sm:px-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <form onSubmit={handleSubmit}>
            {/* Step 1: Business Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 1: Business Profile</h2>
                  <p className="text-xs text-slate-500">Legal entity and billing info for your partnership</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => updateBusiness('businessName', e.target.value)}
                    placeholder="e.g. Apex Media Partners"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Business Type</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => updateBusiness('businessType', e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="Partnership">Partnership</option>
                      <option value="LLP">Limited Liability Partnership (LLP)</option>
                      <option value="General Partnership">General Partnership</option>
                      <option value="Private Limited">Private Limited</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Category</label>
                    <input
                      type="text"
                      value={formData.businessCategory}
                      onChange={(e) => updateBusiness('businessCategory', e.target.value)}
                      placeholder="e.g. Media Production"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Business Email *</label>
                    <input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => updateBusiness('businessEmail', e.target.value)}
                      placeholder="info@business.com"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => updateBusiness('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                    <input
                      type="text"
                      disabled
                      value="INR (₹)"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">GSTIN (Optional)</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => updateBusiness('gstin', e.target.value)}
                      placeholder="36AABCU9603R1ZM"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Registered Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => updateBusiness('address', e.target.value)}
                    placeholder="Floor 4, Cyber Towers, Hyderabad, Telangana"
                    className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.businessName || !formData.businessEmail) {
                      error('Business name and email are required');
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md"
                >
                  <span>Next: Partner 1 Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Partner 1 Details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 2: Partner 1 Credentials</h2>
                  <p className="text-xs text-slate-500">First co-founder / managing partner account</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.partner1.name}
                    onChange={(e) => updatePartner('partner1', 'name', e.target.value)}
                    placeholder="e.g. Jashwanth Reddy"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.partner1.email}
                      onChange={(e) => updatePartner('partner1', 'email', e.target.value)}
                      placeholder="jashwanth@business.com"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.partner1.phone}
                      onChange={(e) => updatePartner('partner1', 'phone', e.target.value)}
                      placeholder="+91 98765..."
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password *</label>
                    <input
                      type="password"
                      value={formData.partner1.password}
                      onChange={(e) => updatePartner('partner1', 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Equity Share (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.partner1.share}
                      onChange={(e) => updatePartner('partner1', 'share', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-center"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-semibold text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.partner1.name || !formData.partner1.email || !formData.partner1.password) {
                        error('Name, email, and password required for Partner 1');
                        return;
                      }
                      setStep(3);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md"
                  >
                    <span>Next: Partner 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Partner 2 Details */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Step 3: Partner 2 Credentials</h2>
                  <p className="text-xs text-slate-500">Second co-founder account for the SAME business</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.partner2.name}
                    onChange={(e) => updatePartner('partner2', 'name', e.target.value)}
                    placeholder="e.g. Rajshekar Reddy"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.partner2.email}
                      onChange={(e) => updatePartner('partner2', 'email', e.target.value)}
                      placeholder="alex@business.com"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.partner2.phone}
                      onChange={(e) => updatePartner('partner2', 'phone', e.target.value)}
                      placeholder="+91 98765..."
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password *</label>
                    <input
                      type="password"
                      value={formData.partner2.password}
                      onChange={(e) => updatePartner('partner2', 'password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Equity Share (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.partner2.share}
                      onChange={(e) => updatePartner('partner2', 'share', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-center"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Complete Transparency Guaranteed
                  </div>
                  Both partners share access to all financial cards, P&L, ledger transactions, and audit logs.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-semibold text-sm"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/20 disabled:opacity-50"
                  >
                    {loading ? 'Creating Workspace...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
