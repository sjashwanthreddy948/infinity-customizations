import React, { useState, useEffect } from 'react';
import {
  X, Shirt, IndianRupee, TrendingUp, Truck, Printer, Package, AlertCircle,
  Plus, Check, Layers, Copy, Trash2, CreditCard, Sparkles, User, Phone, Mail, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';
import { calculateOrderPartnerShare } from '../../utils/partnerShare';
import { calculateOrderFinancials } from '../../utils/financialCalculations';
import { BackButton } from '../common/BackButton';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: any) => void;
  initialData?: any;
}

export type NeckType = 'Round Neck' | 'Collar';
export type FabricType = 'Pure Cotton' | 'Cotton' | 'Poly Cotton' | 'Nano Curve';

export interface TShirtVariantState {
  id: string;
  neckType: NeckType;
  fabric: FabricType;
  color: string;
  sizes: { S: number; M: number; L: number; XL: number; XXL: number };
  unitBlankCost: number;
  unitSellingPrice: number;
}

const OTHER_PRODUCTS = [
  { name: 'Photo Frame', defaultSelling: 799, defaultCost: 250, defaultPrint: 150 },
  { name: 'Custom Mug', defaultSelling: 399, defaultCost: 100, defaultPrint: 80 },
  { name: 'Bouquet', defaultSelling: 1299, defaultCost: 500, defaultPrint: 100 },
  { name: 'Custom Cap', defaultSelling: 499, defaultCost: 150, defaultPrint: 120 },
  { name: 'Personalized Album', defaultSelling: 1899, defaultCost: 600, defaultPrint: 400 },
  { name: 'Polaroid Prints (Pack of 20)', defaultSelling: 499, defaultCost: 100, defaultPrint: 100 },
  { name: 'Customized Calendar', defaultSelling: 699, defaultCost: 180, defaultPrint: 150 },
  { name: 'Fridge Magnets (Set of 4)', defaultSelling: 299, defaultCost: 60, defaultPrint: 50 },
  { name: 'Customized Gift Hamper', defaultSelling: 1499, defaultCost: 500, defaultPrint: 250 },
  { name: 'Photo Restoration', defaultSelling: 899, defaultCost: 50, defaultPrint: 200 },
  { name: 'Other Customized Products', defaultSelling: 999, defaultCost: 300, defaultPrint: 200 },
];

const ID_CARD_TYPES = [
  'PVC Card + Multicolor Printed Lanyard',
  'Standard PVC Card + Normal Lanyard',
  'Premium Satin Ribbon Lanyard + Card',
  'ID Card with Clip / Yoyo Retractor',
  'Smart NFC / RFID Card + Lanyard',
  'Custom Lanyard & Badge Holder'
];

const TSHIRT_COLORS = [
  'Black', 'White', 'Navy Blue', 'Maroon', 'Charcoal Grey',
  'Olive Green', 'Royal Blue', 'Red', 'Yellow', 'Custom Color'
];

export const getDefaultBlankCost = (neck: NeckType, fabric: FabricType): number => {
  if (neck === 'Collar') {
    if (fabric === 'Pure Cotton') return 240;
    if (fabric === 'Nano Curve') return 220;
    if (fabric === 'Cotton') return 200;
    return 180; // Poly Cotton
  } else {
    if (fabric === 'Pure Cotton') return 190;
    if (fabric === 'Nano Curve') return 170;
    if (fabric === 'Cotton') return 160;
    return 130; // Poly Cotton
  }
};

export const getDefaultSellingPrice = (neck: NeckType, fabric: FabricType): number => {
  if (neck === 'Collar') {
    if (fabric === 'Pure Cotton') return 550;
    if (fabric === 'Nano Curve') return 520;
    if (fabric === 'Cotton') return 480;
    return 450;
  } else {
    if (fabric === 'Pure Cotton') return 480;
    if (fabric === 'Nano Curve') return 450;
    if (fabric === 'Cotton') return 420;
    return 380;
  }
};

