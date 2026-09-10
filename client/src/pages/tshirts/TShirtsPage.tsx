import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shirt, TrendingUp, IndianRupee, Printer, Truck, Package,
  Sparkles, Award, ArrowUpRight, BarChart2, PieChart as PieIcon,
  Layers, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { BackButton } from '../../components/common/BackButton.js';

const SIZE_COLORS: Record<string, string> = {
  S: '#0B3A82',
  M: '#082A5E',
  L: '#D4AF37',
  XL: '#F5E7B2',
  XXL: '#B89327'
};

const COLOR_PALETTE = ['#0B3A82', '#D4AF37', '#10B981', '#6366F1', '#EC4899', '#F59E0B', '#64748B'];

export const TShirtsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('partnerledger_token');
        const res = await fetch('/api/tshirts/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch T-Shirt analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="py-20 flex items-center justify-center text-slate-400">
        Loading T-Shirt Intelligence Dashboard...
      </div>
    );
  }

  const summary = data?.summary || {};
  const salesBySize = data?.salesBySize || [];
  const salesByColor = data?.salesByColor || [];
  const salesByMonth = data?.salesByMonth || [];
  const salesByNeckType = data?.salesByNeckType || [];
  const salesByFabric = data?.salesByFabric || [];
  const idCardsSummary = data?.idCardsSummary || {};
  const topOrders = data?.topOrders || [];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
            <Shirt className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
            <span>T-Shirt Analytics & Performance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deep-dive metrics for your flagship custom apparel line
          </p>
        </div>

        <button
          onClick={() => navigate('/orders')}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md flex items-center gap-1.5 transition-all border border-[#D4AF37]/40 self-start sm:self-auto"
        >
          <Shirt className="w-4 h-4 text-[#D4AF37]" />
          <span>View All T-Shirt Orders</span>
        </button>
      </div>

      {/* 7 Key T-Shirt Metric Cards (Prompt Specified) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">T-Shirts Sold</p>
          <p className="text-xl font-bold text-[#0B3A82] dark:text-white mt-1">{summary.totalTshirtsSold || 0} pcs</p>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">{summary.totalOrders || 0} orders</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">T-Shirt Revenue</p>
          <p className="text-xl font-bold text-[#0B3A82] dark:text-white mt-1">₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Blank T-Shirt Cost</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{(summary.totalProductCost || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Printing Cost</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{(summary.totalPrintingCost || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300">Delivery / Rapido</p>
          <p className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">₹{(summary.totalDeliveryCost || 0).toLocaleString('en-IN')}</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-blue-900/50 border border-[#D4AF37]/50 shadow-card">
          <p className="text-[10px] uppercase font-bold tracking-wider text-amber-900 dark:text-[#F5E7B2]">Total Profit</p>
          <p className="text-xl font-black text-[#9A7B1C] dark:text-[#D4AF37] mt-1">₹{(summary.totalProfit || 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-amber-900 dark:text-amber-300 font-bold mt-0.5">{summary.profitMargin}% margin</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#082A5E] text-white border border-[#D4AF37]/40 shadow-card col-span-2 md:col-span-1">
          <p className="text-[10px] uppercase font-bold tracking-wider text-[#F5E7B2]">Avg Profit / Shirt</p>
          <p className="text-xl font-black text-[#D4AF37] mt-1">₹{summary.avgProfitPerTshirt || 0}</p>
          <p className="text-[10px] text-slate-300 mt-0.5">Net per unit</p>
        </div>
      </div>

      {/* Visual Charts: Sales by Size & Sales by Color */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Size (S, M, L, XL, XXL) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              <span>Sales by T-Shirt Size (S, M, L, XL, XXL)</span>
            </h3>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Unit Volume</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesBySize} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="size" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`${val} T-Shirts`, 'Units Sold']}
                  contentStyle={{ backgroundColor: '#082A5E', borderColor: '#D4AF37', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#0B3A82" radius={[6, 6, 0, 0]}>
                  {salesBySize.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 2 || index === 3 ? '#D4AF37' : '#0B3A82'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center pt-2 border-t border-slate-100 dark:border-blue-900/40">
            {salesBySize.map((s: any) => (
              <div key={s.size} className="p-2 rounded-xl bg-slate-50 dark:bg-blue-950/40">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{s.size}</p>
                <p className="text-xs font-black text-[#0B3A82] dark:text-[#D4AF37]">{s.count} pcs</p>
                <p className="text-[10px] text-slate-400">₹{(s.revenue || 0).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sales by Color & Monthly Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
              <PieIcon className="w-4 h-4" />
              <span>Color Distribution</span>
            </h3>
            <span className="text-[11px] text-slate-400">Popularity</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByColor}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="color"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {salesByColor.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} units`, 'Quantity']}
                  contentStyle={{ backgroundColor: '#082A5E', borderColor: '#D4AF37', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-blue-900/40 text-xs">
            {salesByColor.slice(0, 5).map((c: any, i: number) => (
              <div key={c.color} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLOR_PALETTE[i % COLOR_PALETTE.length] }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium">{c.color} ({c.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Neck Styles & Fabric Quality Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Neck Styles Breakdown (Round Neck vs Collar) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
              <Shirt className="w-4 h-4" />
              <span>Neck Style Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Round Neck vs Collar</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {salesByNeckType.length > 0 ? (
              salesByNeckType.map((item: any) => (
                <div key={item.neck_type} className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.neck_type === 'Collar' ? 'bg-[#0B3A82] text-white' : 'bg-blue-100 dark:bg-blue-950 text-[#0B3A82] dark:text-[#D4AF37]'
                    }`}>
                      {item.neck_type}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.count} pcs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-600 dark:text-slate-300 text-[10px] uppercase font-bold">Revenue</span>
                    <span className="font-bold text-[#0B3A82] dark:text-[#D4AF37]">₹{(item.revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800 dark:text-emerald-300 text-[10px] uppercase font-bold">Profit</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₹{(item.profit || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-xs text-slate-500 py-4 text-center">No neck style breakdown recorded yet.</p>
            )}
          </div>
        </div>

        {/* Fabric Quality Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Fabric Quality Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Pure Cotton, Cotton, Poly, Nano</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {salesByFabric.length > 0 ? (
              salesByFabric.map((item: any) => (
                <div key={item.fabric} className="p-3 rounded-xl bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#D4AF37]/20 text-[#8C7118] dark:text-[#F5E7B2]">
                      {item.fabric}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{item.count} pcs</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-600 dark:text-slate-300 font-medium">Revenue</span>
                    <span className="font-bold text-[#0B3A82] dark:text-[#D4AF37]">₹{(item.revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">Profit</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{(item.profit || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-xs text-slate-500 py-4 text-center">No fabric data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ID Cards Cross-Sell Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#082A5E] via-[#0B3A82] to-[#082A5E] text-white border border-[#D4AF37]/40 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center font-black">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Custom ID Cards & Lanyards Cross-Sell</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E] text-[10px] font-black uppercase">Add-On</span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                Paired with custom printed T-shirts for college events, fests, and corporate teams
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <p className="text-[9px] uppercase font-bold text-blue-100">ID Cards Sold</p>
              <p className="text-base font-black text-white mt-0.5">{idCardsSummary.total_id_cards_sold || 0} pcs</p>
              <p className="text-[9px] text-blue-200">{idCardsSummary.orders_with_id_cards || 0} orders</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <p className="text-[9px] uppercase font-bold text-blue-100">Total Revenue</p>
              <p className="text-base font-black text-[#F5E7B2] mt-0.5">₹{(idCardsSummary.id_card_revenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
              <p className="text-[9px] uppercase font-bold text-blue-100">Procurement Cost</p>
              <p className="text-base font-black text-rose-300 mt-0.5">₹{(idCardsSummary.id_card_cost || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/25 border border-[#D4AF37]/50">
              <p className="text-[9px] uppercase font-bold text-[#F5E7B2]">Net Profit</p>
              <p className="text-base font-black text-[#D4AF37] mt-0.5">₹{(idCardsSummary.id_card_profit || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Performing T-Shirt Orders */}
      <div className="bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-[#D4AF37] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span>Top Performing T-Shirt Orders</span>
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Highest margin deals</span>
        </div>

        {/* Mobile Top Orders List (Phones < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-blue-900/30">
          {topOrders.map((o: any) => (
            <div
              key={o.id}
              onClick={() => navigate(`/orders/${o.id}`)}
              className="p-4 space-y-2.5 active:bg-slate-50 dark:active:bg-[#051E44] transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-[#0B3A82] dark:text-[#D4AF37] font-mono">{o.order_number}</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{o.customer_name}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                  {o.profit_margin}% margin
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-[#0B3A82] dark:text-[#D4AF37] border border-blue-100 dark:border-blue-800">
                  {o.tshirt_size || 'Custom'}
                </span>
                <span className="text-slate-700 dark:text-slate-200 font-semibold">{o.tshirt_color}</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">· {o.tshirt_print_type}</span>
                <span className="text-slate-700 dark:text-slate-200 font-bold ml-auto">Qty: {o.quantity}</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-center pt-1 border-t border-slate-100 dark:border-blue-900/40">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50">
                  <p className="text-[8px] uppercase font-bold text-slate-600 dark:text-slate-400">Total Price</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">₹{o.selling_price.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/50">
                  <p className="text-[8px] uppercase font-bold text-slate-600 dark:text-slate-400">Cost</p>
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">₹{o.total_cost.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-[#D4AF37]/40">
                  <p className="text-[8px] uppercase font-bold text-amber-900 dark:text-[#F5E7B2]">Profit</p>
                  <p className="text-xs font-black text-[#9A7B1C] dark:text-[#D4AF37]">₹{o.profit.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (Hidden on phones < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Size & Color</th>
                <th className="py-3 px-4">Print Type</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
                <th className="py-3 px-4">Partner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {topOrders.map((o: any) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-[#0B3A82] dark:text-white">
                    {o.order_number}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {o.customer_name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-[#0B3A82] dark:text-[#D4AF37]">
                      {o.tshirt_size}
                    </span>
                    <span className="ml-2 text-slate-700 dark:text-slate-300 font-medium">{o.tshirt_color}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium ml-1">x{o.quantity}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {o.tshirt_print_type}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                    ₹{o.selling_price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-600 dark:text-rose-400 font-bold">
                    ₹{o.total_cost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-[#9A7B1C] dark:text-[#D4AF37]">
                    ₹{o.profit.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {o.profit_margin}%
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                    {o.created_by_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
