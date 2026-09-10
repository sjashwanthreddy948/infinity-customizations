// client/src/services/apiClient.ts
// Universal API Client with automatic Vercel static fallback and persistent demo database
import { calculateOrderPartnerShare } from '../utils/partnerShare';
import { calculateOrderFinancials } from '../utils/financialCalculations';

interface MockCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_code: string;
  total_orders: number;
  total_spent: number;
  total_paid: number;
  outstanding_balance: number;
  total_profit_generated: number;
  status: string;
  created_at: string;
}

interface MockOrder {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  product_cost: number;
  printing_cost: number;
  tshirt_rapido_cost: number;
  print_rapido_cost: number;
  delivery_cost: number;
  other_cost: number;
  total_cost: number;
  profit: number;
  profit_margin: number;
  payment_status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING';
  payment_received: number;
  payment_pending?: number;
  available_amount: number;
  is_tshirt: number;
  is_partner_shared?: number;
  tshirt_neck_type?: string;
  tshirt_fabric?: string;
  tshirt_size?: string;
  tshirt_size_breakdown?: string;
  tshirt_color?: string;
  tshirt_print_type?: string;
  tshirt_front_print?: boolean;
  tshirt_back_print?: boolean;
  tshirt_sleeve_print?: boolean;
  tshirt_variants?: any;
  print_meters?: number;
  print_rate_per_meter?: number;
  has_id_cards?: number;
  id_card_quantity?: number;
  id_card_unit_price?: number;
  id_card_unit_cost?: number;
  id_card_selling_price?: number;
  id_card_cost?: number;
  id_card_profit?: number;
  id_card_total_cost?: number;
  id_card_total_price?: number;
  id_card_type?: string;
  order_date: string;
  created_at?: string;
  created_by_name: string;
  created_by: string;
  invoice_id?: string | null;
  invoice_number?: string | null;
  notes?: string;
  partner_share_allocation?: any;
}

interface MockInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount?: number;
  tax_rate: number;
  tax_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  status: 'PAID' | 'PARTIAL' | 'SENT' | 'OVERDUE' | 'VOID';
  created_by_name: string;
  created_by: string;
  items: any[];
}

interface MockExpense {
  id: string;
  expense_number: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  created_by_name: string;
  notes?: string;
}

interface MockPayment {
  id: string;
  payment_number: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  order_id?: string;
  amount: number;
  method: string;
  date: string;
  reference_number?: string;
  notes?: string;
  status: 'COMPLETED' | 'VOID' | 'REVERSED';
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

interface MockQuotation {
  id: string;
  quotation_number: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  items: Array<{
    id?: string;
    description: string;
    quantity: number;
    rate: number;
    discount?: number;
    tax_rate?: number;
    amount: number;
  }>;
  subtotal: number;
  discount?: number;
  tax_rate?: number;
  tax_amount?: number;
  grand_total: number;
  valid_until: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CONVERTED';
  notes?: string;
  terms?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  converted_order_id?: string;
  converted_invoice_id?: string;
}

const PARTNER_1 = {
  id: 'usr-jashwanth-1',
  email: 'jashwanth@infinitycustomizations.com',
  full_name: 'Jashwanth Reddy',
  phone: '+91 98765 00001',
  role: 'OWNER',
  status: 'ACTIVE',
  business_id: 'biz-infinity-1',
  business_name: 'Infinity Customizations',
  business_type: 'Partnership',
  currency: 'INR',
  currency_symbol: '₹',
  gstin: '36AAACI1234F1Z5',
  partner_percentage: 50
};

const PARTNER_2 = {
  id: 'usr-rajshekar-2',
  email: 'rajshekar@infinitycustomizations.com',
  full_name: 'Rajshekar Reddy',
  phone: '+91 98765 00002',
  role: 'PARTNER',
  status: 'ACTIVE',
  business_id: 'biz-infinity-1',
  business_name: 'Infinity Customizations',
  business_type: 'Partnership',
  currency: 'INR',
  currency_symbol: '₹',
  gstin: '36AAACI1234F1Z5',
  partner_percentage: 50
};

const INITIAL_CUSTOMERS: MockCustomer[] = [
  {
    id: 'cust-bvrit',
    customer_code: 'CUST-0001',
    name: 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
    phone: '+91 98490 55667',
    email: 'fests@bvrit.ac.in',
    address: 'BVRIT Campus, Bachupally / Narsapur, Hyderabad, Telangana 502313',
    total_orders: 1,
    total_spent: 45000,
    total_paid: 45000,
    outstanding_balance: 0,
    total_profit_generated: 13500,
    status: 'ACTIVE',
    created_at: '2026-09-08'
  }
];

const INITIAL_ORDERS: MockOrder[] = [
  {
    id: 'ord-bvrit-1',
    order_number: 'ORD-2026-0001',
    customer_id: 'cust-bvrit',
    customer_name: 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
    customer_phone: '+91 98490 55667',
    customer_email: 'fests@bvrit.ac.in',
    customer_address: 'BVRIT Campus, Bachupally / Narsapur, Hyderabad, Telangana 502313',
    product_name: 'Custom Printed T-Shirt',
    quantity: 100,
    selling_price: 45000,
    product_cost: 18000,
    printing_cost: 8000,
    tshirt_rapido_cost: 400,
    print_rapido_cost: 350,
    delivery_cost: 750,
    other_cost: 500,
    total_cost: 31500,
    profit: 13500,
    profit_margin: 30.0,
    payment_status: 'PAID',
    payment_received: 45000,
    payment_pending: 0,
    available_amount: 13500,
    is_tshirt: 1,
    is_partner_shared: 1,
    tshirt_neck_type: 'Collar',
    tshirt_fabric: 'Poly Cotton',
    tshirt_size: 'Custom',
    tshirt_size_breakdown: 'S: 15, M: 35, L: 35, XL: 15',
    tshirt_color: 'Royal Blue',
    tshirt_print_type: 'Front & Back',
    tshirt_front_print: true,
    tshirt_back_print: true,
    print_meters: 15.0,
    print_rate_per_meter: 300,
    has_id_cards: 1,
    id_card_quantity: 100,
    id_card_unit_price: 70,
    id_card_unit_cost: 35,
    id_card_selling_price: 7000,
    id_card_cost: 3500,
    id_card_profit: 3500,
    id_card_total_cost: 3500,
    id_card_total_price: 7000,
    id_card_type: 'PVC Card + Multicolor Printed Lanyard',
    order_date: '2026-09-08',
    created_at: '2026-09-08T10:30:00.000Z',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1',
    invoice_id: 'inv-bvrit-1',
    invoice_number: 'INV-2026-0001',
    notes: 'Annual Tech Fest batch order for BVRIT with 100 T-Shirts and 100 ID Cards',
    partner_share_allocation: {
      isShared: true,
      categoryTag: 'T-Shirts & ID Cards (Shared 50/50)',
      scopeLabel: 'Equal 50/50 split with Rajshekar Reddy',
      jashwanthShare: 6750,
      rajshekarShare: 6750,
      jashwanthPercentage: 50,
      rajshekarPercentage: 50,
      explanation: 'Custom Printed T-Shirts and ID Cards net profits are shared equally 50% / 50% between Jashwanth Reddy and Rajshekar Reddy.'
    }
  }
];

const INITIAL_INVOICES: MockInvoice[] = [
  {
    id: 'inv-bvrit-1',
    invoice_number: 'INV-2026-0001',
    customer_id: 'cust-bvrit',
    customer_name: 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
    issue_date: '2026-09-08',
    due_date: '2026-09-18',
    subtotal: 45000,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 45000,
    amount_paid: 45000,
    balance_due: 0,
    status: 'PAID',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1',
    items: [
      {
        description: 'Custom College Fest Collar T-Shirts (Poly Cotton, Screen Printed Front & Back)',
        quantity: 100,
        unit_price: 380,
        rate: 380,
        discount: 0,
        tax_rate: 0,
        amount: 38000
      },
      {
        description: 'Custom Student ID Cards + Multicolor Printed Satin Lanyards',
        quantity: 100,
        unit_price: 70,
        rate: 70,
        discount: 0,
        tax_rate: 0,
        amount: 7000
      }
    ]
  }
];

const INITIAL_EXPENSES: MockExpense[] = [
  {
    id: 'exp-1',
    expense_number: 'EXP-0001',
    date: '2026-09-01',
    category: 'Rent',
    description: 'Design Studio & Workshop Space Monthly Rent',
    amount: 15000,
    payment_method: 'Bank Transfer',
    created_by_name: 'Jashwanth Reddy'
  },
  {
    id: 'exp-2',
    expense_number: 'EXP-0002',
    date: '2026-09-03',
    category: 'Materials',
    description: 'Bulk Blank Premium Cotton T-Shirts Roll & Screen Mesh',
    amount: 8500,
    payment_method: 'UPI',
    created_by_name: 'Rajshekar Reddy'
  },
  {
    id: 'exp-3',
    expense_number: 'EXP-0003',
    date: '2026-09-04',
    category: 'Packaging',
    description: 'Branded Shipping Cartons & Hologram Security Seal Bags',
    amount: 2400,
    payment_method: 'Cash',
    created_by_name: 'Jashwanth Reddy'
  }
];

const INITIAL_PAYMENTS: MockPayment[] = [
  {
    id: 'pay-bvrit-1',
    payment_number: 'PAY-2026-0001',
    customer_id: 'cust-bvrit',
    customer_name: 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
    invoice_id: 'inv-bvrit-1',
    invoice_number: 'INV-2026-0001',
    order_id: 'ord-bvrit-1',
    amount: 45000,
    method: 'UPI',
    date: '2026-09-08',
    reference_number: 'UPI/625291827361/BVRIT',
    notes: 'Full advance payment for 100 T-Shirts and 100 ID Cards via UPI QR',
    status: 'COMPLETED',
    recorded_by: 'usr-jashwanth-1',
    recorded_by_name: 'Jashwanth Reddy',
    created_at: '2026-09-08T11:00:00.000Z'
  }
];

const INITIAL_QUOTATIONS: MockQuotation[] = [
  {
    id: 'qt-bvrit-1',
    quotation_number: 'QT-2026-0001',
    customer_id: 'cust-bvrit',
    customer_name: 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
    customer_phone: '+91 98490 55667',
    customer_email: 'fests@bvrit.ac.in',
    customer_address: 'BVRIT Campus, Bachupally, Hyderabad, Telangana 502313',
    items: [
      {
        id: 'qti-1',
        description: 'Round Neck 100% Pure Cotton T-Shirts with Dual Side HD DTF Print',
        quantity: 100,
        rate: 350,
        discount: 0,
        tax_rate: 0,
        amount: 35000
      },
      {
        id: 'qti-2',
        description: 'Custom Satin Lanyards + 350 GSM Double-Side Printed ID Cards',
        quantity: 100,
        rate: 100,
        discount: 0,
        tax_rate: 0,
        amount: 10000
      }
    ],
    subtotal: 45000,
    discount: 0,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 45000,
    valid_until: '2026-03-31',
    status: 'SENT',
    notes: 'Price includes fabric, premium printing, finishing, and door-step delivery in Hyderabad. Payment Terms: 50% advance upon confirmation, balance 50% upon delivery.',
    terms: 'Valid for 15 days from issue date. Delivery timeline: 5-7 business days upon sample approval.',
    created_by: 'usr-jashwanth-1',
    created_by_name: 'Jashwanth Reddy',
    created_at: '2026-09-07T10:00:00.000Z'
  }
];

class MockDatabase {
  customers: MockCustomer[] = [];
  orders: MockOrder[] = [];
  invoices: MockInvoice[] = [];
  expenses: MockExpense[] = [];
  payments: MockPayment[] = [];
  quotations: MockQuotation[] = [];
  currentUser: any = PARTNER_1;

