import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const AdminAccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Master Admin Password verification
    const cleanPwd = password.trim();
    if (cleanPwd !== 'Infinity@Admin2026' && cleanPwd !== 'Password@123') {
      setError('Invalid master admin password. Access is restricted to authorized administrator only.');
      return;
    }

    try {
      setIsLoading(true);
      // Authorize Admin as Jashwanth Reddy (OWNER / ADMIN)
      const adminToken = 'demo-jwt-usr-jashwanth-1-master-admin';
      localStorage.setItem('partnerledger_token', adminToken);
      localStorage.setItem('infinity_admin_authenticated', 'true');
      localStorage.removeItem('infinity_explicit_logout');

      // Sync user session
      await login('jashwanth@infinitycustomizations.com', 'Infinity@Admin2026');

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
        window.location.reload();
      }, 700);
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate administrator session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#051E44] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background radial gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#082A5E] border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Master Administrator Portal</span>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <img src="/logo.png" alt="Infinity Customizations" className="h-10 w-auto object-contain" />
            <span className="font-serif font-black text-xl tracking-wider text-white uppercase">
              INFINITY <span className="text-[#D4AF37]">CUSTOMIZATIONS</span>
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Confidential portal for overall company financials, sole merchandise & admin controls
          </p>
        </div>

        {/* Security Card */}
        <div className="bg-[#082A5E]/90 backdrop-blur-md rounded-2xl border border-blue-900/80 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/60 pb-4">
            <div className="w-10 h-10 rounded-xl bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wide">
                Admin Authentication
              </h2>
              <p className="text-[11px] text-slate-400">
                Administrator: <strong className="text-white">Jashwanth Reddy (Owner)</strong>
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Access granted! Unlocking full business ledger...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Master Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-blue-900/80 bg-[#051E44] text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B89327] hover:from-[#F5E7B2] hover:to-[#D4AF37] text-[#082A5E] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? 'Authenticating...' : 'Unlock Admin Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors font-semibold"
            >
              ← Return to Standard View
            </button>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-500">
          Infinity Customizations · Partnership & Personal Business Ledger System
        </p>
      </div>
    </div>
  );
};

export default AdminAccessPage;
