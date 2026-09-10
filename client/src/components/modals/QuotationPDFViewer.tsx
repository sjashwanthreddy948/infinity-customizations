import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Printer,
  Share2,
  X,
  FileCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LOGO_DATA_URI } from '../../assets/logoBase64.js';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../common/BackButton.js';

interface QuotationPDFViewerProps {
  quotation: any;
  isOpen: boolean;
  onClose: () => void;
  onConverted?: (newOrder: any) => void;
}

export const QuotationPDFViewer: React.FC<QuotationPDFViewerProps> = ({
  quotation,
  isOpen,
  onClose,
  onConverted
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isConverting, setIsConverting] = useState(false);

  if (!isOpen || !quotation) return null;

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${quotation.quotation_number}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const itemsSummary = (quotation.items || []).map((it: any) => `• ${it.quantity}x ${it.description} @ ₹${(it.rate || 0).toLocaleString('en-IN')}`).join('\n');
    const text = `Hello *${quotation.customer_name || 'Sir/Madam'}*,\n\nGreetings from *Infinity Customizations*! Here is your requested official quotation:\n\n📄 *Quotation #:* ${quotation.quotation_number}\n📅 *Valid Until:* ${quotation.valid_until || '15 Days'}\n\n*Quotation Details:*\n${itemsSummary}\n\n💰 *Grand Total:* ₹${(quotation.grand_total || 0).toLocaleString('en-IN')}\n\n${quotation.notes || '50% advance to start production, balance on delivery.'}\n\nPlease let us know if you would like us to proceed with sample proofing!`;
    const phone = quotation.customer_phone ? String(quotation.customer_phone).replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10
      ? `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleConvert = async () => {
    const confirmConvert = window.confirm(
      `Convert Quotation ${quotation.quotation_number} into an active Order & Invoice for ₹${(quotation.grand_total || 0).toLocaleString('en-IN')}?`
    );
    if (!confirmConvert) return;

    try {
      setIsConverting(true);
      const token = localStorage.getItem('partnerledger_token') || 'demo-jwt-usr-jashwanth-1-default';
      const res = await fetch(`/api/quotations/${quotation.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        onClose();
        if (onConverted) {
          onConverted(data.order);
        } else {
          navigate(`/orders/${data.order.id}`);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to convert quotation');
      }
    } catch (e) {
      console.error(e);
      alert('Error converting quotation');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-4xl my-6 rounded-2xl bg-white dark:bg-[#082A5E] border border-slate-200 dark:border-blue-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Top Action Toolbar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-blue-900/60 bg-slate-50 dark:bg-[#051E44] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5">
              <BackButton onClick={onClose} label="Back to Quotations" />
              <span className="font-mono font-black text-sm text-[#0B3A82] dark:text-[#D4AF37]">
                {quotation.quotation_number}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                quotation.status === 'CONVERTED'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200'
                  : 'bg-blue-50 text-[#0B3A82] dark:bg-blue-950 dark:text-[#D4AF37] border border-blue-200'
              }`}>
                {quotation.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {quotation.status !== 'CONVERTED' && (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="px-3 sm:px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  title="Convert quotation directly into an active Order & Invoice"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{isConverting ? 'Converting...' : 'Convert to Order'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                title="Send quotation via WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-xs border border-[#D4AF37]/50 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-blue-950 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable A4 Quotation Sheet Preview */}
          <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100 dark:bg-[#051E44]">
            <div
              ref={printRef}
              id="printable-quotation"
              className="max-w-[780px] mx-auto bg-white text-slate-900 p-6 sm:p-10 rounded-2xl shadow-xl border border-slate-200 font-sans"
              style={{ minHeight: '900px' }}
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div>
                  <img
                    src={LOGO_DATA_URI}
                    alt="Infinity Customizations Logo"
                    className="h-16 w-auto object-contain max-w-[220px] mb-2"
                  />
                  <p className="text-xs text-slate-600 font-semibold">
                    Customized Merchandise, T-Shirts & Personalized Corporate Gifts
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    Plot 42, Designer Hub, Jubilee Hills, Hyderabad, Telangana 500033
                  </p>
                  <p className="text-xs text-slate-600">
                    Phone: +91 98765 43210 · Email: hello@infinitycustomizations.com
                  </p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    <strong>GSTIN:</strong> 36AAACI1234F1Z5
                  </p>
                </div>

                <div className="text-right">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">QUOTATION</h1>
                  <p className="text-base font-bold text-[#0B3A82] font-mono mt-1">
                    {quotation.quotation_number}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <p><strong>Date:</strong> {quotation.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10)}</p>
                    <p><strong>Valid Until:</strong> <span className="font-bold text-slate-900">{quotation.valid_until}</span></p>
                    <p><strong>Representative:</strong> {quotation.created_by_name || 'Jashwanth Reddy'}</p>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-slate-200 text-xs">
                <div>
                  <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                    Quotation Prepared For
                  </h3>
                  <p className="text-base font-black text-slate-900">{quotation.customer_name}</p>
                  <p className="text-slate-700 mt-0.5">Contact: <strong>{quotation.customer_phone}</strong></p>
                  {quotation.customer_email && (
                    <p className="text-slate-600">Email: {quotation.customer_email}</p>
                  )}
                  {quotation.customer_address && (
                    <p className="text-slate-600 mt-1">Address: {quotation.customer_address}</p>
                  )}
                </div>

                <div className="text-right space-y-1">
                  <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">
                    Terms & Status
                  </h3>
                  <p className="text-slate-700">Status: <strong className="text-[#0B3A82]">{quotation.status}</strong></p>
                  <p className="text-slate-600">Validity: <strong>15 Days from Issue</strong></p>
                  {quotation.status === 'CONVERTED' && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓ Converted to Active Order
                    </span>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-6">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-2">#</th>
                      <th className="py-2.5 px-4">Item & Specifications</th>
                      <th className="py-2.5 px-4 text-center">Qty</th>
                      <th className="py-2.5 px-4 text-right">Unit Rate (₹)</th>
                      <th className="py-2.5 px-4 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {quotation.items && quotation.items.length > 0 ? (
                      quotation.items.map((item: any, idx: number) => {
                        const qty = Number(item.quantity) || 1;
                        const rate = Number(item.rate || item.unit_price) || 0;
                        const amt = Number(item.amount) || (qty * rate);
                        return (
                          <tr key={idx}>
                            <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {item.description}
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-900">{qty}</td>
                            <td className="py-3 px-4 text-right font-mono">₹{rate.toLocaleString('en-IN')}</td>
                            <td className="py-3 px-4 text-right font-bold font-mono">₹{amt.toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td className="py-3 px-2">1</td>
                        <td className="py-3 px-4 font-semibold">Custom Merchandise Order</td>
                        <td className="py-3 px-4 text-center">1</td>
                        <td className="py-3 px-4 text-right font-mono">₹{(Number(quotation.grand_total) || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-right font-bold font-mono">₹{(Number(quotation.grand_total) || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary & Terms */}
              <div className="flex justify-between items-start mb-8 pt-2">
                <div className="max-w-sm text-xs space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Payment Terms & Instructions
                    </h4>
                    <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                      {quotation.notes || '50% advance payment required to commence procurement and production. Remaining 50% payable on delivery.'}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Terms & Conditions
                    </h4>
                    <p className="text-slate-500 leading-relaxed text-[10px]">
                      {quotation.terms || 'Prices quoted are inclusive of finishing and packaging. Delivery within 5-7 working days upon sample signoff.'}
                    </p>
                  </div>
                </div>

                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 py-1">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold">₹{(Number(quotation.subtotal) || 0).toLocaleString('en-IN')}</span>
                  </div>
                  {Number(quotation.discount) > 0 && (
                    <div className="flex justify-between text-emerald-700 py-1">
                      <span>Discount:</span>
                      <span className="font-mono font-semibold">-₹{(Number(quotation.discount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {Number(quotation.tax_amount) > 0 && (
                    <div className="flex justify-between text-slate-600 py-1">
                      <span>GST / Taxes:</span>
                      <span className="font-mono font-semibold">₹{(Number(quotation.tax_amount) || 0).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2 pb-1">
                    <span>Quotation Total:</span>
                    <span className="font-mono text-[#0B3A82]">₹{(Number(quotation.grand_total) || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="border-t-2 border-slate-200 pt-8 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p className="font-bold text-slate-800">Infinity Customizations</p>
                  <p className="text-[10px]">Digital Billing & Business Management System</p>
                </div>

                <div className="text-right">
                  <p className="font-serif font-black text-sm tracking-wider text-[#0B3A82] uppercase">
                    Infinity Customizations
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                    Infinity Customizations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