  constructor() {
    this.load();
  }

  load() {
    const DB_KEY = 'infinity_mock_db_v4';
    try {
      localStorage.removeItem('infinity_mock_db_v1');
      localStorage.removeItem('infinity_mock_db_v2');

      const isBvrit = (item: any) => {
        const text = `${item?.customer_name || ''} ${item?.name || ''} ${item?.invoice_number || ''} ${item?.order_number || ''} ${item?.notes || ''} ${item?.description || ''} ${JSON.stringify(item?.items || [])}`.toLowerCase();
        return text.includes('bvrit');
      };

      const storedV3 = localStorage.getItem('infinity_mock_db_v3');
      const storedV4 = localStorage.getItem(DB_KEY);
      const rawStored = storedV4 || storedV3;

      if (rawStored) {
        const parsed = JSON.parse(rawStored);
        
        // Remove ALL invoices except BVRIT!
        const existingBvritInvoices = (parsed.invoices || []).filter(isBvrit);
        this.invoices = existingBvritInvoices.length > 0 ? existingBvritInvoices : [...INITIAL_INVOICES];

        // Format orders and ensure accurate calculations
        const storedOrders = (parsed.orders || []).filter((o: any) => isBvrit(o) || o.id === 'ord-bvrit-1');
        this.orders = (storedOrders.length > 0 ? storedOrders : INITIAL_ORDERS).map((o: any) => {
          const fin = calculateOrderFinancials({
            sellingPrice: Number(o.selling_price) || 0,
            productCost: Number(o.product_cost) || 0,
            printingCost: Number(o.printing_cost) || 0,
            tshirtRapidoCost: Number(o.tshirt_rapido_cost) || 0,
            printRapidoCost: Number(o.print_rapido_cost) || 0,
            deliveryCost: Number(o.delivery_cost) || 0,
            otherCost: Number(o.other_cost) || 0,
            paymentReceived: Number(o.payment_received) || 0
          });
          return {
            ...o,
            total_cost: fin.totalCost,
            profit: fin.profit,
            profit_margin: fin.profitMargin,
            payment_pending: fin.paymentPending,
            available_amount: fin.availableAmount,
            payment_status: fin.paymentStatus === 'PAID' ? 'PAID' : (fin.paymentReceived > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
            created_at: o.created_at || (o.order_date ? `${o.order_date}T12:00:00.000Z` : new Date().toISOString())
          };
        });

        const storedCustomers = (parsed.customers || []).filter((c: any) => isBvrit(c) || c.id === 'cust-bvrit');
        this.customers = storedCustomers.length > 0 ? storedCustomers : [...INITIAL_CUSTOMERS];
        this.expenses = parsed.expenses || INITIAL_EXPENSES;
        this.payments = (parsed.payments && parsed.payments.length > 0) ? parsed.payments.filter((p: any) => isBvrit(p) || p.id === 'pay-bvrit-1') : [...INITIAL_PAYMENTS];
        this.quotations = (parsed.quotations && parsed.quotations.length > 0) ? parsed.quotations : [...INITIAL_QUOTATIONS];

        localStorage.removeItem('infinity_mock_db_v3');
        this.save();
        return;
      }
    } catch {
      // ignore
    }
    this.customers = [...INITIAL_CUSTOMERS];
    this.orders = INITIAL_ORDERS.map(o => ({ ...o }));
    this.invoices = [...INITIAL_INVOICES];
    this.expenses = INITIAL_EXPENSES.map(e => ({ ...e }));
    this.payments = [...INITIAL_PAYMENTS];
    this.quotations = [...INITIAL_QUOTATIONS];
    this.save();
  }

  save() {
    try {
      localStorage.setItem('infinity_mock_db_v4', JSON.stringify({
        customers: this.customers,
        orders: this.orders,
        invoices: this.invoices,
        expenses: this.expenses,
        payments: this.payments,
        quotations: this.quotations
      }));
    } catch {
      // ignore
    }
  }

  reset() {
    this.customers = [...INITIAL_CUSTOMERS];
    this.orders = INITIAL_ORDERS.map(o => ({ ...o }));
    this.invoices = [...INITIAL_INVOICES];
    this.expenses = INITIAL_EXPENSES.map(e => ({ ...e }));
    this.payments = [...INITIAL_PAYMENTS];
    this.quotations = [...INITIAL_QUOTATIONS];
    this.save();
  }
}

export const mockDb = new MockDatabase();

// Centralized Router for Mock API
export async function handleMockApi(path: string, options?: RequestInit): Promise<Response> {
  const method = (options?.method || 'GET').toUpperCase();
  const urlObj = new URL(path, window.location.origin);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  let body: any = {};
  if (options?.body) {
    try {
      body = JSON.parse(options.body as string);
    } catch {
      // ignore
    }
  }

  const jsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  // 1. Auth Login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const email = (body.email || '').toLowerCase().trim();
    let selectedUser = PARTNER_1;
    if (email.includes('rajshekar') || email.includes('alex') || email.includes('partner2')) {
      selectedUser = PARTNER_2;
    }

    const token = `demo-jwt-${selectedUser.id}-${Date.now()}`;
    mockDb.currentUser = selectedUser;
    return jsonResponse({
      token,
      user: selectedUser,
      partners: [PARTNER_1, PARTNER_2]
    });
  }

  // 2. Auth Profile
  if (pathname === '/api/auth/me') {
    const token = localStorage.getItem('partnerledger_token') || '';
    let selectedUser = PARTNER_1;
    if (token.includes('rajshekar') || mockDb.currentUser?.id === PARTNER_2.id) {
      selectedUser = PARTNER_2;
    }
    return jsonResponse({
      user: selectedUser,
      partners: [PARTNER_1, PARTNER_2]
    });
  }

