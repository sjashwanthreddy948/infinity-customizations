import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Search, Filter, ArrowRight, Clock, User, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { BackButton } from '../../components/common/BackButton.js';
import { AuditLog } from '../../types/index.js';

export const ActivityPage: React.FC = () => {
  const { token, partners } = useAuth();
  const { refreshTrigger } = useWebSocket();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const fetchLogs = async () => {
    if (!token) return;
    try {
      let url = `/api/activity?partner=${selectedPartner}&action=${selectedAction}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, selectedPartner, selectedAction, search, refreshTrigger]);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">CREATE</span>;
      case 'UPDATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">UPDATE</span>;
      case 'VOID':
      case 'REVERSE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse">VOID</span>;
      case 'PAYMENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">PAYMENT</span>;
      case 'LOGIN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">SESSION</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800">{action}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <div>
        <BackButton to="/dashboard" label="Back to Dashboard" />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Partner Activity & Audit Trail
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              Append-Only & Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Complete transparency: every creation, modification, payment, and void is recorded permanently
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, reason, or partner..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={selectedPartner}
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Partners</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.full_name}</option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update / Edit</option>
            <option value="VOID">Void / Cancel</option>
            <option value="PAYMENT">Payment</option>
            <option value="LOGIN">Login</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 animate-pulse">Loading immutable audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No activity logs found for selected filters.</div>
        ) : (
          logs.map((log) => {
            const hasDiff = log.oldValue && log.newValue;
            return (
              <div
                key={log.id}
                className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2">
                    {getActionBadge(log.action)}
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {log.actorName}
                    </span>
                    <span className="text-xs text-slate-500">
                      performed <strong>{log.action}</strong> on <strong>{log.entityType}</strong>
                    </span>
                    {log.entityReference && (
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40">
                        {log.entityReference}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
                    {log.ipAddress && <span className="text-[11px]">{log.ipAddress}</span>}
                    <span>{new Date(log.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>

                {/* Justification / Reason */}
                {log.reason && (
                  <div className="mt-3 text-xs bg-slate-50 dark:bg-navy-850 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
                    <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Mandatory Reason:</span>
                    <p className="text-slate-800 dark:text-slate-200 italic font-serif text-sm">
                      "{log.reason}"
                    </p>
                  </div>
                )}

                {/* Before / After Diff Viewer (Section 15 & 16) */}
                {hasDiff && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block mb-1">
                        Previous Value:
                      </span>
                      <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : log.oldValue}
                      </pre>
                    </div>

                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
                        Updated Value:
                      </span>
                      <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : log.newValue}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
