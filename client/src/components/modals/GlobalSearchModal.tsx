import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Users, Receipt, ArrowRight, X, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ invoices: [], customers: [], expenses: [], sales: [], transactions: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ invoices: [], customers: [], expenses: [], sales: [], transactions: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ invoices: [], customers: [], expenses: [], sales: [], transactions: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, token]);

  const hasResults =
    results.invoices.length > 0 ||
    results.customers.length > 0 ||
    results.expenses.length > 0 ||
    results.sales.length > 0 ||
    results.transactions.length > 0;

  const handleSelect = (path: string) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 px-2 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-navy-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10"
        >
          {/* Input Header */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search invoices (INV-...), customers, expenses, sales..."
              className="flex-1 bg-transparent text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-3 px-2 py-0.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto p-4 space-y-4">
            {loading && (
              <div className="py-8 text-center text-sm text-slate-400">Searching financial records...</div>
            )}

            {!loading && !query && (
              <div className="py-8 text-center text-sm text-slate-400">
                Type at least 2 characters to search across customers, invoices, expenses, and transactions.
              </div>
            )}

            {!loading && query && !hasResults && (
              <div className="py-8 text-center text-sm text-slate-400">
                No matching records found for "{query}"
              </div>
            )}

            {/* Invoices */}
            {results.invoices.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">Invoices</p>
                <div className="space-y-1">
                  {results.invoices.map((inv: any) => (
                    <div
                      key={inv.id}
                      onClick={() => handleSelect(`/invoices/${inv.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-850 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-500">
                            {inv.title}
                          </p>
                          <p className="text-xs text-slate-500">{inv.subtitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">
                          {user?.currency_symbol || '₹'}{inv.amount.toLocaleString('en-IN')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">Customers</p>
                <div className="space-y-1">
                  {results.customers.map((c: any) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(`/customers/${c.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-850 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-500">
                            {c.title}
                          </p>
                          <p className="text-xs text-slate-500">{c.subtitle} • {c.phone || c.email || 'No contact'}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses */}
            {results.expenses.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 mb-2">Expenses</p>
                <div className="space-y-1">
                  {results.expenses.map((e: any) => (
                    <div
                      key={e.id}
                      onClick={() => handleSelect('/expenses')}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-navy-850 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-brand-500">
                            {e.title}
                          </p>
                          <p className="text-xs text-slate-500">{e.subtitle} • {e.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-mono text-rose-600 dark:text-rose-400">
                        -{user?.currency_symbol || '₹'}{e.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