const createInitialVariant = (id: string, neck: NeckType = 'Round Neck', fabric: FabricType = 'Pure Cotton', color = 'Black'): TShirtVariantState => ({
  id,
  neckType: neck,
  fabric,
  color,
  sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  unitBlankCost: getDefaultBlankCost(neck, fabric),
  unitSellingPrice: getDefaultSellingPrice(neck, fabric)
});

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData
}) => {
  // Mode: 'tshirt' or 'other'
  const [productType, setProductType] = useState<'tshirt' | 'other'>('tshirt');

  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // T-Shirt Multi-Variants Array
  const [variants, setVariants] = useState<TShirtVariantState[]>([
    createInitialVariant('var-1', 'Round Neck', 'Pure Cotton', 'Black')
  ]);

  // Common Print Specs
  const [tshirtPrintType, setTshirtPrintType] = useState('Front Print');
  const [frontPrint, setFrontPrint] = useState(true);
  const [backPrint, setBackPrint] = useState(false);
  const [sleevePrint, setSleevePrint] = useState(false);

  // ID Cards Add-On Section
  const [hasIdCards, setHasIdCards] = useState(false);
  const [idCardType, setIdCardType] = useState('PVC Card + Multicolor Printed Lanyard');
  const [idCardQuantity, setIdCardQuantity] = useState(1);
  const [idCardUnitCost, setIdCardUnitCost] = useState(35);
  const [idCardUnitSelling, setIdCardUnitSelling] = useState(75);

  // Other Product Specific
  const [otherProductName, setOtherProductName] = useState('Photo Frame');
  const [otherQuantity, setOtherQuantity] = useState(1);
  const [otherUnitCost, setOtherUnitCost] = useState(250);
  const [otherUnitSelling, setOtherUnitSelling] = useState(799);

  // Printing Calculated in Meters (default: 1 meter @ ₹300/m)
  const [printMeters, setPrintMeters] = useState(1);
  const [printRatePerMeter, setPrintRatePerMeter] = useState(300);

  // Separate Rapido & Other Costs
  const [tshirtRapidoCost, setTshirtRapidoCost] = useState(0);
  const [printRapidoCost, setPrintRapidoCost] = useState(0);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const [otherCost, setOtherCost] = useState(0);

  // Customer Price & Advance
  const [sellingPrice, setSellingPrice] = useState(480);
  const [paymentReceived, setPaymentReceived] = useState(480);
  const [customPriceManual, setCustomPriceManual] = useState(false);

  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Variant management handlers
  const updateVariant = (id: string, updates: Partial<TShirtVariantState>) => {
    setVariants(prev => prev.map(v => {
      if (v.id === id) {
        const next = { ...v, ...updates };
        if (updates.neckType && !updates.unitBlankCost) {
          next.unitBlankCost = getDefaultBlankCost(updates.neckType, next.fabric);
          next.unitSellingPrice = getDefaultSellingPrice(updates.neckType, next.fabric);
        } else if (updates.fabric && !updates.unitBlankCost) {
          next.unitBlankCost = getDefaultBlankCost(next.neckType, updates.fabric);
          next.unitSellingPrice = getDefaultSellingPrice(next.neckType, updates.fabric);
        }
        return next;
      }
      return v;
    }));
  };

  const handleVariantSizeChange = (variantId: string, sizeKey: 'S' | 'M' | 'L' | 'XL' | 'XXL', value: string) => {
    const num = Math.max(0, parseInt(value, 10) || 0);
    setVariants(prev => prev.map(v => {
      if (v.id === variantId) {
        return {
          ...v,
          sizes: { ...v.sizes, [sizeKey]: num }
        };
      }
      return v;
    }));
  };

  const addVariant = () => {
    const newId = `var-${Date.now()}`;
    const nextNeck: NeckType = variants[variants.length - 1]?.neckType === 'Collar' ? 'Round Neck' : 'Collar';
    setVariants(prev => [...prev, createInitialVariant(newId, nextNeck, 'Pure Cotton', 'White')]);
  };

  const duplicateVariant = (id: string) => {
    const target = variants.find(v => v.id === id);
    if (!target) return;
    const newId = `var-${Date.now()}`;
    setVariants(prev => [...prev, { ...target, id: newId, sizes: { ...target.sizes } }]);
  };

  const removeVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // Aggregated totals across all variants
  const totalTshirtQty = variants.reduce((acc, v) => {
    return acc + (v.sizes.S || 0) + (v.sizes.M || 0) + (v.sizes.L || 0) + (v.sizes.XL || 0) + (v.sizes.XXL || 0);
  }, 0);

  const effectiveTshirtQty = totalTshirtQty > 0 ? totalTshirtQty : 1;
  const activeQuantity = productType === 'tshirt' ? effectiveTshirtQty : otherQuantity;

  // Auto-sync ID card quantity with total T-shirt count
  const syncIdCardWithTshirts = () => {
    setIdCardQuantity(effectiveTshirtQty);
  };

  // Blanks Cost & Selling Calculation
  const totalBlankCost = variants.reduce((acc, v) => {
    const q = (v.sizes.S + v.sizes.M + v.sizes.L + v.sizes.XL + v.sizes.XXL) || (variants.length === 1 ? 1 : 0);
    return acc + Math.round(q * (Number(v.unitBlankCost) || 0));
  }, 0);

  const totalTshirtSelling = variants.reduce((acc, v) => {
    const q = (v.sizes.S + v.sizes.M + v.sizes.L + v.sizes.XL + v.sizes.XXL) || (variants.length === 1 ? 1 : 0);
    return acc + Math.round(q * (Number(v.unitSellingPrice) || 0));
  }, 0);

  // ID Cards Subtotals
  const idCardTotalCost = hasIdCards ? Math.round(Number(idCardQuantity || 0) * Number(idCardUnitCost || 0)) : 0;
  const idCardTotalPrice = hasIdCards ? Math.round(Number(idCardQuantity || 0) * Number(idCardUnitSelling || 0)) : 0;

  // Printing Cost: meters * rate
  const computedPrintingCost = Math.round(Number(printMeters || 0) * Number(printRatePerMeter || 300));

  // Product Cost (Blanks / Materials)
  const computedProductCost = productType === 'tshirt'
    ? totalBlankCost
    : Math.round(otherQuantity * Number(otherUnitCost || 0));

  // Auto-update selling price and advance payment when sizing/cards change
  useEffect(() => {
    if (!customPriceManual) {
      let autoSell = 0;
      if (productType === 'tshirt') {
        autoSell = totalTshirtSelling + idCardTotalPrice;
      } else {
        autoSell = (otherQuantity * otherUnitSelling) + idCardTotalPrice;
      }
      setSellingPrice(autoSell);
      setPaymentReceived(autoSell);
    }
  }, [totalTshirtSelling, idCardTotalPrice, productType, otherQuantity, otherUnitSelling, customPriceManual]);

  // Single Source of Truth: Centralized Financial Calculation Engine
  const financials = calculateOrderFinancials({
    sellingPrice: Number(sellingPrice),
    productCost: computedProductCost + idCardTotalCost,
    printingCost: computedPrintingCost,
    tshirtRapidoCost: Number(tshirtRapidoCost || 0),
    printRapidoCost: Number(printRapidoCost || 0),
    deliveryCost: Number(deliveryCost || 0),
    otherCost: Number(otherCost || 0),
    paymentReceived: Number(paymentReceived)
  });

  const totalCost = financials.totalCost;
  const profit = financials.profit;
  const profitMargin = financials.profitMargin;
  const availableAmount = financials.availableAmount;
  const paymentPending = financials.paymentPending;

  // Partner Share Agreement: Partner (Rajshekar) has 50% share ONLY in T-Shirts, ID Cards & Caps
  const currentProductName = productType === 'tshirt' ? 'Custom Printed T-Shirt' : otherProductName;
  const partnerAlloc = calculateOrderPartnerShare({
    profit,
    product_name: currentProductName,
    is_tshirt: productType === 'tshirt',
    has_id_cards: hasIdCards
  });
  const isSharedOrder = partnerAlloc.isShared;
  const jashwanthOrderShare = partnerAlloc.jashwanthShare;
  const rajshekarOrderShare = partnerAlloc.rajshekarShare;

  // Initial Data population if editing
  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customer_name || '');
      setCustomerPhone(initialData.customer_phone || '');
      setCustomerEmail(initialData.customer_email || '');
      setCustomerAddress(initialData.customer_address || '');

      const isT = initialData.is_tshirt === 1 || initialData.is_tshirt === true || (initialData.product_name && initialData.product_name.toLowerCase().includes('t-shirt'));
      setProductType(isT ? 'tshirt' : 'other');

      if (initialData.tshirt_variants) {
        try {
          const parsed = typeof initialData.tshirt_variants === 'string' ? JSON.parse(initialData.tshirt_variants) : initialData.tshirt_variants;
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVariants(parsed);
          }
        } catch (e) {}
      }

      if (initialData.has_id_cards) {
        setHasIdCards(true);
        if (initialData.id_card_quantity) setIdCardQuantity(Number(initialData.id_card_quantity));
        if (initialData.id_card_type) setIdCardType(initialData.id_card_type);
        if (initialData.id_card_unit_cost) setIdCardUnitCost(Number(initialData.id_card_unit_cost));
        if (initialData.id_card_unit_price) setIdCardUnitSelling(Number(initialData.id_card_unit_price));
      }

      if (initialData.print_meters) setPrintMeters(Number(initialData.print_meters));
      if (initialData.print_rate_per_meter) setPrintRatePerMeter(Number(initialData.print_rate_per_meter));
      if (initialData.tshirt_rapido_cost) setTshirtRapidoCost(Number(initialData.tshirt_rapido_cost));
      if (initialData.print_rapido_cost) setPrintRapidoCost(Number(initialData.print_rapido_cost));
      if (initialData.delivery_cost) setDeliveryCost(Number(initialData.delivery_cost));
      if (initialData.other_cost) setOtherCost(Number(initialData.other_cost));

      if (initialData.selling_price) {
        setSellingPrice(Number(initialData.selling_price));
        setCustomPriceManual(true);
      }
      if (initialData.payment_received !== undefined) {
        setPaymentReceived(Number(initialData.payment_received));
      }
      if (initialData.order_date) setOrderDate(initialData.order_date);
      if (initialData.notes) setNotes(initialData.notes);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      setError('Customer name and phone number are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('partnerledger_token');

      // Build consolidated sizes breakdown
      const aggregatedSizes: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
      variants.forEach(v => {
        aggregatedSizes.S += v.sizes.S || 0;
        aggregatedSizes.M += v.sizes.M || 0;
        aggregatedSizes.L += v.sizes.L || 0;
        aggregatedSizes.XL += v.sizes.XL || 0;
        aggregatedSizes.XXL += v.sizes.XXL || 0;
      });

      const sizeBreakdownText = Object.entries(aggregatedSizes)
        .filter(([_, c]) => c > 0)
        .map(([s, c]) => `${s}: ${c}`)
        .join(', ') || 'Standard';

      const orderPayload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail,
        customer_address: customerAddress,
        product_name: productType === 'tshirt' ? 'Custom Printed T-Shirt' : otherProductName,
        quantity: activeQuantity,
        selling_price: sellingPrice,
        payment_received: paymentReceived,
        product_cost: computedProductCost,
        printing_cost: computedPrintingCost,
        print_meters: printMeters,
        print_rate_per_meter: printRatePerMeter,
        tshirt_rapido_cost: tshirtRapidoCost,
        print_rapido_cost: printRapidoCost,
        delivery_cost: deliveryCost,
        other_cost: otherCost,
        order_date: orderDate,
        notes: notes || undefined,
        is_tshirt: productType === 'tshirt' ? 1 : 0,
        is_partner_shared: isSharedOrder ? 1 : 0,
        tshirt_size: sizeBreakdownText,
        tshirt_color: variants.map(v => v.color).join(', '),
        tshirt_size_breakdown: JSON.stringify(aggregatedSizes),
        tshirt_print_type: tshirtPrintType,
        tshirt_front_print: frontPrint ? 1 : 0,
        tshirt_back_print: backPrint ? 1 : 0,
        tshirt_sleeve_print: sleevePrint ? 1 : 0,
        tshirt_neck_type: variants[0]?.neckType || 'Round Neck',
        tshirt_fabric: variants[0]?.fabric || 'Pure Cotton',
        tshirt_variants: variants,
        has_id_cards: hasIdCards ? 1 : 0,
        id_card_quantity: hasIdCards ? idCardQuantity : 0,
        id_card_type: hasIdCards ? idCardType : null,
        id_card_unit_cost: hasIdCards ? idCardUnitCost : 0,
        id_card_unit_price: hasIdCards ? idCardUnitSelling : 0,
        id_card_total_cost: idCardTotalCost,
        id_card_total_price: idCardTotalPrice
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create order');
      }

      const createdOrder = await res.json();
      onSuccess(createdOrder);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white text-slate-900 w-full max-w-4xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border sm:border-slate-200 overflow-hidden flex flex-col my-0 sm:my-6 font-sans"
      >
        {/* Header: Royal Navy bar with Gold Highlights */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 bg-[#082A5E] text-white border-b border-[#D4AF37]/40 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Shirt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>NEW CUSTOMER ORDER</span>
                <span className="hidden sm:inline text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#D4AF37] text-[#082A5E]">
                  Infinity Customizations
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-300">Round Neck & Collar styles, fabrics, separate costs & ID cards</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BackButton onClick={onClose} label="Back" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20" />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body - Pure White Background */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto max-h-[78vh] bg-white">
          
          {/* SECTION 1: Product Mode Switcher */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-[#0B3A82] uppercase tracking-wider">Product Category</p>
                {isSharedOrder ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    🤝 Shared (50/50 Partner Split)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    🔒 Sole Product (100% Jashwanth)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isSharedOrder
                  ? 'T-Shirts, ID Cards & Caps profits are shared 50/50 with Rajshekar Reddy'
                  : 'Bouquets, Frames, Mugs & Gifts profits are 100% retained by Jashwanth Reddy'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setProductType('tshirt')}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                  productType === 'tshirt'
                    ? 'bg-[#0B3A82] text-white shadow-sm border border-[#0B3A82]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Shirt className="w-4 h-4 text-[#D4AF37]" />
                <span>Custom Printed T-Shirts</span>
              </button>
              <button
                type="button"
                onClick={() => setProductType('other')}
                className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold transition-all ${
                  productType === 'other'
                    ? 'bg-[#0B3A82] text-white shadow-sm border border-[#0B3A82]'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4 text-[#D4AF37]" />
                <span>+ Other Products</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Customer Details */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B3A82] mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Customer Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="Enter phone number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order Date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0B3A82] focus:ring-1 focus:ring-[#0B3A82]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: T-SHIRT CUSTOMIZATION (MULTI-VARIANT BUILDER) */}
          {productType === 'tshirt' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#0B3A82] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-white flex items-center justify-center text-[10px]">2</span>
                  <span>T-Shirt Styles, Fabrics & Sizing Matrix</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-[#0B3A82] text-white font-bold text-xs shadow-xs">
                  Total Shirts: {effectiveTshirtQty} pcs ({variants.length} style{variants.length > 1 ? 's' : ''})
                </span>
              </div>

              {/* Variants List */}
              <div className="space-y-4">
                {variants.map((v, index) => {
                  const variantQty = (v.sizes.S || 0) + (v.sizes.M || 0) + (v.sizes.L || 0) + (v.sizes.XL || 0) + (v.sizes.XXL || 0);
                  const effectiveQty = variantQty > 0 ? variantQty : (variants.length === 1 ? 1 : 0);
                  const subtotalBlank = effectiveQty * (v.unitBlankCost || 0);
                  const subtotalSelling = effectiveQty * (v.unitSellingPrice || 0);

                  return (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl bg-white border-2 border-blue-100/90 shadow-xs space-y-3.5 relative hover:border-[#0B3A82]/50 transition-colors"
                    >
                      {/* Variant Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#0B3A82] text-[#D4AF37] flex items-center justify-center font-black text-xs">
                            #{index + 1}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {v.neckType} · {v.fabric} ({v.color})
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0B3A82] font-bold text-[10px]">
                            {effectiveQty} pcs
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Subtotal: <strong className="text-slate-900">₹{subtotalSelling}</strong> (Blank: ₹{subtotalBlank})
                          </span>
                          <button
                            type="button"
                            onClick={() => duplicateVariant(v.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#0B3A82] hover:bg-slate-100 transition-colors"
                            title="Duplicate this style"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(v.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-red-50 transition-colors"
                              title="Remove style"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Neck Style & Fabric Pill Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Neck Style
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {(['Round Neck', 'Collar'] as NeckType[]).map(neck => (
                              <button
                                key={neck}
                                type="button"
                                onClick={() => updateVariant(v.id, { neckType: neck })}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                  v.neckType === neck
                                    ? 'bg-[#0B3A82] text-white border-[#0B3A82] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {neck}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Fabric Quality
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {(['Pure Cotton', 'Cotton', 'Poly Cotton', 'Nano Curve'] as FabricType[]).map(fab => (
                              <button
                                key={fab}
                                type="button"
                                onClick={() => updateVariant(v.id, { fabric: fab })}
                                className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all border text-center ${
                                  v.fabric === fab
                                    ? 'bg-[#082A5E] text-[#F5E7B2] border-[#082A5E] shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {fab}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Color & Size Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            T-Shirt Color
                          </label>
                          <select
                            value={v.color}
                            onChange={(e) => updateVariant(v.id, { color: e.target.value })}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                          >
                            {TSHIRT_COLORS.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sizing Matrix: S, M, L, XL, XXL */}
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                            Size Breakdown (S, M, L, XL, XXL)
                          </label>
                          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                            {(['S', 'M', 'L', 'XL', 'XXL'] as const).map(sizeKey => (
                              <div key={sizeKey} className="p-1 sm:p-2 rounded-xl border border-slate-200 bg-slate-50 text-center">
                                <span className="block text-[10px] font-bold text-[#0B3A82] mb-0.5">
                                  {sizeKey}
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={v.sizes[sizeKey] || ''}
                                  onChange={(e) => handleVariantSizeChange(v.id, sizeKey, e.target.value)}
                                  className="w-full py-1 text-center font-black text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Separate Blank Cost & Customer Selling Price for this variant */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Blank Cost / Shirt (₹)
                            <span className="text-[10px] text-slate-400 font-normal ml-1">Wholesale procurement</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={v.unitBlankCost}
                              onChange={(e) => updateVariant(v.id, { unitBlankCost: Number(e.target.value) || 0 })}
                              className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Subtotal Blank Cost: <strong>₹{subtotalBlank}</strong>
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Selling Price / Shirt (₹)
                            <span className="text-[10px] text-slate-400 font-normal ml-1">Billed to customer</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-xs font-bold text-[#0B3A82]">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={v.unitSellingPrice}
                              onChange={(e) => updateVariant(v.id, { unitSellingPrice: Number(e.target.value) || 0 })}
                              className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">
                            Subtotal Customer Price: <strong>₹{subtotalSelling}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Button: + Add Another T-Shirt Style / Color */}
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full py-2.5 px-4 rounded-2xl border-2 border-dashed border-[#0B3A82]/40 hover:border-[#0B3A82] bg-blue-50/30 hover:bg-blue-50 text-[#0B3A82] font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4 text-[#D4AF37]" />
                  <span>+ Add Another T-Shirt Style / Color (Different Neck, Fabric, or Cost)</span>
                </button>
              </div>

              {/* Print Placements */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Print Placements</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={frontPrint}
                      onChange={(e) => setFrontPrint(e.target.checked)}
                      className="rounded text-[#0B3A82] focus:ring-0"
                    />
                    <span>Front Print</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={backPrint}
                      onChange={(e) => setBackPrint(e.target.checked)}
                      className="rounded text-[#0B3A82] focus:ring-0"
                    />
                    <span>Back Print</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={sleevePrint}
                      onChange={(e) => setSleevePrint(e.target.checked)}
                      className="rounded text-[#0B3A82] focus:ring-0"
                    />
                    <span>Sleeve Print</span>
                  </label>
                </div>
              </div>

              {/* ID CARDS ADD-ON SECTION */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/70 via-white to-blue-50/50 border-2 border-amber-300/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasIdCards}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setHasIdCards(checked);
                        if (checked && idCardQuantity <= 1) {
                          setIdCardQuantity(effectiveTshirtQty);
                        }
                      }}
                      className="w-4 h-4 rounded text-[#0B3A82] focus:ring-0 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black uppercase text-[#082A5E] flex items-center gap-1.5">
                        <span>Include ID Cards Along with T-Shirts</span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#D4AF37] text-[#082A5E]">
                          Add-On
                        </span>
                      </span>
                      <p className="text-[11px] text-slate-500">For corporate staff, college fests & events</p>
                    </div>
                  </label>

                  {hasIdCards && (
                    <span className="text-xs font-bold text-[#082A5E] bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-300 font-mono">
                      ₹{idCardTotalPrice} (Profit: ₹{idCardTotalPrice - idCardTotalCost})
                    </span>
                  )}
                </div>

                {hasIdCards && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-amber-200">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">ID Card Type</label>
                      <select
                        value={idCardType}
                        onChange={(e) => setIdCardType(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                      >
                        {ID_CARD_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-bold text-slate-700">Quantity</label>
                        <button
                          type="button"
                          onClick={syncIdCardWithTshirts}
                          className="text-[9px] font-bold text-[#0B3A82] hover:underline"
                        >
                          Match Shirts ({effectiveTshirtQty})
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={idCardQuantity}
                        onChange={(e) => setIdCardQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Cost / Card (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={idCardUnitCost}
                          onChange={(e) => setIdCardUnitCost(Number(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Total Cost: ₹{idCardTotalCost}</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Selling / Card (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-[#0B3A82]">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={idCardUnitSelling}
                          onChange={(e) => setIdCardUnitSelling(Number(e.target.value) || 0)}
                          className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Total Selling: ₹{idCardTotalPrice}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* OTHER MERCHANDISE FORM */
            <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Package className="w-4 h-4 text-[#0B3A82]" />
                <span className="text-xs font-black uppercase text-[#0B3A82]">Other Customized Product Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select / Enter Product Name</label>
                  <select
                    value={otherProductName}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setOtherProductName(sel);
                      const prod = OTHER_PRODUCTS.find(p => p.name === sel);
                      if (prod) {
                        setOtherUnitCost(prod.defaultCost);
                        setOtherUnitSelling(prod.defaultSelling);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  >
                    {OTHER_PRODUCTS.map(p => (
                      <option key={p.name} value={p.name}>{p.name} (Selling: ₹{p.defaultSelling})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={otherQuantity}
                    onChange={(e) => setOtherQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Material Cost / Unit (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={otherUnitCost}
                    onChange={(e) => setOtherUnitCost(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: PRINT IN METERS */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-black uppercase text-slate-900">Printing Cost by Meters (1 Meter = ₹300)</span>
              </div>
              <span className="text-xs font-bold text-[#082A5E] bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 font-mono">
                {printMeters} m × ₹{printRatePerMeter} = ₹{computedPrintingCost}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Print Meters Used (e.g. 1, 2, 2.5 meters)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={printMeters}
                    onChange={(e) => setPrintMeters(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">meters</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Rate Per Meter (₹) (Default ₹300)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={printRatePerMeter}
                    onChange={(e) => setPrintRatePerMeter(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: SEPARATE RAPIDO & DELIVERY EXPENSES */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <Truck className="w-4 h-4 text-[#0B3A82]" />
              <span className="text-xs font-black uppercase text-[#0B3A82]">
                Logistics, Delivery & Rapido Breakdown
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  T-Shirt Rapido (₹)
                  <span className="text-[10px] font-normal text-slate-500 block">Blank procurement</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={tshirtRapidoCost}
                    onChange={(e) => setTshirtRapidoCost(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Print Rapido (₹)
                  <span className="text-[10px] font-normal text-slate-500 block">Printer drop & pickup</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={printRapidoCost}
                    onChange={(e) => setPrintRapidoCost(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Customer Delivery (₹)
                  <span className="text-[10px] font-normal text-slate-500 block">Dispatch / Rapido</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Other Cost (₹)
                  <span className="text-[10px] font-normal text-slate-500 block">Packaging, tags, gifts</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={otherCost}
                    onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: PRICING (CUSTOMER TOTAL BILLING) */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#0B3A82]/30 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0B3A82] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-white flex items-center justify-center text-[10px]">4</span>
              <span>Customer Pricing & Selling Price</span>
            </h3>

            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1">
                Customer Total Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-[#0B3A82]">₹</span>
                <input
                  type="number"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) => {
                    setSellingPrice(Number(e.target.value) || 0);
                    setCustomPriceManual(true);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#0B3A82]"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Total invoice amount billed to customer</span>
            </div>
          </div>

          {/* SECTION 5: PAYMENT (ADVANCE & PENDING BALANCE) */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">5</span>
              <span>Customer Payment (Advance Received & Pending)</span>
            </h3>

            <div>
              <label className="block text-xs font-extrabold text-emerald-800 mb-1">
                Advance Payment Received (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-emerald-600">₹</span>
                <input
                  type="number"
                  min="0"
                  value={paymentReceived}
                  onChange={(e) => setPaymentReceived(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-xl border-2 border-emerald-300 bg-white text-emerald-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <span className="text-[10px] text-emerald-700 mt-1 block font-semibold">
                {paymentPending === 0 ? '✓ Customer has Paid in Full (₹' + sellingPrice + ')' : `Pending Balance from Customer: ₹${paymentPending}`}
              </span>
            </div>
          </div>

          {/* SECTION 6: PROFIT SUMMARY & LIVE METRICS BAR */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-wider text-[#0B3A82] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0B3A82] text-white flex items-center justify-center text-[10px]">6</span>
                <span>Live Order Profit & Financial Summary</span>
              </p>
              <span className="text-[10px] font-bold text-[#B89327] bg-amber-50 border border-[#D4AF37]/50 px-2 py-0.5 rounded-full">
                Real-Time Calculation Engine
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Total</span>
                <span className="text-sm font-black text-slate-900">₹{sellingPrice.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cost</span>
                <span className="text-sm font-black text-rose-600">₹{totalCost.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-400 block">
                  Blanks ₹{computedProductCost} {hasIdCards ? `+ Cards ₹${idCardTotalCost}` : ''}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Advance Received</span>
                <span className="text-sm font-black text-emerald-600">₹{paymentReceived.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border-2 border-[#D4AF37]/50 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#B89327] block">Net Profit</span>
                <span className="text-sm font-black text-[#0B3A82]">₹{profit.toLocaleString('en-IN')}</span>
                <span className="text-[9px] font-bold text-[#B89327] block">{profitMargin}% margin</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#082A5E] text-white text-center shadow-xs border border-[#D4AF37]/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-bold text-[#F5E7B2] block">Available Cash</span>
                <span className="text-sm font-black text-white">₹{availableAmount.toLocaleString('en-IN')}</span>
                <span className="text-[9px] text-slate-300 block">Advance - Total Cost</span>
              </div>
            </div>

            {/* Partner Profit Split Breakdown Bar */}
            <div className="pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-[#0B3A82]">Partnership Allocation:</span>
                {isSharedOrder ? (
                  <span className="text-[11px] font-medium text-slate-600">
                    50/50 Shared ({productType === 'tshirt' ? 'T-Shirts' : otherProductName}{hasIdCards ? ' + ID Cards' : ''})
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-amber-800">
                    100% Sole Owner ({otherProductName} — 0% Partner Deduction)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Jashwanth:</span>
                  <span className="font-black text-[#0B3A82]">₹{jashwanthOrderShare.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-400">({partnerAlloc.jashwanthPercentage}%)</span>
                </div>
                <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Rajshekar:</span>
                  <span className={`font-black ${rajshekarOrderShare > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                    ₹{rajshekarOrderShare.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400">({partnerAlloc.rajshekarPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes / Custom Instructions</label>
            <textarea
              rows={2}
              placeholder="Enter order notes / custom instructions"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0B3A82]"
            />
          </div>

          {/* Submit Action Buttons: Sticky Bottom Bar */}
          <div className="sticky bottom-0 -mx-3.5 sm:-mx-6 -mb-3.5 sm:-mb-6 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-end gap-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 text-xs font-bold rounded-xl bg-[#0B3A82] hover:bg-[#082A5E] text-white shadow-md shadow-blue-900/20 border border-[#D4AF37]/50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#D4AF37]" />
              <span>{isSubmitting ? 'Creating Order...' : `Create Order (₹${sellingPrice})`}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
