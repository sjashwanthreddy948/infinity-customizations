import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, Printer, Calendar, Shirt, Package,
  IndianRupee, TrendingUp, Filter, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { CardGridSkeleton, TableSkeleton } from '../../components/common/SkeletonLoader.js';

export const ReportsPage: React.FC = () => {
  const { token } = useAuth();
  const [period, setPeriod] = useState('monthly');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reports/financial?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token, period]);

  const handleExportCSV = () => {
    if (!report?.itemized) return;
    const headers = ['Product', 'Type', 'Orders', 'Units Sold', 'Revenue (INR)', 'Total Cost (INR)', 'Net Profit (INR)', 'Margin %'];
    const rows = report.itemized.map((item: any) => [
      `"${item.product_name}"`,
      item.is_tshirt ? 'T-Shirt' : 'Other Product',
      item.orders_count,
      item.items_sold,
      item.revenue,
      item.total_cost,
      item.profit,
      `${item.margin_pct}%`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Infinity_Customizations_Profit_Report_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading && !report) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-xl" />
        <CardGridSkeleton count={4} />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  const tshirt = report?.tshirtProfit || {};
  const other = report?.otherProductProfit || {};
  const overall = report?.overall || {};
  const itemized = report?.itemized || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
            <span>Profit & Business Reports</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
            Compare T-Shirt profitability vs other products & net overall performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector (Daily, Weekly, Monthly, Yearly) */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60">
            {[
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Yearly', value: 'yearly' },
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setPeriod(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === tab.value
                    ? 'bg-[#0B3A82] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#0B3A82]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-blue-900/60 bg-white dark:bg-[#082A5E] hover:bg-slate-50 text-slate-700 dark:text-slate-200 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md border border-[#D4AF37]/40"
          >
            <Printer className="w-4 h-4 text-[#D4AF37]" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 3 COMPARISON PILLARS: T-Shirt Profit vs Other Product Profit vs Overall Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: T-Shirt Profit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-[#0B3A82] dark:text-[#D4AF37] flex items-center justify-center font-bold">
                <Shirt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-white">T-Shirt Profit</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{tshirt.itemsSold || 0} shirts sold ({tshirt.ordersCount || 0} orders)</p>
              </div>
            </div>
            <span className="text-xs font-black text-[#9A7B1C] dark:text-[#D4AF37] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-[#D4AF37]/30">
              {tshirt.margin}% margin
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>T-Shirt Revenue:</span>
              <span className="font-bold text-slate-900 dark:text-white">₹{(tshirt.revenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Blank T-Shirt Cost:</span>
              <span>₹{(tshirt.productCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Printing Cost:</span>
              <span>₹{(tshirt.printingCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Rapido / Delivery:</span>
              <span>₹{(tshirt.deliveryCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-blue-900/40 pt-1.5 font-bold">
              <span>Total T-Shirt Cost:</span>
              <span>₹{(tshirt.totalCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-[#9A7B1C] dark:text-[#D4AF37] border-t-2 border-slate-100 dark:border-blue-900/40 pt-2">
              <span>Net T-Shirt Profit:</span>
              <span>₹{(tshirt.profit || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Other Product Profit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-blue-900/40 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Other Products Profit</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Frames, Mugs, Bouquets, Polaroids...</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
              {other.margin}% margin
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
              <span>Merchandise Revenue:</span>
              <span className="font-bold text-slate-900 dark:text-white">₹{(other.revenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Materials / Blank Cost:</span>
              <span>₹{(other.productCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Customization Cost:</span>
              <span>₹{(other.printingCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 font-medium">
              <span>Delivery Cost:</span>
              <span>₹{(other.deliveryCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-rose-600 dark:text-rose-400 border-t border-slate-100 dark:border-blue-900/40 pt-1.5 font-bold">
              <span>Total Other Cost:</span>
              <span>₹{(other.totalCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-emerald-600 dark:text-emerald-400 border-t-2 border-slate-100 dark:border-blue-900/40 pt-2">
              <span>Net Other Profit:</span>
              <span>₹{(other.profit || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Pillar 3: Overall Business Profit */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-[#082A5E] to-[#051E44] text-white border border-[#D4AF37]/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#F5E7B2]">Overall Business Profit</h3>
              <p className="text-[10px] text-slate-300 font-medium">Net after general business expenses</p>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E]">
              {overall.netMargin}% net
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Total Gross Sales:</span>
              <span className="font-bold text-white">₹{(overall.totalRevenue || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Order Direct Costs:</span>
              <span className="text-rose-300">₹{(overall.orderTotalCost || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300 border-t border-white/10 pt-1">
              <span>Gross Orders Profit:</span>
              <span className="font-bold text-[#F5E7B2]">₹{(overall.grossOrderProfit || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>General Studio Expenses:</span>
              <span className="text-rose-300">-₹{(overall.generalExpenses || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="border-t-2 border-[#D4AF37]/40 pt-2 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-[#F5E7B2]">Final Net Profit</p>
                <p className="text-2xl font-black text-[#D4AF37]">
                  ₹{(overall.netBusinessProfit || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Product Profit Breakdown */}
      <div className="bg-white dark:bg-[#082A5E] rounded-2xl border border-slate-200 dark:border-blue-900/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-blue-900/40 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A82] dark:text-white">
            Itemized Profitability by Product
          </h3>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">{itemized.length} products sold</span>
        </div>

        {/* Mobile Product Cards (Phones < md) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-blue-900/30">
          {itemized.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No product sales data in this period.</div>
          ) : (
            itemized.map((item: any) => (
              <div key={item.product_name} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.is_tshirt ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0B3A82] text-[9px] font-bold uppercase">T-Shirt</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-blue-900/40 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase">Merch</span>
                    )}
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{item.product_name}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {item.margin_pct}% margin
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                    <p className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400">Units</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{item.items_sold}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                    <p className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400">Revenue</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">₹{item.revenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#051E44] border border-slate-200 dark:border-blue-900/40">
                    <p className="text-[9px] uppercase font-bold text-slate-600 dark:text-slate-400">Cost</p>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400">₹{item.total_cost.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100/60 dark:border-blue-900/40">
                    <p className="text-[9px] uppercase font-bold text-[#0B3A82] dark:text-blue-300">Profit</p>
                    <p className="text-xs font-black text-[#9A7B1C] dark:text-[#D4AF37]">₹{item.profit.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (Hidden on phones < md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-blue-950/80 text-slate-700 dark:text-slate-200 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {itemized.map((item: any) => (
                <tr key={item.product_name} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {item.is_tshirt ? (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0B3A82] text-[9px] font-bold uppercase">T-Shirt</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-blue-900/40 text-slate-700 dark:text-slate-300 text-[9px] font-bold uppercase">Merch</span>
                    )}
                    <span>{item.product_name}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">{item.orders_count}</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-white">{item.items_sold}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">₹{item.revenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">₹{item.total_cost.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-black text-[#9A7B1C] dark:text-[#D4AF37]">₹{item.profit.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{item.margin_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
