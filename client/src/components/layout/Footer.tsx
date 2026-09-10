import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Shirt,
  Package,
  FileText,
  ClipboardList,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Heart,
  ExternalLink,
  Users,
  BarChart3
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#082A5E] text-slate-300 border-t border-[#D4AF37]/30 mt-auto pt-10 pb-8 px-4 sm:px-6 lg:px-10 text-xs shadow-2xl relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand & Enterprise Mission */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo.png"
                alt="Infinity Customizations"
                className="h-9 w-auto object-contain brightness-110 drop-shadow-sm"
              />
              <div>
                <span className="font-black text-sm tracking-tight text-white uppercase flex items-center gap-1">
                  <span className="text-[#D4AF37] text-base font-serif">∞</span>
                  <span>INFINITY</span>
                  <span className="text-[#D4AF37]">CUSTOMIZATIONS</span>
                </span>
                <p className="text-[9px] uppercase tracking-wider text-[#F5E7B2] font-bold">
                  Enterprise Apparel & Smart Billing
                </p>
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed text-[11px]">
              Hyderabad's premier platform for bespoke custom apparel, DTF printing, and institutional merchandise. Delivering verified quality with transparent real-time financial tracking.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-[#D4AF37]/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-white">50/50 Equal Co-Partnership</span>
            </div>
          </div>

          {/* Column 2: Core Production Lines */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Shirt className="w-3.5 h-3.5" />
              <span>Production Specialties</span>
            </h3>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <span className="text-[#D4AF37]">•</span>
                <span>Custom Pure Cotton & Poly Cotton T-Shirts</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <span className="text-[#D4AF37]">•</span>
                <span>Collar Polo Tees & Streetwear Oversized (240 GSM)</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <span className="text-[#D4AF37]">•</span>
                <span>PVC ID Cards & Multicolor Sublimation Lanyards</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <span className="text-[#D4AF37]">•</span>
                <span>Custom Embroidered & Screen Printed Caps</span>
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors">
                <span className="text-[#D4AF37]">•</span>
                <span>High-Definition Direct-To-Film (DTF) Rolls</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              <span>Quick Navigation</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <NavLink to="/dashboard" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Dashboard
              </NavLink>
              <NavLink to="/quotations" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Quotations
              </NavLink>
              <NavLink to="/orders" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Orders & Jobs
              </NavLink>
              <NavLink to="/t-shirts" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                T-Shirt Hub
              </NavLink>
              <NavLink to="/invoices" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Invoices & Bills
              </NavLink>
              <NavLink to="/customers" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Customers
              </NavLink>
              <NavLink to="/reports" className="text-slate-300 hover:text-[#D4AF37] transition-colors">
                Reports & P&L
              </NavLink>
              <NavLink to="/ai-invoice" className="text-slate-300 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                <span>AI Invoice</span>
                <Sparkles className="w-2.5 h-2.5 text-[#D4AF37]" />
              </NavLink>
            </div>

            <div className="pt-2 text-[10px] text-slate-400 border-t border-white/10 space-y-1">
              <p className="flex items-center gap-1 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enterprise v2.6.0 • End-to-End Encrypted</span>
              </p>
            </div>
          </div>

          {/* Column 4: Partnership & Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Partnership Executive</span>
            </h3>

            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <p className="font-bold text-white text-xs">S Jashwanth Reddy & Rajshekar Reddy</p>
                <p className="text-[10px] text-[#F5E7B2]">Managing Partners & Co-Owners</p>
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                  <span>Jubilee Hills Designer Hub, Hyderabad</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-[#D4AF37] shrink-0" />
                  <span>+91 98765 43210</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-[#D4AF37] shrink-0" />
                  <span>business@infinitycustomizations.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Prominent Signature */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-300">
          <p>© {new Date().getFullYear()} Infinity Customizations. All rights reserved.</p>

          {/* Developed by S Jashwanth Reddy */}
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#D4AF37]/40 shadow-xs">
            <span className="text-slate-300">Developed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-slate-300">by</span>
            <strong className="text-white font-black tracking-wide text-xs">
              <span className="text-[#D4AF37]">S Jashwanth Reddy</span>
            </strong>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span>GST: 36AAACI1234F1Z5</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">● System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
