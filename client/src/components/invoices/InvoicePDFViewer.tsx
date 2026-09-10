import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Printer, ShieldCheck, CheckCircle2, Share2 } from 'lucide-react';
import { LOGO_DATA_URI } from '../../assets/logoBase64.js';

interface InvoicePDFViewerProps {
  invoice: any;
  business?: any;
}

export const InvoicePDFViewer: React.FC<InvoicePDFViewerProps> = ({ invoice, business }) => {
  const printRef = useRef<HTMLDivElement>(null);

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

      pdf.save(`${invoice.invoice_number}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `Hello ${invoice.customer_name || 'Customer'},\n\nHere are your invoice details from *Infinity Customizations*:\n\n📄 *Invoice #:* ${invoice.invoice_number}\n💰 *Grand Total:* ₹${(invoice.grand_total || 0).toLocaleString('en-IN')}\n💳 *Balance Due:* ₹${(invoice.balance_due || 0).toLocaleString('en-IN')}\n📅 *Issue Date:* ${invoice.issue_date}\n\nThank you for choosing Infinity Customizations!`;
    const phone = invoice.customer_phone ? String(invoice.customer_phone).replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10
      ? `https://wa.me/${phone.length === 10 ? '91' + phone : phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const isPaid = invoice.status === 'PAID';
  const isCancelled = invoice.status === 'CANCELLED' || invoice.status === 'VOID';

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-xs text-slate-400 hidden sm:block">A4 Print & Share Engine</p>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share WhatsApp</span>
          </button>
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md border border-[#D4AF37]/50 transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Mobile Swipe Notice */}
      <div className="sm:hidden text-center">
        <span className="text-[10px] text-slate-400 uppercase font-semibold">← Swipe invoice to pan on small screens →</span>
      </div>

      {/* Printable A4 Sheet with Mobile Horizontal Scroll Container */}
      <div className="w-full overflow-x-auto pb-4 -mx-1 px-1">
        <div
          ref={printRef}
          id="printable-invoice"
          className="min-w-[640px] sm:min-w-[750px] max-w-[800px] mx-auto bg-white text-slate-900 p-6 sm:p-12 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 font-sans"
          style={{ minHeight: '1050px' }}
        >
        {/* Header with Brand Logo & Details */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={LOGO_DATA_URI}
                alt="Infinity Customizations Logo"
                className="h-16 w-auto object-contain max-w-[240px]"
              />
            </div>
            <p className="text-xs text-slate-500 font-semibold">
              Customized Merchandise, T-Shirts & Personalized Gifts
            </p>
            <p className="text-xs text-slate-600 max-w-sm mt-1 leading-relaxed">
              {business?.address || 'Plot 42, Designer Hub, Jubilee Hills, Hyderabad, Telangana 500033'}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Phone: {business?.phone || '+91 98765 43210'} · Email: {business?.email || 'hello@infinitycustomizations.com'}
            </p>
            {business?.gstin && (
              <p className="text-xs text-slate-600 mt-1">
                <strong>GSTIN:</strong> <span className="font-mono">{business.gstin}</span>
              </p>
            )}
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">TAX INVOICE</h2>
            <p className="text-base font-bold text-[#0B3A82] font-mono mt-1">
              {invoice.invoice_number}
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p><strong>Issue Date:</strong> {invoice.issue_date}</p>
              <p><strong>Payment Status:</strong> <span className={`font-bold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>{invoice.status}</span></p>
            </div>
          </div>
        </div>

        {/* Bill To & Delivery Details */}
        <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-100 text-xs">
          <div>
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
              Billed To
            </h3>
            <p className="text-base font-bold text-slate-900">{invoice.customer_name}</p>
            <p className="text-slate-600 mt-1">Phone: {invoice.customer_phone}</p>
            {invoice.customer_email && <p className="text-slate-600">{invoice.customer_email}</p>}
            {invoice.customer_address && <p className="text-slate-600 mt-1">{invoice.customer_address}</p>}
          </div>

          <div className="text-right">
            <h3 className="font-bold text-slate-400 uppercase tracking-wider text-[11px] mb-2">
              Order Details
            </h3>
            {invoice.order_number && (
              <p className="text-slate-700">Order Reference: <strong>{invoice.order_number}</strong></p>
            )}
            <p className="text-slate-700">Payment Mode: <strong>{invoice.payment_method || 'UPI'}</strong></p>
            <p className="text-slate-500 mt-2 italic">Recorded by: {invoice.created_by_name}</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mb-8">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-2">#</th>
                <th className="py-3 px-4">Item & Specifications</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item: any, idx: number) => {
                  const qty = Number(item.quantity) || 1;
                  const unitRate = Number(item.rate ?? item.unit_price) || 0;
                  const itemTotal = Number(item.amount ?? (qty * unitRate)) || 0;
                  return (
                    <tr key={idx}>
                      <td className="py-3 px-2 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">{qty}</td>
                      <td className="py-3 px-4 text-right font-mono">₹{(unitRate).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono">₹{(itemTotal).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-3 px-2 font-mono text-slate-400">1</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {invoice.product_name || 'Custom Merchandise'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold">1</td>
                  <td className="py-3 px-4 text-right font-mono">₹{(Number(invoice.grand_total) || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-bold font-mono">₹{(Number(invoice.grand_total) || 0).toLocaleString('en-IN')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary & Totals */}
        <div className="flex justify-between items-start mb-12">
          <div className="max-w-xs text-xs space-y-2">
            <h4 className="font-bold text-slate-800">Terms & Conditions</h4>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              {invoice.terms || 'Thank you for choosing Infinity Customizations! We craft memories with precision. Custom merchandise is inspected before delivery.'}
            </p>

            {isPaid && (
              <div className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 inline-flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Payment Received in Full (₹{(Number(invoice.amount_paid) || 0).toLocaleString('en-IN')})</span>
              </div>
            )}
          </div>

          <div className="w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 py-1">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">₹{(Number(invoice.subtotal) || 0).toLocaleString('en-IN')}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-emerald-600 py-1">
                <span>Discount:</span>
                <span className="font-mono font-semibold">-₹{(Number(invoice.discount) || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            {Number(invoice.tax_amount) > 0 && (
              <div className="flex justify-between text-slate-600 py-1">
                <span>GST / Tax:</span>
                <span className="font-mono font-semibold">₹{(Number(invoice.tax_amount) || 0).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-900 pt-2 pb-1">
              <span>Total Amount:</span>
              <span className="font-mono text-[#0B3A82]">₹{(Number(invoice.grand_total) || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold py-1">
              <span>Payment Received:</span>
              <span className="font-mono">₹{(Number(invoice.amount_paid) || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1.5">
              <span>Balance Due:</span>
              <span className="font-mono">₹{(Number(invoice.balance_due) || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Footer & Partner Signatures */}
        <div className="border-t-2 border-slate-200 pt-8 flex justify-between items-end text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">Infinity Customizations</p>
            <p className="text-[10px]">Hyderabad, Telangana · Digital Billing & Order Ledger</p>
          </div>

          <div className="text-center">
            <div className="w-36 border-b border-slate-400 pb-1 mb-1 font-signature text-sm font-serif italic text-slate-700">
              {invoice.created_by_name || 'Authorized Partner'}
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Authorized Partner Signature</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
