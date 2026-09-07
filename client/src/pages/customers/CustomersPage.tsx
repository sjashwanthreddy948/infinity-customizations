import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, Eye, Phone, Mail, MapPin, TrendingUp, IndianRupee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useWebSocket } from '../../context/WebSocketContext.js';
import { AddCustomerModal } from '../../components/modals/AddCustomerModal.js';
import { TableSkeleton } from '../../components/common/SkeletonLoader.js';
import { EmptyState } from '../../components/common/EmptyState.js';

export const CustomersPage: React.FC = () => {
  const { token } = useAuth();
  const { refreshTrigger } = useWebSocket();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      let url = '/api/customers';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token, search, refreshTrigger]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
            <span>Customer Profiles</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track customer orders, payments, outstanding balance & net profit generated
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white font-bold text-xs shadow-md shadow-blue-900/20 border border-[#D4AF37]/40"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-100 dark:border-blue-900/50 shadow-card">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, address, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] text-[#172033] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
          />
        </div>
      </div>

      {/* Mobile Customer Cards (Shown on phones < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <TableSkeleton rows={3} columns={2} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add your first customer to track their orders and lifetime profit."
            actionLabel="+ Add Customer"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          customers.map((c) => {
            const spent = c.calculated_spent !== undefined ? c.calculated_spent : c.total_spent;
            const paid = c.calculated_paid !== undefined ? c.calculated_paid : c.total_paid;
            const pending = c.calculated_pending !== undefined ? c.calculated_pending : c.outstanding_balance;
            const profit = c.calculated_profit !== undefined ? c.calculated_profit : c.total_profit_generated;

            return (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm active:scale-[0.99] transition-transform cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-sm text-[#0B3A82]">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{c.customer_code}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B3A82] font-bold text-xs border border-blue-100">
                    {c.active_orders_count || c.total_orders || 0} Orders
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{c.phone}</span>
                  {c.address && <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{c.address}</span>}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Total Spent</p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">₹{spent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] uppercase font-bold text-slate-400">Balance Due</p>
                    <p className={`text-xs font-bold mt-0.5 ${pending > 0 ? 'text-amber-600 font-black' : 'text-slate-400'}`}>
                      ₹{pending.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50/50 border border-blue-100/50">
                    <p className="text-[9px] uppercase font-bold text-[#0B3A82]">Profit</p>
                    <p className="text-xs font-black text-[#D4AF37] mt-0.5">₹{profit.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Customers Table (Hidden on mobile < md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add your first customer to track their orders and lifetime profit."
            actionLabel="+ Add Customer"
            onAction={() => setShowAddModal(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone & Area</th>
                  <th className="py-3.5 px-4 text-center">Total Orders</th>
                  <th className="py-3.5 px-4 text-right">Total Spent</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-right">Pending Balance</th>
                  <th className="py-3.5 px-4 text-right">Profit Generated</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <p className="font-bold text-[#0B3A82]">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.customer_code}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-700">{c.phone}</p>
                      {c.address && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{c.address}</p>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 font-bold text-[#0B3A82]">
                        {c.active_orders_count || c.total_orders || 0}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      ₹{(c.calculated_spent !== undefined ? c.calculated_spent : c.total_spent).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      ₹{(c.calculated_paid !== undefined ? c.calculated_paid : c.total_paid).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {(c.calculated_pending !== undefined ? c.calculated_pending : c.outstanding_balance) > 0 ? (
                        <span className="font-bold text-amber-600">
                          ₹{(c.calculated_pending !== undefined ? c.calculated_pending : c.outstanding_balance).toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-[#D4AF37]">
                      ₹{(c.calculated_profit !== undefined ? c.calculated_profit : c.total_profit_generated).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/customers/${c.id}`);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-[#0B3A82]"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => fetchCustomers()}
      />
    </div>
  );
};
