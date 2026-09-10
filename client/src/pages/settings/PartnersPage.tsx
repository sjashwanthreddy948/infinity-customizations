import React, { useState } from 'react';
import { UserCheck, ShieldCheck, Plus, Mail, Phone, Calendar, Percent, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { BackButton } from '../../components/common/BackButton.js';

export const PartnersPage: React.FC = () => {
  const { partners, user, token, refreshProfile } = useAuth();
  const { success, error } = useToast();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRole, setInviteRole] = useState<'PARTNER' | 'ACCOUNTANT' | 'STAFF'>('PARTNER');
  const [inviteShare, setInviteShare] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      error('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/partners/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          phone: invitePhone,
          role: inviteRole,
          partnerSharePercentage: Number(inviteShare)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add partner');

      success(`Invited ${inviteName} as ${inviteRole}!`);
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePhone('');
      await refreshProfile();
    } catch (err: any) {
      error(err.message || 'Failed to add partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Partners & Team Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Co-owner access controls, equity percentages, and authorization policies
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Partner / Staff</span>
        </button>
      </div>

      {/* Category-Specific Partnership Policy Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-navy-900 border border-blue-200 dark:border-blue-900/60 text-xs text-slate-800 dark:text-slate-200 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#0B3A82] dark:text-blue-400">
          <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#0B3A82]" />
          <span className="text-sm">Category-Specific Dual-Partner Agreement</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          The partnership between <strong>Jashwanth Reddy</strong> and <strong>Rajshekar Reddy</strong> governs <strong>Infinity Customizations</strong>, dedicated exclusively to:
        </p>
        <div className="p-3.5 bg-white dark:bg-navy-850 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs">
          <span className="font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
            🤝 Core Partnership Scope (50/50 Profit Split):
          </span>
          <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
            <li>Custom Printed T-Shirts & Apparel (Round Neck, Collar Polo, Oversized, Hoodies)</li>
            <li>Custom ID Cards & Lanyards (PVC badges, multicolor sublimation ribbons, card holders)</li>
            <li>Custom Caps & Headwear (Embroidered, printed caps)</li>
          </ul>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-2">
            All business net operating profits are split 50% Jashwanth Reddy / 50% Rajshekar Reddy
          </span>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((p, idx) => {
          const isMe = p.id === user?.id;
          return (
            <div
              key={p.id}
              className={`p-6 rounded-2xl bg-white dark:bg-navy-900 border ${
                isMe ? 'border-brand-500/50 shadow-md' : 'border-slate-200 dark:border-slate-800 shadow-sm'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-navy-800 text-brand-400 border border-brand-500/30 font-bold flex items-center justify-center text-sm shadow-inner">
                      {p.full_name?.slice(0, 2).toUpperCase() || `P${idx + 1}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">{p.full_name}</h3>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-brand-600 dark:text-brand-400 mt-1">
                        {p.role}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.email}</span>
                  </p>
                  {p.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.phone}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    <span>Equity Ownership: <strong>{p.partner_share_percentage || 50}%</strong></span>
                  </p>

                  {/* Category Scope Badge */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-slate-700 text-[11px] mt-2">
                    <span className="font-bold text-[#0B3A82] dark:text-blue-300 block">
                      Category Scope: T-Shirts, ID Cards & Caps
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block mt-0.5">
                      50% co-ownership and profit sharing across all merchandise orders & client invoices.
                    </span>
                  </div>

                  {p.joined_at && (
                    <p className="flex items-center gap-2 pt-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joined: {new Date(p.joined_at).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Status: Verified Co-Owner</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">Audit Active</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite Partner or Team Member</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e: any) => setInviteRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="PARTNER">PARTNER</option>
                    <option value="ACCOUNTANT">ACCOUNTANT</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Equity Share (%)</label>
                  <input
                    type="number"
                    value={inviteShare}
                    onChange={(e) => setInviteShare(e.target.value)}
                    placeholder="Enter percentage"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-navy-800">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-xs rounded-xl bg-brand-600 text-white font-semibold shadow-md">
                  {isSubmitting ? 'Sending Invite...' : 'Send Partner Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