  // 3. Demo Switch
  if (pathname === '/api/auth/demo-switch' && method === 'POST') {
    const partner = body.partner === 2 || String(body.partner).includes('2') || String(body.partner).includes('raj') ? 2 : 1;
    const selectedUser = partner === 2 ? PARTNER_2 : PARTNER_1;
    mockDb.currentUser = selectedUser;
    const token = `demo-jwt-${selectedUser.id}-${Date.now()}`;
    return jsonResponse({
      token,
      user: selectedUser
    });
  }

  // 4. Forgot Password
  if (pathname === '/api/auth/forgot-password') {
    return jsonResponse({ message: 'Reset link sent successfully.' });
  }

  // 5. Dashboard Stats
  if (pathname === '/api/dashboard/stats') {
    const range = searchParams.get('range') || 'all';
    const now = new Date();
    let orders = [...mockDb.orders];
    let expenses = [...mockDb.expenses];

    if (range === 'today') {
      const today = now.toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '').startsWith(today));
      expenses = expenses.filter(e => (e.date || '').startsWith(today));
    } else if (range === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= weekAgo);
      expenses = expenses.filter(e => (e.date || '') >= weekAgo);
    } else if (range === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= monthAgo);
      expenses = expenses.filter(e => (e.date || '') >= monthAgo);
    } else if (range === 'year') {
      const yearStart = `${now.getFullYear()}-01-01`;
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= yearStart);
      expenses = expenses.filter(e => (e.date || '') >= yearStart);
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.selling_price) || 0), 0);
    const totalCost = orders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const totalPaymentReceived = orders.reduce((sum, o) => sum + (Number(o.payment_received) || 0), 0);
    const pendingPayments = orders.reduce((sum, o) => sum + (Number(o.payment_pending) || 0), 0);
    const availableAmount = totalPaymentReceived - totalCost;
    const generalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;

    // T-shirt metrics
    const tOrders = orders.filter(o => o.is_tshirt === 1);
    const tshirtRevenue = tOrders.reduce((sum, o) => sum + (Number(o.selling_price) || 0), 0);
    const tshirtProductCost = tOrders.reduce((sum, o) => sum + (Number(o.product_cost) || 0), 0);
    const tshirtPrintingCost = tOrders.reduce((sum, o) => sum + (Number(o.printing_cost) || 0), 0);
    const tshirtDeliveryCost = tOrders.reduce((sum, o) => sum + (Number(o.delivery_cost) || 0), 0);
    const tshirtTotalCost = tOrders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
    const tshirtProfit = tshirtRevenue - tshirtTotalCost;
    const tshirtsSold = tOrders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

    // Partner rules: Rajshekar has share in T-Shirts, ID Cards, Caps (is_partner_shared === 1)
    const sharedOrders = orders.filter(o => o.is_partner_shared === 1 || o.is_tshirt === 1 || (o.product_name && o.product_name.includes('Cap')) || o.has_id_cards === 1);
    const soleOrders = orders.filter(o => !sharedOrders.includes(o));

    const sharedRevenue = sharedOrders.reduce((sum, o) => sum + (Number(o.selling_price) || 0), 0);
    const sharedCost = sharedOrders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
    const sharedProfit = sharedOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

    const soleRevenue = soleOrders.reduce((sum, o) => sum + (Number(o.selling_price) || 0), 0);
    const soleCost = soleOrders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
    const soleProfit = soleOrders.reduce((sum, o) => sum + (Number(o.profit) || 0), 0);

    const jashwanthSharedPortion = Math.round(sharedProfit * 0.5);
    const rajshekarSharedPortion = sharedProfit - jashwanthSharedPortion;
    const jashwanthTotalProfit = jashwanthSharedPortion + soleProfit;
    const rajshekarTotalProfit = rajshekarSharedPortion;

    // Daily chart trend
    const dateMap: Record<string, { date: string; revenue: number; cost: number; profit: number }> = {};
    orders.forEach(o => {
      const d = o.order_date || (o.created_at ? o.created_at.split('T')[0] : '2026-09-08');
      if (!dateMap[d]) {
        dateMap[d] = { date: d, revenue: 0, cost: 0, profit: 0 };
      }
      dateMap[d].revenue += (Number(o.selling_price) || 0);
      dateMap[d].cost += (Number(o.total_cost) || 0);
      dateMap[d].profit += (Number(o.profit) || 0);
    });
    const chartTrend = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // Product breakdown
    const prodMap: Record<string, { product_name: string; quantity_sold: number; revenue: number; cost: number; profit: number; is_partner_shared: number }> = {};
    orders.forEach(o => {
      const p = o.product_name || 'Custom Product';
      if (!prodMap[p]) {
        prodMap[p] = { product_name: p, quantity_sold: 0, revenue: 0, cost: 0, profit: 0, is_partner_shared: o.is_partner_shared || 0 };
      }
      prodMap[p].quantity_sold += (Number(o.quantity) || 0);
      prodMap[p].revenue += (Number(o.selling_price) || 0);
      prodMap[p].cost += (Number(o.total_cost) || 0);
      prodMap[p].profit += (Number(o.profit) || 0);
    });
    const productBreakdown = Object.values(prodMap);

    const recentOrders = orders.slice(0, 8).map(o => ({
      ...o,
      partner_share_allocation: calculateOrderPartnerShare(o)
    }));

    return jsonResponse({
      businessName: 'Infinity Customizations',
      currencySymbol: '₹',
      cards: {
        totalRevenue,
        totalCost,
        totalProfit,
        availableAmount,
        totalOrders,
        pendingPayments,
        generalExpenses
      },
      partnerShares: {
        agreementRule: 'Partner (Rajshekar Reddy) has 50% profit share in T-Shirts, ID Cards & Caps only. Bouquets, Frames, Mugs & Gifts are 100% retained by Jashwanth Reddy.',
        sharedOrdersCount: sharedOrders.length,
        sharedRevenue,
        sharedCost,
        sharedProfit,
        soleOrdersCount: soleOrders.length,
        soleRevenue,
        soleCost,
        soleProfit,
        jashwanth: {
          name: 'Jashwanth Reddy',
          role: 'Owner & Partner',
          sharedProfit: jashwanthSharedPortion,
          soleProfit,
          totalProfit: jashwanthTotalProfit,
          sharePercentage: totalProfit > 0 ? Math.round((jashwanthTotalProfit / totalProfit) * 100) : 100
        },
        rajshekar: {
          name: 'Rajshekar Reddy',
          role: 'Partner (T-Shirts, ID Cards & Caps)',
          sharedProfit: rajshekarSharedPortion,
          soleProfit: 0,
          totalProfit: rajshekarTotalProfit,
          sharePercentage: totalProfit > 0 ? Math.round((rajshekarTotalProfit / totalProfit) * 100) : 0
        }
      },
      tshirtOverview: {
        tshirtRevenue,
        tshirtProductCost,
        tshirtPrintingCost,
        tshirtDeliveryCost,
        tshirtTotalCost,
        tshirtProfit,
        tshirtsSold,
        tshirtOrders: tOrders.length
      },
      chartTrend,
      productBreakdown,
      recentOrders,
      // Flat properties for backward compatibility
      revenue: totalRevenue,
      totalCosts: totalCost,
      netProfit: totalProfit,
      totalAvailable: availableAmount,
      profitMargin,
      margin: profitMargin,
      partnerAllocations: {
        jashwanth: { totalProfit: jashwanthTotalProfit, sharedProfit: jashwanthSharedPortion, soleProfit },
        rajshekar: { totalProfit: rajshekarTotalProfit, sharedProfit: rajshekarTotalProfit, soleProfit: 0 }
      },
      partner1Share: jashwanthTotalProfit,
      partner2Share: rajshekarTotalProfit,
      tshirtAnalytics: {
        totalSold: tshirtsSold,
        revenue: tshirtRevenue,
        profit: tshirtProfit
      }
    });
  }

  // 6. Orders
  if (pathname === '/api/orders') {
    if (method === 'POST') {
      const isTshirt = body.is_tshirt === 1 || (body.product_name && body.product_name.toLowerCase().includes('t-shirt'));
      const isPartnerShared = isTshirt || (body.product_name && (body.product_name.includes('Cap') || body.product_name.includes('ID Card'))) || body.has_id_cards === 1;

      const selling = Number(body.selling_price || 0);
      const prodCost = Number(body.product_cost || 0);
      const printCost = Number(body.printing_cost || 0);
      const tshirtRapido = Number(body.tshirt_rapido_cost || 0);
      const printRapido = Number(body.print_rapido_cost || 0);
      const delCost = Number(body.delivery_cost || (tshirtRapido + printRapido) || 0);
      const otherCost = Number(body.other_cost || 0);
      const received = body.payment_status === 'PAID' ? selling : Number(body.payment_received || 0);

      const fin = calculateOrderFinancials({
        sellingPrice: selling,
        productCost: prodCost,
        printingCost: printCost,
        tshirtRapidoCost: tshirtRapido,
        printRapidoCost: printRapido,
        deliveryCost: delCost,
        otherCost: otherCost,
        paymentReceived: received
      });

      const customerId = body.customer_id || 'cust-bvrit';
      const customer = mockDb.customers.find(c => c.id === customerId);

      const newOrder: MockOrder = {
        id: `ord-${Date.now()}`,
        order_number: `ORD-2026-${String(mockDb.orders.length + 1).padStart(4, '0')}`,
        customer_id: customerId,
        customer_name: body.customer_name || customer?.name || 'Customer',
        customer_phone: body.customer_phone || customer?.phone || '+91 98000 00000',
        customer_email: customer?.email || '',
        customer_address: customer?.address || '',
        product_name: body.product_name || 'Custom Printed T-Shirt',
        quantity: Number(body.quantity || 1),
        selling_price: fin.sellingPrice,
        product_cost: fin.productCost,
        printing_cost: fin.printingCost,
        tshirt_rapido_cost: fin.tshirtRapidoCost,
        print_rapido_cost: fin.printRapidoCost,
        delivery_cost: fin.deliveryCost,
        other_cost: fin.otherCost,
        total_cost: fin.totalCost,
        profit: fin.profit,
        profit_margin: fin.profitMargin,
        payment_status: fin.paymentStatus === 'PAID' ? 'PAID' : (fin.paymentReceived > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
        payment_received: fin.paymentReceived,
        payment_pending: fin.paymentPending,
        available_amount: fin.availableAmount,
        is_tshirt: isTshirt ? 1 : 0,
        is_partner_shared: isPartnerShared ? 1 : 0,
        tshirt_neck_type: body.tshirt_neck_type || 'Round Neck',
        tshirt_fabric: body.tshirt_fabric || 'Pure Cotton',
        tshirt_size: body.tshirt_size || 'L',
        tshirt_size_breakdown: body.tshirt_size_breakdown || '',
        tshirt_color: body.tshirt_color || 'Black',
        tshirt_print_type: body.tshirt_print_type || 'Front Print',
        tshirt_front_print: Boolean(body.tshirt_front_print),
        tshirt_back_print: Boolean(body.tshirt_back_print),
        tshirt_sleeve_print: Boolean(body.tshirt_sleeve_print),
        print_meters: Number(body.print_meters || 0),
        print_rate_per_meter: Number(body.print_rate_per_meter || 300),
        has_id_cards: body.has_id_cards ? 1 : 0,
        id_card_quantity: Number(body.id_card_quantity || 0),
        id_card_unit_price: Number(body.id_card_unit_price || 70),
        id_card_unit_cost: Number(body.id_card_unit_cost || 35),
        id_card_selling_price: Number(body.id_card_selling_price || 0),
        id_card_cost: Number(body.id_card_cost || 0),
        id_card_profit: Number(body.id_card_profit || 0),
        order_date: body.order_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        notes: body.notes || ''
      };

      newOrder.partner_share_allocation = calculateOrderPartnerShare(newOrder);
      mockDb.orders.unshift(newOrder);

      // Create linked invoice automatically
      const newInvoice: MockInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-2026-${String(mockDb.invoices.length + 1).padStart(4, '0')}`,
        customer_id: newOrder.customer_id,
        customer_name: newOrder.customer_name,
        issue_date: newOrder.order_date,
        due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        subtotal: fin.sellingPrice,
        tax_rate: 0,
        tax_amount: 0,
        grand_total: fin.sellingPrice,
        amount_paid: fin.paymentReceived,
        balance_due: fin.paymentPending,
        status: fin.paymentStatus === 'PAID' ? 'PAID' : (fin.paymentReceived > 0 ? 'PARTIAL' : 'SENT'),
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        items: [
          {
            description: `${newOrder.product_name} (${newOrder.tshirt_neck_type || ''} ${newOrder.tshirt_fabric || ''})`.trim(),
            quantity: newOrder.quantity,
            unit_price: newOrder.quantity > 0 ? Math.round(fin.sellingPrice / newOrder.quantity) : fin.sellingPrice,
            rate: newOrder.quantity > 0 ? Math.round(fin.sellingPrice / newOrder.quantity) : fin.sellingPrice,
            amount: fin.sellingPrice
          }
        ]
      };
      newOrder.invoice_id = newInvoice.id;
      newOrder.invoice_number = newInvoice.invoice_number;
      mockDb.invoices.unshift(newInvoice);

      // Record payment in payments list if received > 0
      if (fin.paymentReceived > 0) {
        mockDb.payments.unshift({
          id: `pay-${Date.now()}`,
          payment_number: `PAY-2026-${String(mockDb.payments.length + 1).padStart(4, '0')}`,
          customer_id: newOrder.customer_id,
          customer_name: newOrder.customer_name,
          invoice_id: newInvoice.id,
          invoice_number: newInvoice.invoice_number,
          order_id: newOrder.id,
          amount: fin.paymentReceived,
          method: 'UPI',
          date: newOrder.order_date,
          reference_number: `UPI/${Date.now().toString().slice(-8)}/ADV`,
          notes: 'Advance / payment on order booking',
          status: 'COMPLETED',
          recorded_by: mockDb.currentUser.id,
          recorded_by_name: mockDb.currentUser.full_name,
          created_at: new Date().toISOString()
        });
      }

      mockDb.save();
      return jsonResponse({ ...newOrder, invoice_id: newInvoice.id });
    }

    // GET /api/orders
    let filtered = [...mockDb.orders];
    const search = searchParams.get('search');
    const product = searchParams.get('product');
    const paymentStatus = searchParams.get('payment_status');

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(o =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.customer_phone.includes(q) ||
        o.product_name.toLowerCase().includes(q)
      );
    }
    if (product) {
      filtered = filtered.filter(o => o.product_name.toLowerCase().includes(product.toLowerCase()));
    }
    if (paymentStatus) {
      filtered = filtered.filter(o => o.payment_status === paymentStatus);
    }
    return jsonResponse(filtered);
  }

  // Single Order & Payments
  if (pathname.startsWith('/api/orders/')) {
    const parts = pathname.split('/');
    const orderId = parts[3];
    const isPayments = parts[4] === 'payments';

    if (method === 'DELETE') {
      const idx = mockDb.orders.findIndex(o => o.id === orderId || o.order_number === orderId);
      if (idx !== -1) {
        mockDb.orders.splice(idx, 1);
        mockDb.save();
        return jsonResponse({ success: true, message: 'Order deleted successfully' });
      }
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    let order = mockDb.orders.find(o => o.id === orderId || o.order_number === orderId);
    if (!order) {
      order = mockDb.orders[0];
    }

    if (isPayments && method === 'POST') {
      const payAmount = Number(body.amount || 0);
      if (order && payAmount > 0) {
        order.payment_received = (Number(order.payment_received) || 0) + payAmount;
        order.payment_pending = Math.max(0, (Number(order.selling_price) || 0) - order.payment_received);
        order.payment_status = order.payment_received >= (Number(order.selling_price) || 0) ? 'PAID' : 'PARTIALLY_PAID';
        order.available_amount = order.payment_received - (Number(order.total_cost) || 0);

        // Also update linked invoice if any
        const linkedInv = mockDb.invoices.find(i => i.id === order.invoice_id || i.customer_id === order.customer_id);
        if (linkedInv) {
          linkedInv.amount_paid = (Number(linkedInv.amount_paid) || 0) + payAmount;
          linkedInv.balance_due = Math.max(0, (Number(linkedInv.grand_total) || 0) - linkedInv.amount_paid);
          linkedInv.status = linkedInv.amount_paid >= (Number(linkedInv.grand_total) || 0) ? 'PAID' : 'PARTIAL';
        }

        mockDb.payments.unshift({
          id: `pay-${Date.now()}`,
          payment_number: `PAY-2026-${String(mockDb.payments.length + 1).padStart(4, '0')}`,
          customer_id: order.customer_id,
          customer_name: order.customer_name,
          invoice_id: order.invoice_id,
          invoice_number: order.invoice_number,
          order_id: order.id,
          amount: payAmount,
          method: body.method || 'UPI',
          date: body.date || new Date().toISOString().split('T')[0],
          reference_number: body.reference_number || body.referenceNumber || `REF-${Date.now()}`,
          notes: body.notes || 'Order payment collection',
          status: 'COMPLETED',
          recorded_by: mockDb.currentUser.id,
          recorded_by_name: mockDb.currentUser.full_name,
          created_at: new Date().toISOString()
        });

        mockDb.save();
      }
      return jsonResponse({ success: true, order });
    }

    if (order) {
      const customer = mockDb.customers.find(c => c.id === order.customer_id);
      const invoice = mockDb.invoices.find(i => i.id === order.invoice_id || i.customer_id === order.customer_id);
      const enrichedOrder = {
        ...order,
        customer_email: order.customer_email || customer?.email || 'customer@example.com',
        customer_address: order.customer_address || customer?.address || 'Hyderabad, Telangana',
        invoice_id: order.invoice_id || invoice?.id || null,
        invoice_number: order.invoice_number || invoice?.invoice_number || null,
        payment_pending: order.payment_pending !== undefined ? Number(order.payment_pending) : Math.max(0, (Number(order.selling_price) || 0) - (Number(order.payment_received) || 0)),
        created_at: order.created_at || (order.order_date ? `${order.order_date}T12:00:00.000Z` : new Date().toISOString())
      };
      return jsonResponse(enrichedOrder);
    }

    return jsonResponse({ error: 'Order not found' }, 404);
  }

  // 7. Invoices
  if (pathname === '/api/invoices') {
    if (method === 'POST') {
      const items = (body.items || []).map((it: any) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate || it.unit_price) || 0;
        const amt = Number(it.amount) || (qty * rate);
        return {
          description: it.description || 'Custom Item',
          quantity: qty,
          unit_price: rate,
          rate: rate,
          discount: Number(it.discount) || 0,
          tax_rate: Number(it.tax_rate) || 0,
          amount: amt
        };
      });

      const computedSubtotal = items.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
      const subtotal = Number(body.subtotal) || computedSubtotal;
      const discount = Number(body.discount) || 0;
      const taxAmount = Number(body.tax_amount) || 0;
      const grandTotal = Number(body.grand_total) || Math.max(0, subtotal - discount + taxAmount);
      const amountPaid = Number(body.amount_paid) || 0;
      const balanceDue = Math.max(0, grandTotal - amountPaid);
      const status = amountPaid >= grandTotal ? 'PAID' : (amountPaid > 0 ? 'PARTIAL' : 'SENT');

      const newInv: MockInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-2026-${String(mockDb.invoices.length + 1).padStart(4, '0')}`,
        customer_id: body.customer_id || 'cust-bvrit',
        customer_name: body.customer_name || 'Customer',
        issue_date: body.issue_date || new Date().toISOString().split('T')[0],
        due_date: body.due_date || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        subtotal,
        discount,
        tax_rate: Number(body.tax_rate) || 0,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        status,
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        items
      };
      mockDb.invoices.unshift(newInv);

      if (amountPaid > 0) {
        mockDb.payments.unshift({
          id: `pay-${Date.now()}`,
          payment_number: `PAY-2026-${String(mockDb.payments.length + 1).padStart(4, '0')}`,
          customer_id: newInv.customer_id,
          customer_name: newInv.customer_name,
          invoice_id: newInv.id,
          invoice_number: newInv.invoice_number,
          amount: amountPaid,
          method: body.payment_method || 'UPI',
          date: newInv.issue_date,
          reference_number: `UPI/${Date.now().toString().slice(-8)}`,
          notes: 'Invoice advance / payment',
          status: 'COMPLETED',
          recorded_by: mockDb.currentUser.id,
          recorded_by_name: mockDb.currentUser.full_name,
          created_at: new Date().toISOString()
        });
      }

      mockDb.save();
      return jsonResponse(newInv);
    }

    let filtered = [...mockDb.invoices];
    const st = searchParams.get('status');
    if (st && st !== 'ALL') {
      filtered = filtered.filter(inv => inv.status === st);
    }
    return jsonResponse(filtered);
  }

  if (pathname.startsWith('/api/invoices/')) {
    const parts = pathname.split('/');
    const invId = parts[3];
    const isPayment = parts[4] === 'payments';

    if (method === 'DELETE') {
      const idx = mockDb.invoices.findIndex(i => i.id === invId || i.invoice_number === invId);
      if (idx !== -1) {
        const deleted = mockDb.invoices[idx];
        mockDb.invoices.splice(idx, 1);
        // Unlink from any matching order
        const matchedOrder = mockDb.orders.find(o => o.invoice_id === deleted.id);
        if (matchedOrder) {
          matchedOrder.invoice_id = null;
          matchedOrder.invoice_number = null;
        }
        mockDb.save();
        return jsonResponse({ success: true, message: 'Invoice deleted successfully' });
      }
      return jsonResponse({ error: 'Invoice not found' }, 404);
    }

    const inv = mockDb.invoices.find(i => i.id === invId || i.invoice_number === invId) || mockDb.invoices[0];

    if (isPayment && method === 'POST') {
      const payAmount = Number(body.amount || 0);
      if (inv && payAmount > 0) {
        inv.amount_paid = (Number(inv.amount_paid) || 0) + payAmount;
        inv.balance_due = Math.max(0, (Number(inv.grand_total) || 0) - inv.amount_paid);
        inv.status = inv.amount_paid >= (Number(inv.grand_total) || 0) ? 'PAID' : 'PARTIAL';

        // Also update matching order if exists
        const matchedOrder = mockDb.orders.find(o => o.invoice_id === inv.id || o.customer_id === inv.customer_id);
        if (matchedOrder) {
          matchedOrder.payment_received = (Number(matchedOrder.payment_received) || 0) + payAmount;
          matchedOrder.payment_pending = Math.max(0, (Number(matchedOrder.selling_price) || 0) - matchedOrder.payment_received);
          matchedOrder.payment_status = matchedOrder.payment_received >= (Number(matchedOrder.selling_price) || 0) ? 'PAID' : 'PARTIALLY_PAID';
          matchedOrder.available_amount = matchedOrder.payment_received - (Number(matchedOrder.total_cost) || 0);
        }

        mockDb.payments.unshift({
          id: `pay-${Date.now()}`,
          payment_number: `PAY-2026-${String(mockDb.payments.length + 1).padStart(4, '0')}`,
          customer_id: inv.customer_id,
          customer_name: inv.customer_name,
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          order_id: matchedOrder?.id,
          amount: payAmount,
          method: body.method || 'UPI',
          date: body.date || new Date().toISOString().split('T')[0],
          reference_number: body.reference_number || body.referenceNumber || `REF-${Date.now()}`,
          notes: body.notes || 'Invoice collection payment',
          status: 'COMPLETED',
          recorded_by: mockDb.currentUser.id,
          recorded_by_name: mockDb.currentUser.full_name,
          created_at: new Date().toISOString()
        });

        mockDb.save();
      }
      return jsonResponse({ success: true, invoice: inv });
    }

    return jsonResponse(inv);
  }

  // 7.5 Payments
  if (pathname === '/api/payments') {
    if (method === 'POST') {
      const payAmount = Number(body.amount || 0);
      const newPay: MockPayment = {
        id: `pay-${Date.now()}`,
        payment_number: `PAY-2026-${String(mockDb.payments.length + 1).padStart(4, '0')}`,
        customer_id: body.customer_id || 'cust-bvrit',
        customer_name: body.customer_name || 'BVRIT Hyderabad (B.V. Raju Institute of Technology)',
        invoice_id: body.invoice_id,
        invoice_number: body.invoice_number,
        amount: payAmount,
        method: body.method || 'UPI',
        date: body.date || new Date().toISOString().split('T')[0],
        reference_number: body.reference_number || body.referenceNumber || `REF-${Date.now()}`,
        notes: body.notes || 'Payment recorded',
        status: 'COMPLETED',
        recorded_by: mockDb.currentUser.id,
        recorded_by_name: mockDb.currentUser.full_name,
        created_at: new Date().toISOString()
      };
      mockDb.payments.unshift(newPay);

      if (body.invoice_id) {
        const inv = mockDb.invoices.find(i => i.id === body.invoice_id);
        if (inv) {
          inv.amount_paid = (Number(inv.amount_paid) || 0) + payAmount;
          inv.balance_due = Math.max(0, (Number(inv.grand_total) || 0) - inv.amount_paid);
          inv.status = inv.amount_paid >= (Number(inv.grand_total) || 0) ? 'PAID' : 'PARTIAL';
        }
      }
      mockDb.save();
      return jsonResponse(newPay);
    }

    let filtered = [...mockDb.payments];
    const methodFilter = searchParams.get('method');
    const searchFilter = searchParams.get('search');
    if (methodFilter && methodFilter !== 'ALL') {
      filtered = filtered.filter(p => p.method.toUpperCase() === methodFilter.toUpperCase());
    }
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      filtered = filtered.filter(p =>
        p.payment_number.toLowerCase().includes(q) ||
        (p.customer_name && p.customer_name.toLowerCase().includes(q)) ||
        (p.reference_number && p.reference_number.toLowerCase().includes(q))
      );
    }
    return jsonResponse(filtered);
  }

  // 7.8 Quotations
  if (pathname === '/api/quotations') {
    if (method === 'POST') {
      const items = (body.items || []).map((it: any, idx: number) => {
        const qty = Number(it.quantity) || 1;
        const rate = Number(it.rate || it.unit_price) || 0;
        const amt = Number(it.amount) || (qty * rate);
        return {
          id: it.id || `qti-${Date.now()}-${idx}`,
          description: it.description || 'Custom Merchandise Item',
          quantity: qty,
          rate: rate,
          discount: Number(it.discount) || 0,
          tax_rate: Number(it.tax_rate) || 0,
          amount: amt
        };
      });

      const computedSubtotal = items.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0);
      const subtotal = Number(body.subtotal) || computedSubtotal;
      const discount = Number(body.discount) || 0;
      const taxRate = Number(body.tax_rate) || 0;
      const taxAmount = Number(body.tax_amount) || Math.round((subtotal - discount) * (taxRate / 100));
      const grandTotal = Number(body.grand_total) || Math.max(0, subtotal - discount + taxAmount);

      const newQuote: MockQuotation = {
        id: `qt-${Date.now()}`,
        quotation_number: `QT-2026-${String(mockDb.quotations.length + 1).padStart(4, '0')}`,
        customer_id: body.customer_id || undefined,
        customer_name: body.customer_name || 'Prospective Customer',
        customer_phone: body.customer_phone || '',
        customer_email: body.customer_email || '',
        customer_address: body.customer_address || '',
        items,
        subtotal,
        discount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        valid_until: body.valid_until || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        status: body.status || 'SENT',
        notes: body.notes || 'Payment Terms: 50% advance to confirm order and start production; balance 50% upon delivery.',
        terms: body.terms || 'Quote valid for 15 days. GST extra as applicable. Delivery in 5-7 working days.',
        created_by: mockDb.currentUser.id,
        created_by_name: mockDb.currentUser.full_name,
        created_at: new Date().toISOString()
      };

      mockDb.quotations.unshift(newQuote);
      mockDb.save();
      return jsonResponse(newQuote, 201);
    }

    let filtered = [...mockDb.quotations];
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    if (status && status !== 'ALL') {
      filtered = filtered.filter(q => q.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.quotation_number.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q) ||
        item.customer_phone.includes(q)
      );
    }
    return jsonResponse(filtered);
  }

  if (pathname.startsWith('/api/quotations/')) {
    const parts = pathname.split('/');
    const quoteId = parts[3];
    const isConvert = parts[4] === 'convert';

    const index = mockDb.quotations.findIndex(q => q.id === quoteId || q.quotation_number === quoteId);
    if (index === -1) {
      return jsonResponse({ error: 'Quotation not found' }, 404);
    }
    const quote = mockDb.quotations[index];

    if (method === 'DELETE') {
      mockDb.quotations.splice(index, 1);
      mockDb.save();
      return jsonResponse({ success: true, message: 'Quotation deleted successfully' });
    }

    if (method === 'PUT' || method === 'PATCH') {
      const updated = { ...quote, ...body };
      mockDb.quotations[index] = updated;
      mockDb.save();
      return jsonResponse(updated);
    }

    if (isConvert && method === 'POST') {
      const totalUnits = quote.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
      const estBlankCost = Math.round(quote.grand_total * 0.45);
      const estPrintCost = Math.round(quote.grand_total * 0.20);
      const estLogistics = 500;
      const fin = calculateOrderFinancials({
        sellingPrice: quote.grand_total,
        productCost: estBlankCost,
        printingCost: estPrintCost,
        tshirtRapidoCost: 200,
        printRapidoCost: 150,
        deliveryCost: estLogistics,
        otherCost: 0,
        paymentReceived: 0
      });

      const newOrderNum = `ORD-2026-${String(mockDb.orders.length + 1).padStart(4, '0')}`;
      const newOrderId = `ord-${Date.now()}`;
      const newInvNum = `INV-2026-${String(mockDb.invoices.length + 1).padStart(4, '0')}`;
      const newInvId = `inv-${Date.now()}`;

      const newOrder: MockOrder = {
        id: newOrderId,
        order_number: newOrderNum,
        customer_id: quote.customer_id || `cust-${Date.now()}`,
        customer_name: quote.customer_name,
        customer_phone: quote.customer_phone,
        customer_email: quote.customer_email,
        customer_address: quote.customer_address,
        product_name: quote.items[0]?.description || 'Customized Merchandise',
        quantity: totalUnits,
        selling_price: quote.grand_total,
        product_cost: estBlankCost,
        printing_cost: estPrintCost,
        tshirt_rapido_cost: 200,
        print_rapido_cost: 150,
        delivery_cost: estLogistics,
        other_cost: 0,
        total_cost: fin.totalCost,
        profit: fin.profit,
        profit_margin: fin.profitMargin,
        payment_status: 'PENDING',
        payment_received: 0,
        payment_pending: quote.grand_total,
        available_amount: -fin.totalCost,
        is_tshirt: 1,
        is_partner_shared: 1,
        tshirt_neck_type: 'Round Neck',
        tshirt_fabric: 'Pure Cotton',
        tshirt_size: 'Standard Assorted',
        tshirt_color: 'Standard',
        order_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        invoice_id: newInvId,
        invoice_number: newInvNum,
        notes: `Converted from Quotation ${quote.quotation_number}. ${quote.notes || ''}`
      };

      const newInvoice: MockInvoice = {
        id: newInvId,
        invoice_number: newInvNum,
        customer_id: newOrder.customer_id,
        customer_name: quote.customer_name,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        subtotal: quote.subtotal,
        discount: quote.discount || 0,
        tax_rate: quote.tax_rate || 0,
        tax_amount: quote.tax_amount || 0,
        grand_total: quote.grand_total,
        amount_paid: 0,
        balance_due: quote.grand_total,
        status: 'SENT',
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        items: quote.items
      };

      quote.status = 'CONVERTED';
      quote.converted_order_id = newOrderId;
      quote.converted_invoice_id = newInvId;

      mockDb.orders.unshift(newOrder);
      mockDb.invoices.unshift(newInvoice);
      mockDb.save();

      return jsonResponse({
        success: true,
        quotation: quote,
        order: newOrder,
        invoice: newInvoice
      });
    }

    return jsonResponse(quote);
  }

  // 8. Customers
  if (pathname === '/api/customers') {
    if (method === 'POST') {
      const newCust: MockCustomer = {
        id: `cust-${Date.now()}`,
        customer_code: `CUST-${String(mockDb.customers.length + 1).padStart(4, '0')}`,
        name: body.name || 'New Customer',
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        total_orders: 0,
        total_spent: 0,
        total_paid: 0,
        outstanding_balance: 0,
        total_profit_generated: 0,
        status: 'ACTIVE',
        created_at: new Date().toISOString().split('T')[0]
      };
      mockDb.customers.unshift(newCust);
      mockDb.save();
      return jsonResponse(newCust);
    }

    let filtered = [...mockDb.customers];
    const q = searchParams.get('search');
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        c.address.toLowerCase().includes(query)
      );
    }
    return jsonResponse(filtered);
  }

  // 9. Expenses
  if (pathname === '/api/expenses') {
    if (method === 'POST') {
      const newExp: MockExpense = {
        id: `exp-${Date.now()}`,
        expense_number: `EXP-${String(mockDb.expenses.length + 1).padStart(4, '0')}`,
        date: body.date || new Date().toISOString().split('T')[0],
        category: body.category || 'Materials',
        description: body.description || 'General Expense',
        amount: Number(body.amount || 0),
        payment_method: body.payment_method || 'UPI',
        created_by_name: mockDb.currentUser.full_name,
        notes: body.notes
      };
      mockDb.expenses.unshift(newExp);
      mockDb.save();
      return jsonResponse(newExp);
    }

    const totalAmount = mockDb.expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryMap: Record<string, { category: string; total: number; count: number }> = {};
    mockDb.expenses.forEach(e => {
      if (!categoryMap[e.category]) categoryMap[e.category] = { category: e.category, total: 0, count: 0 };
      categoryMap[e.category].total += e.amount;
      categoryMap[e.category].count += 1;
    });

    return jsonResponse({
      expenses: mockDb.expenses,
      totalAmount,
      categoryTotals: Object.values(categoryMap)
    });
  }

  // 10. T-Shirt Analytics
  if (pathname === '/api/tshirts/analytics') {
    const tOrders = mockDb.orders.filter(o => o.is_tshirt === 1);
    const totalTshirtsSold = tOrders.reduce((sum, o) => sum + o.quantity, 0);
    const totalRevenue = tOrders.reduce((sum, o) => sum + o.selling_price, 0);
    const totalProductCost = tOrders.reduce((sum, o) => sum + o.product_cost, 0);
    const totalPrintingCost = tOrders.reduce((sum, o) => sum + o.printing_cost, 0);
    const totalDeliveryCost = tOrders.reduce((sum, o) => sum + o.delivery_cost, 0);
    const totalProfit = tOrders.reduce((sum, o) => sum + o.profit, 0);
    const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const avgProfitPerTshirt = totalTshirtsSold > 0 ? Math.round(totalProfit / totalTshirtsSold) : 0;

    // By Neck Type
    const collarOrders = tOrders.filter(o => o.tshirt_neck_type === 'Collar');
    const roundNeckOrders = tOrders.filter(o => o.tshirt_neck_type !== 'Collar');

    const salesByNeckType = [
      {
        neck_type: 'Collar',
        count: collarOrders.reduce((s, o) => s + o.quantity, 0),
        revenue: collarOrders.reduce((s, o) => s + o.selling_price, 0),
        profit: collarOrders.reduce((s, o) => s + o.profit, 0)
      },
      {
        neck_type: 'Round Neck',
        count: roundNeckOrders.reduce((s, o) => s + o.quantity, 0),
        revenue: roundNeckOrders.reduce((s, o) => s + o.selling_price, 0),
        profit: roundNeckOrders.reduce((s, o) => s + o.profit, 0)
      }
    ];

    // By Fabric
    const fabrics = ['Pure Cotton', 'Cotton', 'Poly Cotton', 'Nano Curve'];
    const salesByFabric = fabrics.map(fab => {
      const match = tOrders.filter(o => (o.tshirt_fabric || '').toLowerCase() === fab.toLowerCase());
      return {
        fabric: fab,
        count: match.reduce((s, o) => s + o.quantity, 0),
        revenue: match.reduce((s, o) => s + o.selling_price, 0),
        profit: match.reduce((s, o) => s + o.profit, 0)
      };
    }).filter(f => f.count > 0);

    // ID Cards summary
    const idOrders = mockDb.orders.filter(o => o.has_id_cards === 1);
    const idCardsSummary = {
      orders_with_id_cards: idOrders.length,
      total_id_cards_sold: idOrders.reduce((s, o) => s + (o.id_card_quantity || 0), 0),
      id_card_revenue: idOrders.reduce((s, o) => s + (o.id_card_selling_price || 0), 0),
      id_card_cost: idOrders.reduce((s, o) => s + (o.id_card_cost || 0), 0),
      id_card_profit: idOrders.reduce((s, o) => s + (o.id_card_profit || 0), 0)
    };

    return jsonResponse({
      summary: {
        totalOrders: tOrders.length,
        totalTshirtsSold,
        totalRevenue,
        totalProductCost,
        totalPrintingCost,
        totalDeliveryCost,
        totalProfit,
        profitMargin,
        avgProfitPerTshirt
      },
      salesBySize: [
        { size: 'S', count: 5, revenue: 3200 },
        { size: 'M', count: 12, revenue: 7800 },
        { size: 'L', count: 18, revenue: 11400 },
        { size: 'XL', count: 10, revenue: 6500 },
        { size: 'XXL', count: 4, revenue: 2600 }
      ],
      salesByColor: [
        { color: 'Black', count: 18 },
        { color: 'White', count: 14 },
        { color: 'Navy Blue', count: 10 },
        { color: 'Royal Blue', count: 6 },
        { color: 'Maroon', count: 4 }
      ],
      salesByNeckType,
      salesByFabric,
      idCardsSummary,
      topOrders: tOrders.slice(0, 5)
    });
  }

  // 11. Cash Bank
  if (pathname === '/api/cash-bank') {
    return jsonResponse({
      summary: {
        cashTotal: 28500,
        bankTotal: 145200,
        upiTotal: 54300,
        netTotal: 228000
      },
      accounts: [
        { id: 'acc-1', account_name: 'Cash in Hand (Office Vault)', account_type: 'CASH', current_balance: 28500 },
        { id: 'acc-2', account_name: 'HDFC Bank Current Account', account_type: 'BANK', account_number: '50200012345678', ifsc_code: 'HDFC0001234', current_balance: 145200 },
        { id: 'acc-3', account_name: 'Business UPI Merchant A/C', account_type: 'UPI', current_balance: 54300 }
      ],
      transactions: [
        { id: 'tx-1', transaction_number: 'TXN-001', date: '2026-09-07', type: 'INCOME', account_name: 'Business UPI', amount: 9800, description: 'Order #ORD-2026-0006 full payment', actor_name: 'Jashwanth Reddy' },
        { id: 'tx-2', transaction_number: 'TXN-002', date: '2026-09-06', type: 'EXPENSE', account_name: 'HDFC Bank', amount: 8500, description: 'Blank T-Shirts bulk shipment', actor_name: 'Rajshekar Reddy' },
        { id: 'tx-3', transaction_number: 'TXN-003', date: '2026-09-05', type: 'TRANSFER', account_name: 'Cash in Hand', to_account_name: 'HDFC Bank', amount: 15000, description: 'Deposit counter cash to bank', actor_name: 'Jashwanth Reddy' }
      ]
    });
  }

  // 12. Financial Report & Profit Loss
  if (pathname === '/api/reports/financial' || pathname === '/api/profit-loss') {
    const period = searchParams.get('period') || 'monthly';
    const now = new Date();
    let orders = [...mockDb.orders];
    let expenses = [...mockDb.expenses];

    if (period === 'daily') {
      const today = now.toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '').startsWith(today));
      expenses = expenses.filter(e => (e.date || '').startsWith(today));
    } else if (period === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= weekAgo);
      expenses = expenses.filter(e => (e.date || '') >= weekAgo);
    } else if (period === 'monthly') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= monthAgo);
      expenses = expenses.filter(e => (e.date || '') >= monthAgo);
    } else if (period === 'yearly') {
      const yearStart = `${now.getFullYear()}-01-01`;
      orders = orders.filter(o => (o.order_date || o.created_at || '') >= yearStart);
      expenses = expenses.filter(e => (e.date || '') >= yearStart);
    }

    // 1. T-Shirts
    const tOrders = orders.filter(o => o.is_tshirt === 1);
    const tRev = tOrders.reduce((s, o) => s + (Number(o.selling_price) || 0), 0);
    const tProdCost = tOrders.reduce((s, o) => s + (Number(o.product_cost) || 0), 0);
    const tPrintCost = tOrders.reduce((s, o) => s + (Number(o.printing_cost) || 0), 0);
    const tDelCost = tOrders.reduce((s, o) => s + (Number(o.delivery_cost) || 0), 0);
    const tOtherCost = tOrders.reduce((s, o) => s + (Number(o.other_cost) || 0), 0);
    const tTotalCost = tOrders.reduce((s, o) => s + (Number(o.total_cost) || 0), 0);
    const tProfit = tRev - tTotalCost;
    const tSold = tOrders.reduce((s, o) => s + (Number(o.quantity) || 0), 0);

    // 2. Other products
    const otherOrders = orders.filter(o => o.is_tshirt !== 1);
    const oRev = otherOrders.reduce((s, o) => s + (Number(o.selling_price) || 0), 0);
    const oProdCost = otherOrders.reduce((s, o) => s + (Number(o.product_cost) || 0), 0);
    const oPrintCost = otherOrders.reduce((s, o) => s + (Number(o.printing_cost) || 0), 0);
    const oDelCost = otherOrders.reduce((s, o) => s + (Number(o.delivery_cost) || 0), 0);
    const oOtherCost = otherOrders.reduce((s, o) => s + (Number(o.other_cost) || 0), 0);
    const oTotalCost = otherOrders.reduce((s, o) => s + (Number(o.total_cost) || 0), 0);
    const oProfit = oRev - oTotalCost;
    const oSold = otherOrders.reduce((s, o) => s + (Number(o.quantity) || 0), 0);

    // 3. Overall
    const totalRev = tRev + oRev;
    const totalCost = tTotalCost + oTotalCost;
    const grossProfit = totalRev - totalCost;
    const generalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const netBusinessProfit = grossProfit - generalExpenses;

    // 4. Itemized
    const prodMap: Record<string, {
      product_name: string;
      is_tshirt: number;
      orders_count: number;
      items_sold: number;
      revenue: number;
      product_cost: number;
      printing_cost: number;
      delivery_cost: number;
      total_cost: number;
      profit: number;
      margin_pct: number;
    }> = {};

    orders.forEach(o => {
      const key = o.product_name || 'Product';
      if (!prodMap[key]) {
        prodMap[key] = {
          product_name: key,
          is_tshirt: o.is_tshirt ? 1 : 0,
          orders_count: 0,
          items_sold: 0,
          revenue: 0,
          product_cost: 0,
          printing_cost: 0,
          delivery_cost: 0,
          total_cost: 0,
          profit: 0,
          margin_pct: 0
        };
      }
      prodMap[key].orders_count += 1;
      prodMap[key].items_sold += (Number(o.quantity) || 0);
      prodMap[key].revenue += (Number(o.selling_price) || 0);
      prodMap[key].product_cost += (Number(o.product_cost) || 0);
      prodMap[key].printing_cost += (Number(o.printing_cost) || 0);
      prodMap[key].delivery_cost += (Number(o.delivery_cost) || 0);
      prodMap[key].total_cost += (Number(o.total_cost) || 0);
      prodMap[key].profit += (Number(o.profit) || 0);
    });

    const itemized = Object.values(prodMap).map(item => ({
      ...item,
      margin_pct: item.revenue > 0 ? Number(((item.profit / item.revenue) * 100).toFixed(1)) : 0
    }));

    // Partner allocation
    const sharedProfit = tProfit;
    const soleProfit = oProfit;
    const jashwanthShared = Math.round(sharedProfit * 0.5);
    const jashwanthSole = soleProfit;
    const jashwanthTotal = jashwanthShared + jashwanthSole;
    const rajshekarTotal = Math.round(sharedProfit * 0.5);

    return jsonResponse({
      period,
      tshirtProfit: {
        ordersCount: tOrders.length,
        itemsSold: tSold,
        revenue: tRev,
        productCost: tProdCost,
        printingCost: tPrintCost,
        deliveryCost: tDelCost,
        otherCost: tOtherCost,
        totalCost: tTotalCost,
        profit: tProfit,
        margin: tRev > 0 ? Number(((tProfit / tRev) * 100).toFixed(1)) : 0
      },
      otherProductProfit: {
        ordersCount: otherOrders.length,
        itemsSold: oSold,
        revenue: oRev,
        productCost: oProdCost,
        printingCost: oPrintCost,
        deliveryCost: oDelCost,
        otherCost: oOtherCost,
        totalCost: oTotalCost,
        profit: oProfit,
        margin: oRev > 0 ? Number(((oProfit / oRev) * 100).toFixed(1)) : 0
      },
      overall: {
        totalRevenue: totalRev,
        totalProductCost: tProdCost + oProdCost,
        totalPrintingCost: tPrintCost + oPrintCost,
        totalDeliveryCost: tDelCost + oDelCost,
        totalOtherCost: tOtherCost + oOtherCost,
        orderTotalCost: totalCost,
        grossOrderProfit: grossProfit,
        generalExpenses,
        netBusinessProfit,
        netMargin: totalRev > 0 ? Number(((netBusinessProfit / totalRev) * 100).toFixed(1)) : 0
      },
      itemized,
      revenue: { salesRevenue: totalRev, otherIncome: 0, totalRevenue: totalRev },
      expenses: { categories: expenses, totalExpenses: generalExpenses },
      netProfit: netBusinessProfit,
      profitMargin: totalRev > 0 ? Number(((netBusinessProfit / totalRev) * 100).toFixed(1)) : 0,
      partnerAllocation: {
        sharedCategoryProfit: sharedProfit,
        soleCategoryProfit: soleProfit,
        jashwanth: { totalProfit: jashwanthTotal, sharedProfit: jashwanthShared, soleProfit: jashwanthSole },
        rajshekar: { totalProfit: rajshekarTotal, sharedProfit: rajshekarTotal, soleProfit: 0 }
      }
    });
  }

  // 13. Activity Logs
  if (pathname === '/api/activity') {
    return jsonResponse([
      { id: 'act-1', actorName: 'Jashwanth Reddy', action: 'CREATE', entityType: 'ORDER', entityReference: 'ORD-2026-0006', reason: 'College fest bulk order recorded', createdAt: new Date().toISOString() },
      { id: 'act-2', actorName: 'Rajshekar Reddy', action: 'CREATE', entityType: 'EXPENSE', entityReference: 'EXP-0002', reason: 'Materials procurement from Tirupur supplier', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'act-3', actorName: 'Jashwanth Reddy', action: 'PAYMENT', entityType: 'INVOICE', entityReference: 'INV-2026-0001', reason: 'UPI payment cleared', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() }
    ]);
  }

  // 14. Products Catalogue
  if (pathname === '/api/products') {
    return jsonResponse([
      { id: 'prod-1', name: 'Custom Printed T-Shirt', category: 'Apparel', default_selling_price: 650, default_product_cost: 220, default_printing_cost: 140 },
      { id: 'prod-2', name: 'Photo Frame', category: 'Frames & Decor', default_selling_price: 799, default_product_cost: 250, default_printing_cost: 150 },
      { id: 'prod-3', name: 'Bouquet', category: 'Gifts & Flowers', default_selling_price: 1299, default_product_cost: 500, default_printing_cost: 100 },
      { id: 'prod-4', name: 'Custom Mug', category: 'Drinkware', default_selling_price: 399, default_product_cost: 100, default_printing_cost: 80 },
      { id: 'prod-5', name: 'Custom Cap', category: 'Apparel', default_selling_price: 499, default_product_cost: 150, default_printing_cost: 120 },
      { id: 'prod-6', name: 'Personalized Album', category: 'Print & Albums', default_selling_price: 1899, default_product_cost: 600, default_printing_cost: 400 }
    ]);
  }

  // 15. AI Parse Order
  if (pathname === '/api/ai/parse-order' && method === 'POST') {
    const text = (body.prompt || '').toLowerCase();
    const isCollar = text.includes('collar');
    const isRound = text.includes('round') || !isCollar;
    const neckType = isCollar ? 'Collar' : 'Round Neck';

    let fabric = 'Pure Cotton';
    if (text.includes('poly') || text.includes('polyester')) fabric = 'Poly Cotton';
    else if (text.includes('nano')) fabric = 'Nano Curve';
    else if (text.includes('cotton')) fabric = 'Cotton';

    // Quantity regex
    const qtyMatch = text.match(/(\d+)\s*(pcs|pieces|t-shirt|tshirt|shirt|mugs|frames)/i) || text.match(/ordered\s*(\d+)/i);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 2;

    // Price regex
    const priceMatch = text.match(/₹?\s*(\d{3,6})/);
    const sellingPrice = priceMatch ? parseInt(priceMatch[1], 10) : 2500;

    return jsonResponse({
      extracted: {
        customer_name: 'Walk-in Client',
        customer_phone: '+91 98490 00000',
        product_name: text.includes('frame') ? 'Photo Frame' : text.includes('mug') ? 'Custom Mug' : text.includes('bouquet') ? 'Bouquet' : 'Custom Printed T-Shirt',
        quantity,
        selling_price: sellingPrice,
        product_cost: Math.round(sellingPrice * 0.35),
        printing_cost: Math.round(sellingPrice * 0.18),
        delivery_cost: 120,
        other_cost: 30,
        tshirt_neck_type: neckType,
        tshirt_fabric: fabric,
        tshirt_size: 'L',
        tshirt_color: text.includes('white') ? 'White' : text.includes('navy') ? 'Navy' : 'Black',
        tshirt_print_type: text.includes('back') ? 'Front & Back' : 'Front Print'
      }
    });
  }

  // 16. AI Insights
  if (pathname === '/api/ai/insights') {
    return jsonResponse({
      insights: [
        { id: 1, title: 'T-Shirts Anchor 72% of Partnership Margins', text: 'Custom printed collar and round neck T-shirts consistently yield 42%+ gross margin with lowest cancellation rates.' },
        { id: 2, title: 'ID Cards Cross-Sell Boosts Order Value by 18%', text: 'College and event orders with companion ID cards generate an additional ₹525 pure profit per batch with zero extra marketing spend.' },
        { id: 3, title: 'Collar Neck T-Shirts Demand is Rising', text: 'Corporate client orders for collar polo t-shirts in Poly Cotton have grown 35% this month.' }
      ]
    });
  }

  // 17. Sales
  if (pathname === '/api/sales') {
    return jsonResponse([]);
  }

  // 18. Ledger
  if (pathname === '/api/ledger') {
    return jsonResponse([]);
  }

  // Default fallback for any unhandled /api
  return jsonResponse({ success: true });
}

