import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Shirt,
  Package,
  FileText,
  Users,
  Receipt,
  BarChart3,
  Sparkles,
  Settings,
  Search,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Plus,
  RefreshCw,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { GlobalSearchModal } from '../modals/GlobalSearchModal.js';
import { NewOrderModal } from '../modals/NewOrderModal.js';

export const AppLayout: React.FC = () => {
  const { user, business, logout, switchDemoPartner, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showNewOrder, setShowNewOrder] = useState(false);

  // Keyboard shortcut Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'T-Shirts', path: '/t-shirts', icon: Shirt, highlight: true },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Invoices', path: '/invoices', icon: FileText },
    { label: 'Expenses', path: '/expenses', icon: Receipt },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'AI Invoice', path: '/ai-invoice', icon: Sparkles, gold: true },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const isPartner1 = user?.email?.includes('jashwanth');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#051E44] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* 1. TOP PARTNER COLLABORATION & SWITCHER BAR */}
      <div className="bg-gradient-to-r from-[#082A5E] via-[#0B3A82] to-[#082A5E] text-white px-3 sm:px-4 py-1.5 text-xs flex items-center justify-between border-b border-[#D4AF37]/30 shadow-xs z-30">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="hidden sm:inline text-slate-200 text-[11px] truncate">
            Shared Business: <strong className="text-white font-bold">Infinity Customizations</strong>
          </span>
          <span className="sm:hidden text-[#D4AF37] font-black text-[11px] tracking-tight shrink-0">
            INFINITY
          </span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-[10px] sm:text-[11px] text-[#F5E7B2] whitespace-nowrap">
            {isConnected ? '⚡ Live Sync' : '● Connected'}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="text-[10px] sm:text-[11px] text-slate-300">
            <span className="hidden sm:inline">Active: </span>
            <strong className="text-white font-bold">{isPartner1 ? 'Jashwanth' : 'Rajshekar'}</strong>
          </span>

          <button
            onClick={() => switchDemoPartner(isPartner1 ? 2 : 1)}
            className="ml-1 sm:ml-2 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#D4AF37] hover:bg-[#F5E7B2] text-[#082A5E] font-bold text-[10px] flex items-center gap-1 transition-all shadow-xs active:scale-95 cursor-pointer"
            title="Switch partner to test dual collaboration"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
            <span className="hidden md:inline">Switch to </span>
            <span>{isPartner1 ? 'Rajshekar' : 'Jashwanth'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-20 bg-white dark:bg-[#082A5E] border-b border-slate-200 dark:border-blue-900/60 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 active:scale-95 transition-transform"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-[#0B3A82] dark:text-[#D4AF37]" /> : <Menu className="w-5 h-5 text-slate-700 dark:text-slate-200" />}
          </button>

          {/* Infinity Customizations Brand Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <img
              src="/logo.png"
              alt="Infinity Customizations"
              className="h-8 sm:h-10 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block truncate">
              <span className="font-black text-sm tracking-tight text-[#0B3A82] dark:text-white uppercase flex items-center gap-1.5">
                <span className="text-[#D4AF37] text-base font-serif font-black">∞</span>
                <span>INFINITY</span>
                <span className="text-[#D4AF37]">CUSTOMIZATIONS</span>
              </span>
              <p className="text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-300 font-bold -mt-0.5">
                Business Management & Smart Invoice
              </p>
            </div>
          </NavLink>
        </div>

        {/* Global Search & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Icon Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-900/40 active:scale-95 transition-transform"
            title="Search"
          >
            <Search className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>

          {/* Global Search Bar (Ctrl+K) */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white text-xs transition-colors shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
            <span className="font-medium">Search orders, invoices, customers...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-blue-900/60 text-slate-700 dark:text-slate-200 font-bold">
              Ctrl+K
            </kbd>
          </button>

          {/* SECONDARY CTA: AI Invoice */}
          <button
            onClick={() => navigate('/ai-invoice')}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl border border-[#D4AF37]/50 bg-amber-50/80 dark:bg-amber-950/30 text-[#0B3A82] dark:text-[#F5E7B2] hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>AI Invoice</span>
          </button>

          {/* PRIMARY CTA: + New Order (Hidden on mobile < sm because mobile has the center floating button) */}
          <button
            onClick={() => setShowNewOrder(true)}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ New Order</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-blue-900/40 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#D4AF37]" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 p-1 pl-1.5 rounded-xl border border-slate-200 dark:border-blue-900/60 hover:bg-slate-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-xs font-bold">
                {user?.fullName?.charAt(0) || user?.full_name?.charAt(0) || 'P'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-xl p-2 text-xs z-50 text-slate-900 dark:text-white">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-blue-900/40">
                  <p className="font-bold text-slate-900 dark:text-white">{user?.fullName || user?.full_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300 truncate">{user?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0B3A82] dark:text-[#D4AF37]">
                    Role: {user?.role || 'PARTNER'}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-200 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#0B3A82] dark:text-[#D4AF37]" />
                    <span>Business Settings</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-blue-900/40">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3. MAIN BODY WITH SIDEBAR & CONTENT */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar / Slide-Over Mobile Drawer */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-30 w-72 sm:w-80 lg:w-60 bg-white dark:bg-[#082A5E] border-r border-slate-200 dark:border-blue-900/60 flex flex-col shadow-2xl lg:shadow-none transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Mobile Drawer Top Header (Shown on mobile only) */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#082A5E]">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Infinity Customizations" className="h-8 w-auto object-contain shrink-0" />
              <div>
                <p className="text-xs font-black tracking-tight text-[#0B3A82] dark:text-white uppercase">Infinity</p>
                <p className="text-[9px] text-[#D4AF37] font-bold uppercase -mt-0.5">Customizations</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-blue-900/40 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </button>
          </div>

          {/* Active Partner Quick Switch Card inside Drawer */}
          <div className="lg:hidden p-3.5 bg-slate-50 dark:bg-[#051E44] border-b border-slate-200 dark:border-blue-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                  {isPartner1 ? 'J' : 'R'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{isPartner1 ? 'Jashwanth Reddy' : 'Rajshekar Reddy'}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">Equal Partner (50%)</p>
                </div>
              </div>
              <button
                onClick={() => {
                  switchDemoPartner(isPartner1 ? 2 : 1);
                  setSidebarOpen(false);
                }}
                className="px-2.5 py-1 rounded-full bg-[#D4AF37] text-[#082A5E] text-[10px] font-bold flex items-center gap-1 active:scale-95 shadow-xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Switch</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 sm:p-4 space-y-1 flex-1 overflow-y-auto bg-white dark:bg-[#082A5E]">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Menu Navigation
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `
                    flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#0B3A82] text-white shadow-md shadow-blue-900/20 font-bold'
                        : item.gold
                        ? 'text-[#9A7B1C] dark:text-[#D4AF37] hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-blue-950/60 hover:text-[#0B3A82] dark:hover:text-[#D4AF37]'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${item.gold ? 'text-[#9A7B1C] dark:text-[#D4AF37]' : ''}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-[#082A5E]">
                      Primary
                    </span>
                  )}
                  {item.gold && (
                    <Sparkles className="w-3 h-3 text-[#9A7B1C] dark:text-[#D4AF37]" />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer Partner Transparency Card & Mobile Logout */}
          <div className="p-4 border-t border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#082A5E] space-y-3">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50 text-[11px] space-y-1">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-semibold">
                <span>Partnership</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">50 / 50</span>
              </div>
              <p className="font-bold text-[#0B3A82] dark:text-[#D4AF37]">
                Jashwanth & Rajshekar Reddy
              </p>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                100% Financial Transparency
              </p>
            </div>

            <button
              onClick={() => {
                setSidebarOpen(false);
                logout();
              }}
              className="lg:hidden w-full py-2 px-3 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for Mobile Slide-Over Drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          />
        )}

        {/* Content Outlet with Bottom Padding for Mobile Bar */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full bg-[#F8FAFC] dark:bg-[#051E44] pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Thumb Accessible with Safe-Area) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#082A5E]/95 backdrop-blur-md border-t border-slate-200 dark:border-blue-900/60 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-around">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-[#0B3A82] dark:text-[#D4AF37] font-black scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-[#0B3A82] dark:text-[#D4AF37] font-black scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`
          }
        >
          <Shirt className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Orders</span>
        </NavLink>

        {/* Floating Center Action Button: + New Order */}
        <button
          onClick={() => setShowNewOrder(true)}
          className="-mt-7 p-3.5 rounded-full bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-xl shadow-blue-900/30 border-2 border-[#D4AF37] active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          title="Create New Order"
        >
          <Plus className="w-6 h-6 text-[#D4AF37]" />
        </button>

        <NavLink
          to="/invoices"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-[#0B3A82] dark:text-[#D4AF37] font-black scale-105' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold'
            }`
          }
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Invoices</span>
        </NavLink>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition-all active:scale-95 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={showNewOrder}
        onClose={() => setShowNewOrder(false)}
        onSuccess={() => {
          // If already on orders, trigger reload
          if (location.pathname === '/orders' || location.pathname === '/dashboard') {
            window.location.reload();
          } else {
            navigate('/orders');
          }
        }}
      />
    </div>
  );
};
