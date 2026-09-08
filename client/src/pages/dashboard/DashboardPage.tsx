import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IndianRupee, TrendingUp, Package, Clock, AlertCircle, Shirt,
  Calendar, ArrowUpRight, Sparkles, Plus, Eye, CheckCircle2,
  Printer, Truck
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { NewOrderModal } from '../../components/modals/NewOrderModal.js';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/SkeletonLoader';
import { EmptyState } from '../../components/common/EmptyState';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [range, setRange] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('partnerledger_token');
      const res = await fetch(`/api/dashboard/stats?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [range]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 w-64 bg-slate-300 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
        </div>
        <CardGridSkeleton count={6} />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  const cards = stats?.cards || {};
  const tshirt = stats?.tshirtOverview || {};
  const partnerShares = stats?.partnerShares || null;
  const jashwanth = partnerShares?.jashwanth || null;
  const rajshekar = partnerShares?.rajshekar || null;
  const chartTrend = stats?.chartTrend || [];
  const recentOrders = stats?.recentOrders || [];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#0B3A82] dark:text-[#D4AF37] text-xs font-bold border border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Dual-Partner Shared Business Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172033] dark:text-white mt-1">
            Infinity Customizations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time orders, production costs, delivery & net profit tracking
          </p>
        </div>

        {/* Date Range Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-xs overflow-x-auto no-scrollbar max-w-full">
            {[
              { label: 'All', value: 'all' },
              { label: 'Today', value: 'today' },
              { label: 'This Week', value: 'week' },
              { label: 'This Month', value: 'month' },
              { label: 'This Year', value: 'year' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRange(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  range === tab.value
                    ? 'bg-[#0B3A82] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3A82] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsNewOrderOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>+ New Order</span>
          </button>
        </div>
      </div>

      {/* 2. THE 6 REQUIRED FINANCIAL CARDS (INR ₹) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* TOTAL REVENUE */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-[#0B3A82] dark:text-white mt-1">
            ₹{(cards.totalRevenue || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Gross order sales</p>
        </div>

        {/* TOTAL COST */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Total Cost</p>
          <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            ₹{(cards.totalCost || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Blanks + Print + Rapido</p>
        </div>

        {/* TOTAL PROFIT (Prominent Gold Highlight) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-blue-900/50 border border-[#D4AF37]/50 shadow-card">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-wider text-amber-900 dark:text-[#F5E7B2]">Total Profit</p>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#D4AF37] text-[#082A5E]">
              {cards.totalRevenue > 0 ? Math.round(((cards.totalProfit || 0) / cards.totalRevenue) * 100) : 0}% margin
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-[#9A7B1C] dark:text-[#D4AF37] mt-1">
            ₹{(cards.totalProfit || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-amber-900/80 dark:text-amber-300 mt-0.5 font-medium">Net earned</p>
        </div>

        {/* AVAILABLE AMOUNT */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Available Amount</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${cards.availableAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            ₹{(cards.availableAmount || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Paid minus costs</p>
        </div>

        {/* TOTAL ORDERS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Total Orders</p>
          <p className="text-xl sm:text-2xl font-bold text-[#172033] dark:text-white mt-1">
            {cards.totalOrders || 0}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Completed orders</p>
        </div>

        {/* PENDING PAYMENTS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Pending Payments</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ₹{(cards.pendingPayments || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Receivable from clients</p>
        </div>
      </div>

      {/* 2.5 DUAL-PARTNER PROFIT ALLOCATION (Category-Specific Agreement) */}
      {partnerShares && jashwanth && rajshekar && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-blue-900/40 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-[#D4AF37] text-[11px] font-bold border border-amber-200 dark:border-amber-900/50 mb-1">
                <span>Partnership Agreement Rules</span>
              </div>
              <h3 className="text-base font-black text-[#172033] dark:text-white flex items-center gap-2">
                <span>Dual-Partner Profit Allocation</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Partner (Rajshekar) has 50% share in <strong className="text-[#0B3A82] dark:text-[#D4AF37]">T-Shirts, ID Cards & Caps</strong> only. Bouquets, Photo Frames, Mugs & Gifts are <strong className="text-slate-800 dark:text-slate-200">100% Jashwanth</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0B3A82] dark:text-[#D4AF37] border border-blue-100 dark:border-blue-900">
                Shared Pool: ₹{partnerShares.sharedProfit.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                Sole Merch: ₹{partnerShares.soleProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Jashwanth Reddy Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/50 to-white dark:from-navy-850 dark:to-navy-900 border border-blue-200 dark:border-blue-900/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#0B3A82] text-white flex items-center justify-center font-black text-sm shadow-sm">
                    JR
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Jashwanth Reddy</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#0B3A82] text-white">Owner</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">50% Shared Merch + 100% Sole Merch</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Profit</span>
                  <p className="text-xl sm:text-2xl font-black text-[#0B3A82] dark:text-white font-mono">
                    ₹{jashwanth.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {jashwanth.sharePercentage}% of total profit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">T-Shirts/ID/Caps (50%)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">₹{jashwanth.sharedProfit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Bouquets/Frames (100%)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">₹{jashwanth.soleProfit.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Rajshekar Reddy Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/40 to-white dark:from-navy-850 dark:to-navy-900 border border-amber-200/80 dark:border-amber-900/40 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#082A5E] flex items-center justify-center font-black text-sm shadow-sm">
                    RR
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Rajshekar Reddy</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#D4AF37] text-[#082A5E]">Partner</span>
                    </h4>
                    <p className="text-[11px] text-slate-400">50% T-Shirts, ID Cards & Caps only</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Profit</span>
                  <p className="text-xl sm:text-2xl font-black text-[#D4AF37] font-mono">
                    ₹{rajshekar.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    {rajshekar.sharePercentage}% of total profit
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">T-Shirts/ID/Caps (50%)</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono text-sm">₹{rajshekar.sharedProfit.toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block font-semibold">Bouquets/Frames/Gifts</span>
                  <span className="text-xs font-bold text-slate-400 block mt-0.5">Excluded (₹0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. T-SHIRT BUSINESS SPOTLIGHT (Prompt Required) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-[#082A5E] via-[#0B3A82] to-[#082A5E] text-white border border-[#D4AF37]/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Shirt className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Custom Printed T-Shirt Spotlight
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E] font-extrabold">
                  Core Product ({tshirt.tshirtsSold || 0} Sold)
                </span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => navigate('/t-shirts')}
            className="text-xs font-bold text-[#F5E7B2] hover:text-white flex items-center gap-1 self-start"
          >
            <span>View Detailed T-Shirt Analytics</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <p className="text-[10px] uppercase font-semibold text-slate-300">T-Shirt Revenue</p>
            <p className="text-lg font-bold text-white mt-0.5">₹{(tshirt.tshirtRevenue || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <p className="text-[10px] uppercase font-semibold text-slate-300">Blank T-Shirt Cost</p>
            <p className="text-lg font-bold text-rose-300 mt-0.5">₹{(tshirt.tshirtProductCost || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <p className="text-[10px] uppercase font-semibold text-slate-300">Printing Cost</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">₹{(tshirt.tshirtPrintingCost || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <p className="text-[10px] uppercase font-semibold text-slate-300">Rapido / Delivery</p>
            <p className="text-lg font-bold text-sky-300 mt-0.5">₹{(tshirt.tshirtDeliveryCost || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase font-bold text-[#F5E7B2]">T-Shirt Net Profit</p>
            <p className="text-xl font-black text-[#D4AF37] mt-0.5">₹{(tshirt.tshirtProfit || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* 4. REVENUE VS COST VS PROFIT CHART */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0B3A82] dark:text-[#D4AF37]" />
              <span>Revenue vs Cost vs Profit Trend</span>
            </h3>
            <p className="text-xs text-slate-400">Daily financial progression across all customized orders</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#0B3A82]" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Cost</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Profit</span>
            </div>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B3A82" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0B3A82" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                formatter={(val: any) => [`₹${val.toLocaleString('en-IN')}`, '']}
                contentStyle={{ backgroundColor: '#082A5E', borderColor: '#D4AF37', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#0B3A82" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
              <Area type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} fillOpacity={0} name="Cost" />
              <Area type="monotone" dataKey="profit" stroke="#D4AF37" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" name="Net Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. RECENT ORDERS (With Creator Partner Badge) */}
      <div className="bg-white dark:bg-[#082A5E] rounded-3xl border border-slate-100 dark:border-blue-900/50 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#172033] dark:text-white uppercase tracking-wider">
              Recent Partner Orders
            </h3>
            <p className="text-xs text-slate-400">Every order displays the creating partner for total transparency</p>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs font-bold text-[#0B3A82] dark:text-[#D4AF37] hover:underline"
          >
            View All ({cards.totalOrders || 0}) Orders →
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Package}
              title="No orders found"
              description="No orders recorded in this date range. Create your first customized order to start tracking revenue, wholesale costs, and partner profit allocations."
              actionLabel="+ Create First Order"
              onAction={() => setIsNewOrderOpen(true)}
            />
          </div>
        ) : (
          <>
            {/* Mobile Recent Orders Cards (screens < md) */}
            <div className="md:hidden p-3.5 sm:p-5 space-y-2.5">
          {recentOrders.map((o: any) => (
            <div
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/60 active:bg-blue-50/40 dark:active:bg-blue-950/60 transition-colors space-y-2 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs text-[#0B3A82] dark:text-[#D4AF37]">#{o.order_number}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  o.payment_status === 'PAID'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : o.payment_status === 'PARTIALLY_PAID'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  {o.payment_status === 'PAID' ? 'Paid' : o.payment_status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{o.customer_name}</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">{o.product_name}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-[#0B3A82] dark:text-white block">₹{o.selling_price?.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] font-black text-[#9A7B1C] dark:text-[#D4AF37] block">+₹{o.profit?.toLocaleString('en-IN')} profit</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-blue-900/40 text-[10px]">
                <span className={`px-2 py-0.5 rounded-md font-bold ${
                  o.is_partner_shared === 1 || o.is_tshirt === 1
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0B3A82] dark:text-[#D4AF37] border border-blue-200 dark:border-blue-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {o.is_partner_shared === 1 || o.is_tshirt === 1 ? '🤝 Shared (50/50)' : '🔒 100% Jashwanth'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">By: <strong className="text-slate-800 dark:text-slate-200">{o.created_by_name}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Recent Orders Table (Hidden on screens < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-4 text-right">Customer Total</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-center">Payment</th>
                <th className="py-3 px-4">Created By</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {recentOrders.map((o: any) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-[#0B3A82] dark:text-white">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                    {o.customer_name}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="font-medium">{o.product_name}</span>
                      {o.is_tshirt === 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] font-bold text-[#0B3A82]">
                          {o.tshirt_size_breakdown || o.tshirt_size || 'Custom T-Shirt'}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        o.is_partner_shared === 1 || o.is_tshirt === 1
                          ? 'bg-blue-50 text-[#0B3A82] border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {o.is_partner_shared === 1 || o.is_tshirt === 1 ? 'Shared 50/50' : 'Sole Jashwanth'}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-800 dark:text-white">
                    ₹{o.selling_price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">
                    ₹{o.total_cost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-[#9A7B1C] dark:text-[#D4AF37]">
                    ₹{o.profit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      o.payment_status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : o.payment_status === 'PARTIALLY_PAID'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {o.payment_status === 'PAID' ? 'Paid' : o.payment_status === 'PARTIALLY_PAID' ? 'Partial' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                        {o.created_by_name?.charAt(0) || 'P'}
                      </span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {o.created_by_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orders/${o.id}`);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-[#0B3A82] dark:hover:text-[#D4AF37]"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />
    </div>
  );
};
