import React, { useState, useEffect } from 'react';
import {
  Settings, Shirt, Users, Building2, Save, CheckCircle2,
  IndianRupee, Package, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

export const SettingsPage: React.FC = () => {
  const { token, user, business } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});

  const fetchSettings = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [prodRes, authRes] = await Promise.all([
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (prodRes.ok) {
        const pData = await prodRes.json();
        setProducts(pData);
      }
      if (authRes.ok) {
        const aData = await authRes.json();
        setPartners(aData.partners || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleUpdateProduct = async (product: any) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          default_selling_price: product.default_selling_price,
          default_product_cost: product.default_product_cost,
          default_printing_cost: product.default_printing_cost
        })
      });

      if (res.ok) {
        setSaveStatus(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [product.id]: false }));
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductFieldChange = (id: string, field: string, val: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: val };
      }
      return p;
    }));
  };

  if (loading && products.length === 0) {
    return <div className="p-16 text-center text-xs text-slate-400 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033] dark:text-white flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#0B3A82] dark:text-[#D4AF37]" />
          <span>Product Defaults & Business Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure default costs and selling prices to speed up order entry
        </p>
      </div>

      {/* SECTION 1: PRODUCT CATALOG & DEFAULT COSTING */}
      <div className="bg-white dark:bg-[#082A5E] rounded-3xl border border-slate-100 dark:border-blue-900/50 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0B3A82] dark:text-[#D4AF37]" />
            <div>
              <h2 className="text-sm font-bold text-[#172033] dark:text-white uppercase tracking-wider">
                Product Catalog & Cost Defaults
              </h2>
              <p className="text-xs text-slate-400">
                These defaults pre-populate when creating orders and can be overridden per order
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Product Default Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {products.map((p) => (
            <div key={p.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{p.name}</h3>
                  <span className="text-[10px] text-slate-500">{p.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleUpdateProduct(p)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs ${
                    saveStatus[p.id]
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#0B3A82] text-white active:scale-95'
                  }`}
                >
                  {saveStatus[p.id] ? 'Saved ✓' : 'Save Defaults'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <label className="block text-[9px] uppercase font-bold text-[#0B3A82] mb-0.5">Selling (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={p.default_selling_price}
                    onChange={(e) => handleProductFieldChange(p.id, 'default_selling_price', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-1.5 py-1 text-xs font-bold text-[#0B3A82] bg-slate-50 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <label className="block text-[9px] uppercase font-bold text-rose-600 mb-0.5">Blank (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={p.default_product_cost}
                    onChange={(e) => handleProductFieldChange(p.id, 'default_product_cost', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-1.5 py-1 text-xs font-bold text-rose-600 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <label className="block text-[9px] uppercase font-bold text-amber-600 mb-0.5">Print (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={p.default_printing_cost}
                    onChange={(e) => handleProductFieldChange(p.id, 'default_printing_cost', Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-1.5 py-1 text-xs font-bold text-amber-600 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Products Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] dark:bg-blue-950/60 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100 dark:border-blue-900/40">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Default Selling Price (₹)</th>
                <th className="py-3 px-4">Default Blank/Material (₹)</th>
                <th className="py-3 px-4">Default Printing (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-blue-900/30">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/20 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#172033] dark:text-white">
                    {p.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-blue-950 text-[10px] font-semibold">
                      {p.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      value={p.default_selling_price}
                      onChange={(e) => handleProductFieldChange(p.id, 'default_selling_price', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 px-2 py-1 font-bold rounded-lg border border-slate-200 dark:border-blue-900 bg-white dark:bg-[#051E44] text-[#0B3A82] dark:text-white"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      value={p.default_product_cost}
                      onChange={(e) => handleProductFieldChange(p.id, 'default_product_cost', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-blue-900 bg-white dark:bg-[#051E44] text-rose-600 dark:text-rose-400 font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      value={p.default_printing_cost}
                      onChange={(e) => handleProductFieldChange(p.id, 'default_printing_cost', Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-blue-900 bg-white dark:bg-[#051E44] text-amber-600 dark:text-amber-400 font-semibold"
                    />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleUpdateProduct(p)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        saveStatus[p.id]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#0B3A82] hover:bg-[#082A5E] text-white'
                      }`}
                    >
                      {saveStatus[p.id] ? 'Saved ✓' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DUAL-PARTNER ACCOUNTS */}
      <div className="bg-white dark:bg-[#082A5E] rounded-3xl border border-slate-100 dark:border-blue-900/50 shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-blue-900/40 pb-3">
          <Users className="w-5 h-5 text-[#0B3A82] dark:text-[#D4AF37]" />
          <div>
            <h2 className="text-sm font-bold text-[#172033] dark:text-white uppercase tracking-wider">
              Dual-Partner Partnership Accounts
            </h2>
            <p className="text-xs text-slate-400">
              Both partners access the exact same shared business data with 100% financial transparency
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {partners.map((partner, index) => (
            <div
              key={partner.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051E44] border border-slate-200/80 dark:border-blue-900/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Partner {index + 1} ({partner.role})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                  {partner.partner_share_percentage}% Share
                </span>
              </div>
              <p className="text-base font-bold text-[#172033] dark:text-white">{partner.full_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{partner.email}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{partner.phone}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: BUSINESS PROFILE */}
      <div className="bg-white dark:bg-[#082A5E] rounded-3xl border border-slate-100 dark:border-blue-900/50 shadow-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-blue-900/40 pb-3">
          <Building2 className="w-5 h-5 text-[#0B3A82] dark:text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-[#172033] dark:text-white uppercase tracking-wider">
            Business Profile & Tax Details
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Business Name:</span>
            <p className="font-bold text-slate-800 dark:text-white mt-0.5">Infinity Customizations</p>
          </div>
          <div>
            <span className="text-slate-400">GSTIN / Tax ID:</span>
            <p className="font-mono font-bold text-slate-800 dark:text-white mt-0.5">36AAACI1234F1Z5</p>
          </div>
          <div>
            <span className="text-slate-400">Studio Workshop Address:</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              Plot 42, Designer Hub, Jubilee Hills, Hyderabad, Telangana 500033
            </p>
          </div>
          <div>
            <span className="text-slate-400">Contact Details:</span>
            <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">
              +91 98765 43210 · hello@infinitycustomizations.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
