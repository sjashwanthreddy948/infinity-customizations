import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Wallet,
  ArrowRightLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useToast } from '../../context/ToastContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { BackButton } from '../../components/common/BackButton.js';

export const CashBankPage: React.FC = () => {
  const { token, user } = useAuth();
  const { success, error } = useToast();
  const { refreshTrigger } = useWebSocket();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('Transfer between partnership accounts');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Entry Modal (Deposit/Withdrawal) state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [targetAccount, setTargetAccount] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  const fetchAccounts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cash-bank', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.accounts.length >= 2) {
          if (!fromAccount) setFromAccount(json.accounts[0].id);
          if (!toAccount) setToAccount(json.accounts[1].id);
        }
        if (json.accounts.length > 0 && !targetAccount) {
          setTargetAccount(json.accounts[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [token, refreshTrigger]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || fromAccount === toAccount || !transferAmount || Number(transferAmount) <= 0) {
      error('Please select different accounts and a valid transfer amount');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await fetch('/api/cash-bank/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: transferAmount,
          description: transferDesc
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Transfer failed');

      success('Transfer recorded successfully!', `Amount: ₹${Number(transferAmount).toLocaleString('en-IN')}`);
      setShowTransferModal(false);
      setTransferAmount('');
      fetchAccounts();
    } catch (err: any) {
      error(err.message || 'Transfer failed');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount || !entryAmount || Number(entryAmount) <= 0) {
      error('Please select an account and enter a valid amount');
      return;
    }

    setIsSubmittingEntry(true);
    try {
      const res = await fetch('/api/cash-bank/record-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: targetAccount,
          type: entryType,
          amount: entryAmount,
          category: entryCategory || (entryType === 'DEPOSIT' ? 'Cash Inflow' : 'Cash Outflow'),
          description: entryDesc
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Operation failed');

      success(`${entryType} recorded!`, `Amount: ₹${Number(entryAmount).toLocaleString('en-IN')}`);
      setShowEntryModal(false);
      setEntryAmount('');
      setEntryDesc('');
      fetchAccounts();
    } catch (err: any) {
      error(err.message || 'Failed to record entry');
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const currencySymbol = user?.currency_symbol || '₹';

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400 animate-pulse">Loading cash & bank accounts...</div>;
  }

  const summary = data?.summary || { totalLiquid: 0, cashTotal: 0, bankTotal: 0, upiTotal: 0 };
  const accounts = data?.accounts || [];
  const transactions = data?.transactions || [];

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Cash & Bank Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
            Strictly derived balances. Direct manipulation disabled for audit security.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setEntryType('DEPOSIT'); setShowEntryModal(true); }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Deposit / Inflow</span>
          </button>
          <button
            onClick={() => { setEntryType('WITHDRAWAL'); setShowEntryModal(true); }}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 active:scale-95"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw / Outflow</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-semibold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/40 active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Funds</span>
          </button>
        </div>
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-navy-900 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">TOTAL LIQUIDITY</span>
          <div className="text-2xl font-black font-mono my-2 text-white">
            {currencySymbol}{summary.totalLiquid.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-300 font-medium">Total verified available funds</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">CASH IN HAND</span>
            <Wallet className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black font-mono my-2 text-slate-900 dark:text-white">
            {currencySymbol}{summary.cashTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Office vault physical currency</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">BANK CURRENT A/C</span>
            <Building2 className="w-4 h-4 text-brand-500" />
          </div>
          <div className="text-2xl font-black font-mono my-2 text-slate-900 dark:text-white">
            {currencySymbol}{summary.bankTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">HDFC Primary Business Account</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">BUSINESS UPI</span>
            <CreditCard className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black font-mono my-2 text-slate-900 dark:text-white">
            {currencySymbol}{summary.upiTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Instant merchant UPI collections</p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Configured Financial Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc: any) => (
            <div
              key={acc.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{acc.account_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-navy-750 text-slate-700 dark:text-slate-300">
                    {acc.account_type}
                  </span>
                </div>
                {acc.account_number && (
                  <p className="text-[11px] font-mono text-slate-500">A/C: {acc.account_number}</p>
                )}
                {acc.ifsc_code && (
                  <p className="text-[11px] font-mono text-slate-500">IFSC: {acc.ifsc_code}</p>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Derived Balance:</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                  {currencySymbol}{acc.current_balance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Movement Ledger */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Account Movements</h3>
        </div>

        {/* Mobile Cards (md:hidden) */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.slice(0, 20).map((t: any) => {
            const isInflow = ['INCOME', 'DEPOSIT'].includes(t.type);
            const isOutflow = ['EXPENSE', 'WITHDRAWAL'].includes(t.type);
            const isTransfer = t.type === 'TRANSFER';

            return (
              <div key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.transaction_number}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{t.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t.account_name || 'Main Account'}
                    {t.to_account_name && ` -> ${t.to_account_name}`}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800">
                    {t.type}
                  </span>
                </div>
                {t.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t.description}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">By {t.actor_name}</span>
                  <div className="font-mono font-bold text-xs">
                    {isInflow && <span className="text-emerald-600 dark:text-emerald-400">+{currencySymbol}{t.amount.toLocaleString('en-IN')}</span>}
                    {isOutflow && <span className="text-rose-600 dark:text-rose-400">-{currencySymbol}{t.amount.toLocaleString('en-IN')}</span>}
                    {isTransfer && <span className="text-brand-500">{currencySymbol}{t.amount.toLocaleString('en-IN')} (Transfer)</span>}
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
                <th className="py-3 px-4">TX #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Inflow</th>
                <th className="py-3 px-4 text-right">Outflow</th>
                <th className="py-3 px-4">Authorized By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transactions.slice(0, 20).map((t: any) => {
                const isInflow = ['INCOME', 'DEPOSIT'].includes(t.type);
                const isOutflow = ['EXPENSE', 'WITHDRAWAL'].includes(t.type);
                const isTransfer = t.type === 'TRANSFER';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-navy-850/50">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {t.transaction_number}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">{t.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {t.account_name || 'Main Account'}
                      {t.to_account_name && ` -> ${t.to_account_name}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-navy-800">
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate font-medium">
                      {t.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {isInflow ? `${currencySymbol}${t.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {isOutflow ? `${currencySymbol}${t.amount.toLocaleString('en-IN')}` : '-'}
                      {isTransfer && <span className="text-brand-500 font-normal">Transfer</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">{t.actor_name}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowTransferModal(false)} />
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Inter-Account Transfer</h3>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">From Account</label>
                <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="w-full p-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.account_name} (Avail: ₹{a.current_balance.toLocaleString('en-IN')})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">To Account</label>
                <select value={toAccount} onChange={(e) => setToAccount(e.target.value)} className="w-full p-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.account_name} (Avail: ₹{a.current_balance.toLocaleString('en-IN')})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Transfer Amount (₹)</label>
                <input type="number" min="1" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Enter transfer amount" className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <input type="text" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="Enter transfer description" className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={isSubmittingTransfer} className="px-4 py-2 text-xs rounded-xl bg-[#0B3A82] text-white font-bold shadow-md shadow-blue-900/20 border border-[#D4AF37]/30">Confirm Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdrawal Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setShowEntryModal(false)} />
          <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto my-auto bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-10 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Record {entryType === 'DEPOSIT' ? 'Deposit / Cash Inflow' : 'Withdrawal / Cash Outflow'}</h3>
            <form onSubmit={handleEntry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Target Account</label>
                <select value={targetAccount} onChange={(e) => setTargetAccount(e.target.value)} className="w-full p-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                  {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Amount (₹)</label>
                <input type="number" min="1" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} placeholder="Enter amount" className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Description</label>
                <input type="text" value={entryDesc} onChange={(e) => setEntryDesc(e.target.value)} placeholder="Enter entry description" className="w-full p-2.5 text-xs font-medium rounded-xl bg-slate-50 dark:bg-navy-850 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowEntryModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" disabled={isSubmittingEntry} className="px-4 py-2 text-xs rounded-xl bg-[#0B3A82] text-white font-bold shadow-md shadow-blue-900/20 border border-[#D4AF37]/30">Record Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
