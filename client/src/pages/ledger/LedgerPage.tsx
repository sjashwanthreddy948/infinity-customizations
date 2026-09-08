import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { Transaction } from '../../types/index.js';

export const LedgerPage: React.FC = () => {
  const { token, user, partners } = useAuth();
  const { refreshTrigger } = useWebSocket();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchLedger = async () => {
    if (!token) return;
    try {
      let url = `/api/ledger?partner=${selectedPartner}&type=${selectedType}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [token, selectedPartner, selectedType, search, refreshTrigger]);

  const handleExportCSV = () => {
    if (!transactions.length) return;
    let csv = `Date,Transaction ID,Type,Category,Description,Partner,Income,Expense,Payment Method,Status\n`;
    transactions.forEach(t => {
      csv += `${t.date},${t.transactionNumber},${t.type},"${t.category}","${t.description.replace(/"/g, '""')}",${t.partner},${t.income || ''},${t.expense || ''},${t.paymentMethod},${t.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `General_Ledger_${Date.now()}.csv`;
    link.click();
  };

  const currencySymbol = user?.currency_symbol || '₹';

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Transaction Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable chronological journal of every income, expense, and account movement
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-300 font-semibold text-xs w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Ledger (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description, TX #, or partner..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          {/* Partner filter */}
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Partners</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Types</option>
            <option value="INCOME">Income / Revenue</option>
            <option value="EXPENSE">Expense</option>
            <option value="TRANSFER">Transfer</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
          </select>
        </div>
      </div>

      {/* Ledger Table & Mobile Cards */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading transaction journal...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No transactions match the selected filters.</div>
        ) : (
          <>
            {/* Mobile Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.map((t) => {
                const isVoid = t.status === 'VOID';
                return (
                  <div key={t.id} className={`p-4 space-y-2.5 ${isVoid ? 'opacity-50 line-through' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          {t.transactionNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                          {t.type}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {t.category}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {t.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                      <div className="text-[11px] text-slate-400 space-x-1.5">
                        <span className="font-medium text-brand-600 dark:text-brand-400">{t.partner}</span>
                        <span>•</span>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span>{t.paymentMethod}</span>
                      </div>
                      <div className="font-mono font-bold">
                        {t.income ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{currencySymbol}{t.income.toLocaleString('en-IN')}</span>
                        ) : t.expense ? (
                          <span className="text-rose-600 dark:text-rose-400">-{currencySymbol}{t.expense.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-navy-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">TX ID</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Partner</th>
                    <th className="py-3.5 px-4 text-right">Income</th>
                    <th className="py-3.5 px-4 text-right">Expense</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {transactions.map((t) => {
                    const isVoid = t.status === 'VOID';
                    return (
                      <tr key={t.id} className={`hover:bg-slate-50/70 dark:hover:bg-navy-850/50 ${isVoid ? 'opacity-50 line-through' : ''}`}>
                        <td className="py-3 px-4 text-slate-500 font-sans">{t.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{t.transactionNumber}</td>
                        <td className="py-3 px-4 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800">
                            {t.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 dark:text-slate-300">{t.category}</td>
                        <td className="py-3 px-4 font-sans text-slate-900 dark:text-slate-100 max-w-xs truncate" title={t.description}>
                          {t.description}
                        </td>
                        <td className="py-3 px-4 font-sans font-medium text-brand-600 dark:text-brand-400">{t.partner}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {t.income ? `${currencySymbol}${t.income.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                          {t.expense ? `${currencySymbol}${t.expense.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-500">{t.paymentMethod}</td>
                        <td className="py-3 px-4 text-center font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