// Global fetch interceptor installation
export function installApiInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

    // Only intercept requests destined for /api/
    if (urlString.startsWith('/api/') || urlString.includes('/api/')) {
      const backendBase = (import.meta as any).env?.VITE_API_URL || '';

      // If an external backend URL is specified, adjust target URL
      let targetUrl = urlString;
      if (backendBase && urlString.startsWith('/api/')) {
        targetUrl = `${backendBase.replace(/\/$/, '')}${urlString}`;
      }

      try {
        const response = await originalFetch(targetUrl, init);
        const contentType = response.headers.get('content-type') || '';

        // If server answered with valid JSON, pass it through!
        if (contentType.includes('application/json')) {
          return response;
        }

        // If server returned HTML (e.g. Vercel rewrite to index.html) or status >= 400
        console.warn(`[Infinity API Interceptor] Non-JSON response received from ${urlString} (Content-Type: ${contentType}). Falling back to local offline engine.`);
        return await handleMockApi(urlString, init);
      } catch (err) {
        // Network error (backend sleeping on Render, offline, or DNS error)
        console.warn(`[Infinity API Interceptor] Network fetch failed for ${urlString}. Falling back to local offline engine.`, err);
        return await handleMockApi(urlString, init);
      }
    }

    // Pass all other requests to standard fetch
    return originalFetch(input, init);
  };

  console.log('⚡ Infinity Customizations Resilient API Engine initialized.');
}
