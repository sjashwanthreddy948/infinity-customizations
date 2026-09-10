import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Lock, Mail, Sparkles, Shirt, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Welcome to Infinity Customizations!');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Invalid partner email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (partnerEmail: string) => {
    setEmail(partnerEmail);
    setPassword('Password@123');
    setLoading(true);
    try {
      await login(partnerEmail, 'Password@123');
      success(`Logged in as ${partnerEmail.includes('jashwanth') ? 'Partner 1 (Jashwanth)' : 'Partner 2 (Rajshekar)'}!`);
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#051E44] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex items-center justify-center mb-4">
          <img src="/logo.png" alt="Infinity Customizations" className="h-16 w-auto object-contain max-w-[220px]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0B3A82] dark:text-white uppercase">
          INFINITY <span className="text-[#D4AF37]">CUSTOMIZATIONS</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-semibold">
          Business Management & Smart Invoice System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#082A5E] py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-slate-200 dark:border-blue-900/60 space-y-6">
          {/* Quick Demo Partner Login Buttons */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-center">
              Quick Partner Login (T-Shirts & ID Cards)
            </p>
            <div>
              <button
                type="button"
                onClick={() => handleQuickLogin('rajshekar@infinitycustomizations.com')}
                disabled={loading}
                className="w-full p-3 rounded-2xl border-2 border-[#0B3A82]/30 hover:border-[#0B3A82] bg-blue-50/40 dark:bg-blue-950/40 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-left transition-all group flex items-center justify-between"
              >
                <div>
                  <span className="block text-[10px] uppercase font-black text-[#0B3A82] dark:text-[#D4AF37]">
                    Active Partner Session
                  </span>
                  <span className="block text-xs font-black text-slate-900 dark:text-white mt-0.5">
                    Rajshekar Reddy (Partner - T-Shirts & ID Cards)
                  </span>
                </div>
                <span className="text-xs text-[#0B3A82] dark:text-[#D4AF37] font-bold">Log in →</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-300 dark:border-blue-900/60 w-full" />
            <span className="bg-white dark:bg-[#082A5E] px-3 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
              Or Sign In with Credentials
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Partner Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="partner@infinitycustomizations.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-lg shadow-blue-900/20 border border-[#D4AF37]/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4 text-[#D4AF37]" />
              <span>{loading ? 'Authenticating...' : 'Sign In as Partner'}</span>
            </button>
          </form>

          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-blue-950/40 border border-slate-200 dark:border-blue-900/40 text-[11px] text-center text-slate-700 dark:text-slate-300 font-medium">
            Both partners share 100% financial transparency across orders, costs & profits.
          </div>
        </div>
      </div>
    </div>
  );
};
