import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Printer, Download, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { BackButton } from '../../components/common/BackButton.js';

export const ProfitLossPage: React.FC = () => {
  const { token, user, business } = useAuth();
  const { refreshTrigger } = useWebSocket();

  const [period, setPeriod] = useState('year');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchStatement = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/profit-loss?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [token, period, refreshTrigger]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csv = `INFINITY CUSTOMIZATIONS - PROFIT & LOSS STATEMENT\n`;
    csv += `Business,${business?.name || 'Infinity Customizations'}\n`;
    csv += `Period,${period.toUpperCase()}\n`;
    csv += `Generated,${new Date().toLocaleDateString()}\n\n`;

    csv += `REVENUE\n`;
    csv += `Category,Amount (INR)\n`;
    csv += `Customer Sales Revenue,${data.revenue.salesRevenue}\n`;
    csv += `Other Operating Income,${data.revenue.otherIncome}\n`;
    csv += `TOTAL REVENUE,${data.revenue.totalRevenue}\n\n`;

    csv += `OPERATING EXPENSES\n`;
    csv += `Category,Amount (INR)\n`;
    data.expenses.categories.forEach((c: any) => {
      csv += `"${c.category}",${c.amount}\n`;
    });
    csv += `TOTAL EXPENSES,${data.expenses.totalExpenses}\n\n`;

    const pa = data.partnerAllocation;
    const jTotal = pa?.jashwanth?.totalProfit ?? Math.round(data.netProfit / 2);
    const rTotal = pa?.rajshekar?.totalProfit ?? (data.netProfit - jTotal);

    csv += `NET OPERATING PROFIT,${data.netProfit}\n`;
    csv += `Profit Margin,${data.profitMargin}%\n\n`;
    csv += `PARTNERSHIP ALLOCATION (50/50 PROFIT SHARE)\n`;
    csv += `Total Net Business Profit (T-Shirts, ID Cards, Caps),${data.netProfit}\n`;
    csv += `Jashwanth Reddy Net Share (50%),${jTotal}\n`;
    csv += `Rajshekar Reddy Net Share (50%),${rTotal}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Profit_Loss_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currencySymbol = user?.currency_symbol || '₹';

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Calculating financial statement...</div>;
  }

  const revenue = data?.revenue || { salesRevenue: 0, otherIncome: 0, totalRevenue: 0 };
  const expenses = data?.expenses || { categories: [], totalExpenses: 0 };
  const netProfit = data?.netProfit || 0;
  const margin = data?.profitMargin || 0;

  const partnerAlloc = data?.partnerAllocation;
  const sharedProfit = partnerAlloc?.sharedCategoryProfit ?? (netProfit > 0 ? Math.round(netProfit * 0.8) : 0);
  const soleProfit = partnerAlloc?.soleCategoryProfit ?? (netProfit > sharedProfit ? netProfit - sharedProfit : 0);
  const jashwanthShared = partnerAlloc?.jashwanth?.sharedProfit ?? Math.round(sharedProfit / 2);
  const jashwanthSole = partnerAlloc?.jashwanth?.soleProfit ?? soleProfit;
  const jashwanthTotal = partnerAlloc?.jashwanth?.totalProfit ?? (jashwanthShared + jashwanthSole);
  const rajshekarTotal = partnerAlloc?.rajshekar?.totalProfit ?? (sharedProfit - jashwanthShared);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Profit & Loss Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent revenue, cost breakdown, and partner profit allocation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-slate-100 dark:bg-navy-850 p-1 rounded-xl text-xs font-medium">
            {['month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  period === p
                    ? 'bg-white dark:bg-navy-750 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : 'Year to Date'}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-850 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-600/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">GROSS REVENUE</span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            {currencySymbol}{revenue.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">OPERATING EXPENSES</span>
          <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
            {currencySymbol}{expenses.totalExpenses.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
            <span className="text-xs font-bold uppercase tracking-wider">NET PROFIT</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              {margin}% Margin
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {currencySymbol}{netProfit.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Professional Statement Sheet */}
      <div
        ref={printRef}
        className="max-w-4xl mx-auto bg-white dark:bg-navy-900 rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 print:shadow-none print:border-none print:p-0"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{business?.name || 'Infinity Editing'}</h2>
            <p className="text-xs text-slate-500">Statement of Profit & Loss • Partnership Business</p>
            <p className="text-xs text-slate-400 mt-1">Period: {period.toUpperCase()} • Generated {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">FINANCIAL REPORT</span>
            <p className="font-mono text-xs text-slate-500 mt-0.5">INR (₹)</p>
          </div>
        </div>

        {/* Section 1: Revenue */}
        <div className="mb-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 dark:border-slate-800 pb-1">
            1. Operating Revenue & Inflows
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-700 dark:text-slate-300 py-1">
              <span>Customer Invoices & Commercial Video Editing Collections</span>
              <span className="font-mono font-medium">{currencySymbol}{revenue.salesRevenue.toLocaleString('en-IN')}</span>
            </div>
            {revenue.otherIncome > 0 && (
              <div className="flex justify-between text-slate-700 dark:text-slate-300 py-1">
                <span>Other Operating Income & Consultations</span>
                <span className="font-mono font-medium">{currencySymbol}{revenue.otherIncome.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>TOTAL REVENUE (A)</span>
              <span className="font-mono text-brand-600 dark:text-brand-400">
                {currencySymbol}{revenue.totalRevenue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Operating Expenses */}
        <div className="mb-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-slate-800 pb-1">
            2. Operating Expenditures
          </h3>
          <div className="space-y-2 text-xs">
            {expenses.categories.map((cat: any, i: number) => (
              <div key={i} className="flex justify-between text-slate-700 dark:text-slate-300 py-1">
                <span>{cat.category}</span>
                <span className="font-mono font-medium">{currencySymbol}{cat.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>TOTAL OPERATING EXPENSES (B)</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                {currencySymbol}{expenses.totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Net Profit Summary & Partner Allocation */}
        <div className="p-6 bg-slate-50 dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-base font-black text-slate-900 dark:text-white">
            <div>
              <span>NET BUSINESS PROFIT (A - B)</span>
              <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                Total operating profit across all custom merchandise and client orders
              </p>
            </div>
            <span className={`text-2xl font-mono ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {currencySymbol}{netProfit.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Partnership Agreement Breakdown Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-navy-900 border border-blue-200/80 dark:border-navy-700 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            <div className="flex items-center justify-between font-bold text-[#0B3A82] dark:text-blue-400">
              <span className="flex items-center gap-1.5">
                <span>🤝 Equal 50/50 Partner Allocation</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white dark:bg-navy-800 border border-blue-200 dark:border-navy-700 font-semibold">
                Contractual Rules
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Infinity Customizations is dedicated exclusively to <strong>Custom Printed T-Shirts, ID Cards & Lanyards, and Caps</strong>. All business net operating profits are shared <strong>50/50 equally</strong> between <strong>Jashwanth Reddy</strong> and <strong>Rajshekar Reddy</strong>.
            </p>
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white dark:bg-navy-900 rounded-xl border border-blue-300 dark:border-blue-900/60 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#0B3A82] dark:text-blue-400 font-black text-xs uppercase tracking-wider">Jashwanth Reddy</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Co-Owner (50%)
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                50% Partner Share (T-Shirts, ID Cards & Caps)
              </p>
              <div className="pt-2 text-xl font-mono font-black text-slate-900 dark:text-white">
                {currencySymbol}{jashwanthTotal.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-navy-900 rounded-xl border border-[#D4AF37]/50 dark:border-amber-900/50 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#9A7B1C] dark:text-[#D4AF37] font-black text-xs uppercase tracking-wider">Rajshekar Reddy</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
                  Partner (50%)
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                50% Partner Share (T-Shirts, ID Cards & Caps)
              </p>
              <div className="pt-2 text-xl font-mono font-black text-[#0B3A82] dark:text-emerald-400">
                {currencySymbol}{rajshekarTotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
