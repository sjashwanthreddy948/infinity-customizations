import React, { useState, useEffect } from 'react';
import {
  Receipt, Plus, Search, Filter, AlertCircle, Trash2,
  Calendar, CheckCircle2, IndianRupee, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { AddExpenseModal } from '../../components/modals/AddExpenseModal.js';
import { TableSkeleton } from '../../components/common/SkeletonLoader.js';
import { EmptyState } from '../../components/common/EmptyState.js';

const CATEGORIES = [
  'Printing',
  'Rapido',
  'Materials',
  'Packaging',
  'Electricity',
  'Rent',
  'Marketing',
  'Other'
];

export const ExpensesPage: React.FC = () => {
  const { token } = useAuth();
  const { refreshTrigger } = useWebSocket();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchExpenses = async () => {
    if (!token) return;
    try {
      let url = '/api/expenses?';
      if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setCategoryTotals(data.categoryTotals || []);
        setTotalAmount(data.totalAmount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [token, selectedCategory, search, refreshTrigger]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
            <span>General Business Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track studio rent, bulk materials, packaging cartons, electricity & advertising
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/40 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ Add Business Expense</span>
        </button>
      </div>

      {/* Quick Category Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
          <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Total General Expenses</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">₹{totalAmount.toLocaleString('en-IN')}</p>
        </div>

        {categoryTotals.slice(0, 3).map((ct: any) => (
          <div key={ct.category} className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card">
            <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">{ct.category}</p>
            <p className="text-xl font-bold text-[#0B3A82] dark:text-white mt-1">₹{ct.total.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">{ct.count} entries</p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by description, expense #, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-blue-900/60 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Mobile Expenses Cards (Phones < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <TableSkeleton rows={3} columns={2} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Record studio rent, materials, or delivery expenses to track your business costs."
            actionLabel="+ Add Business Expense"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          expenses.map((exp: any) => (
            <div
              key={exp.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-bold text-xs text-[#0B3A82] font-mono">{exp.expense_number}</span>
                  <p className="text-[11px] text-slate-600 font-medium">{exp.date}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200">
                  {exp.category}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-900">{exp.description}</p>
                {exp.notes && <p className="text-[11px] text-slate-600 italic mt-0.5">{exp.notes}</p>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                    {exp.created_by_name?.charAt(0) || 'P'}
                  </span>
                  <span className="text-xs text-slate-700 font-medium">{exp.created_by_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({exp.payment_method})</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-rose-600 font-mono">₹{exp.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Expenses Table (Hidden on mobile < md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No expenses recorded"
            description="Record studio rent, materials, or delivery expenses to track your business costs."
            actionLabel="+ Add Business Expense"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[11px] tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Expense # & Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0B3A82]">{exp.expense_number}</p>
                      <p className="text-[11px] text-slate-600 font-medium">{exp.date}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-800">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-[#172033]">
                      {exp.description}
                      {exp.notes && <p className="text-[10px] text-slate-600 font-normal italic">{exp.notes}</p>}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-mono font-medium">
                      {exp.payment_method}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center text-[10px] font-bold">
                          {exp.created_by_name?.charAt(0) || 'P'}
                        </span>
                        <span className="text-slate-700 font-medium">{exp.created_by_name}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddExpenseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchExpenses()}
      />
    </div>
  );
};
