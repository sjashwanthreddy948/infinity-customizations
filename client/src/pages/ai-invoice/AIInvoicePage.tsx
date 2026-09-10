import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Send, CheckCircle2, AlertCircle, ArrowRight, Shirt,
  Package, Printer, Truck, IndianRupee, TrendingUp, RefreshCw, Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from '../../components/common/BackButton.js';
import { calculateOrderFinancials } from '../../utils/financialCalculations.js';

const SAMPLE_PROMPTS = [
  "Rahul ordered 2 black XL t-shirts with front printing for ₹2500. T-shirt cost is ₹900, printing is ₹400 and Rapido is ₹120. Generate invoice.",
  "Priya ordered 4 white M t-shirts with front & back print for ₹4800. T-shirt cost is ₹1600, printing is ₹1000 and Rapido is ₹150.",
  "Vikram ordered 1 wooden photo frame for ₹1800. Material cost is ₹550, printing is ₹350 and Rapido delivery is ₹100.",
  "Ananya ordered 2 magic mugs for ₹850. Blank mug cost is ₹200, sublimation print is ₹160 and Rapido is ₹90."
];

export const AIInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isConfirmedCreating, setIsConfirmedCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);

  // Editable Review State
  const [reviewCustomer, setReviewCustomer] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewProduct, setReviewProduct] = useState('');
  const [reviewQuantity, setReviewQuantity] = useState(1);
  const [reviewSelling, setReviewSelling] = useState(0);
  const [reviewProdCost, setReviewProdCost] = useState(0);
  const [reviewPrintCost, setReviewPrintCost] = useState(0);
  const [reviewDelivery, setReviewDelivery] = useState(0);
  const [reviewOther, setReviewOther] = useState(0);
  const [reviewSize, setReviewSize] = useState('L');
  const [reviewColor, setReviewColor] = useState('Black');
  const [reviewPrintType, setReviewPrintType] = useState('Front Print');

  // AI Insights
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    // Fetch AI insights from actual data
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem('partnerledger_token');
        const res = await fetch('/api/ai/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setInsights(json.insights || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchInsights();
  }, []);

  const handleExtract = async (textToExtract?: string) => {
    const text = textToExtract || prompt;
    if (!text.trim()) {
      setError('Please type an order description or click a sample prompt');
      return;
    }

    setIsExtracting(true);
    setError('');
    setCreatedResult(null);

    try {
      const token = localStorage.getItem('partnerledger_token');
      const res = await fetch('/api/ai/parse-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: text })
      });

      if (!res.ok) throw new Error('AI extraction failed');
      const data = await res.json();

      setExtractedData(data.extracted);
      // Initialize review fields
      setReviewCustomer(data.extracted.customer_name);
      setReviewPhone(data.extracted.customer_phone);
      setReviewProduct(data.extracted.product_name);
      setReviewQuantity(data.extracted.quantity);
      setReviewSelling(data.extracted.selling_price);
      setReviewProdCost(data.extracted.product_cost);
      setReviewPrintCost(data.extracted.printing_cost);
      setReviewDelivery(data.extracted.delivery_cost);
      setReviewOther(data.extracted.other_cost || 0);
      setReviewSize(data.extracted.tshirt_size || 'L');
      setReviewColor(data.extracted.tshirt_color || 'Black');
      setReviewPrintType(data.extracted.tshirt_print_type || 'Front Print');
    } catch (err: any) {
      setError(err.message || 'Failed to extract order');
    } finally {
      setIsExtracting(false);
    }
  };

  // Live calculation for review card using centralized financial engine
  const financials = calculateOrderFinancials({
    sellingPrice: reviewSelling,
    productCost: reviewProdCost,
    printingCost: reviewPrintCost,
    deliveryCost: reviewDelivery,
    otherCost: reviewOther,
    paymentReceived: reviewSelling
  });
  const totalCost = financials.totalCost;
  const profit = financials.profit;
  const profitMargin = financials.profitMargin.toFixed(1);
  const availableAmount = financials.availableAmount;

  const handleConfirmAndCreate = async () => {
    setIsConfirmedCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('partnerledger_token');
      const isTshirt = reviewProduct.toLowerCase().includes('t-shirt') || reviewProduct.toLowerCase().includes('tshirt');

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          customer_name: reviewCustomer,
          customer_phone: reviewPhone,
          product_name: reviewProduct,
          quantity: reviewQuantity,
          selling_price: reviewSelling,
          payment_received: reviewSelling,
          product_cost: reviewProdCost,
          printing_cost: reviewPrintCost,
          delivery_cost: reviewDelivery,
          other_cost: reviewOther,
          is_tshirt: isTshirt ? 1 : 0,
          tshirt_size: isTshirt ? reviewSize : null,
          tshirt_color: isTshirt ? reviewColor : null,
          tshirt_print_type: isTshirt ? reviewPrintType : null,
          notes: `AI Invoice Fast Entry: "${prompt}"`
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create order and invoice');
      }

      const orderData = await res.json();
      setCreatedResult(orderData);
      setExtractedData(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setIsConfirmedCreating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div>
        <BackButton to="/orders" label="Back to Orders" />
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B3A82]/10 dark:bg-amber-500/10 text-[#0B3A82] dark:text-[#D4AF37] text-xs font-bold border border-[#D4AF37]/30">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Smart Order & Invoice Assistant</span>
        </div>
        <h1 className="text-3xl font-black text-[#172033] dark:text-white">
          AI Invoice Assistant
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto">
          Type or paste an order in everyday language. AI extracts the customer, specifications, and costs. Review the numbers before saving.
        </p>
      </div>

      {/* Input Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Natural Language Order Prompt
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="e.g. Rahul ordered 2 black XL t-shirts with front printing for ₹2500. T-shirt cost is ₹900, printing is ₹400 and Rapido is ₹120. Generate invoice."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3.5 sm:p-4 text-base sm:text-sm rounded-2xl border border-slate-300 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] text-[#172033] dark:text-white placeholder:text-slate-500 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B3A82]"
            />
            <div className="flex justify-end mt-2.5 sm:mt-0 sm:absolute sm:right-3 sm:bottom-3">
              <button
                type="button"
                onClick={() => handleExtract()}
                disabled={isExtracting || !prompt.trim()}
                className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 border border-[#D4AF37]/40 active:scale-98"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D4AF37]" />
                    <span>Extracting Details...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Parse Order & Generate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sample Prompt Chips */}
        <div>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
            <span>Try sample prompts:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(sample);
                  handleExtract(sample);
                }}
                className="text-left text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-blue-950/60 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-blue-900/40 font-medium transition-colors"
              >
                "{sample.slice(0, 50)}..."
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Notification if Created */}
      {createdResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-4 text-center"
        >
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <div>
            <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
              Order #{createdResult.order_number} & Invoice #{createdResult.invoice_number} Created!
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
              Customer: {createdResult.customer_name} · Total: ₹{createdResult.selling_price?.toLocaleString('en-IN')} · Profit: ₹{createdResult.profit?.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/orders/${createdResult.id}`)}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A82] rounded-xl shadow-md"
            >
              View Order Details
            </button>
            <button
              onClick={() => navigate(`/invoices/${createdResult.invoice_id}`)}
              className="px-5 py-2 text-xs font-bold text-[#082A5E] bg-[#D4AF37] rounded-xl shadow-md"
            >
              View Printable A4 Invoice
            </button>
          </div>
        </motion.div>
      )}

      {/* REVIEW SCREEN (Strict Prompt Requirement: AI never silently finalizes) */}
      {extractedData && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white dark:bg-[#082A5E] border-2 border-[#D4AF37]/50 shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-blue-900/40 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4AF37] animate-pulse" />
              <h2 className="text-base font-bold text-[#172033] dark:text-white uppercase tracking-wide">
                Review Extracted Information
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0B3A82] dark:bg-blue-950 dark:text-blue-300">
              User Confirmation Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Customer Name</label>
              <input
                type="text"
                value={reviewCustomer}
                onChange={(e) => setReviewCustomer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Phone Number</label>
              <input
                type="text"
                value={reviewPhone}
                onChange={(e) => setReviewPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Product</label>
              <input
                type="text"
                value={reviewProduct}
                onChange={(e) => setReviewProduct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={reviewQuantity}
                onChange={(e) => setReviewQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">T-Shirt Size</label>
              <input
                type="text"
                value={reviewSize}
                onChange={(e) => setReviewSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Color & Print</label>
              <input
                type="text"
                value={`${reviewColor} - ${reviewPrintType}`}
                onChange={(e) => setReviewColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          {/* Cost Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-blue-950/60 border border-slate-200 dark:border-blue-900/40 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Selling Amount</label>
              <input
                type="number"
                value={reviewSelling}
                onChange={(e) => setReviewSelling(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 font-bold rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Product Cost</label>
              <input
                type="number"
                value={reviewProdCost}
                onChange={(e) => setReviewProdCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Printing Cost</label>
              <input
                type="number"
                value={reviewPrintCost}
                onChange={(e) => setReviewPrintCost(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Rapido / Delivery</label>
              <input
                type="number"
                value={reviewDelivery}
                onChange={(e) => setReviewDelivery(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Other Cost</label>
              <input
                type="number"
                value={reviewOther}
                onChange={(e) => setReviewOther(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-blue-900 bg-white dark:bg-[#051E44] text-slate-900 dark:text-white font-semibold"
              />
            </div>
          </div>

          {/* Mathematical Totals Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#082A5E] to-[#0B3A82] text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Total Calculated Cost</p>
              <p className="text-base font-bold text-rose-300">₹{totalCost.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#F5E7B2]">Net Calculated Profit</p>
              <p className="text-xl font-black text-[#D4AF37]">₹{profit.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Profit Margin</p>
              <p className="text-base font-bold text-white">{profitMargin}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Available Amount</p>
              <p className="text-base font-bold text-emerald-300">₹{availableAmount.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={handleConfirmAndCreate}
              disabled={isConfirmedCreating}
              className="px-6 py-2.5 text-xs font-bold text-[#082A5E] bg-[#D4AF37] hover:bg-[#F5E7B2] rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              {isConfirmedCreating ? (
                <span>Generating Order & Invoice...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Create Order + Invoice</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Business Insights based on Real Database Metrics */}
      {insights.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-[#9A7B1C] dark:text-[#D4AF37]" />
            <span>AI Business Insights (Calculated from Real Database Data)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/50 shadow-card flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#9A7B1C] dark:text-[#D4AF37] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#172033] dark:text-white">{insight.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">{insight.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
