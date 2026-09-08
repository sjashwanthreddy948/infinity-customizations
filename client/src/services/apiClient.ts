// client/src/services/apiClient.ts
// Universal API Client with automatic Vercel static fallback and persistent demo database

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
  available_amount: number;
  is_tshirt: number;
  tshirt_neck_type?: string;
  tshirt_fabric?: string;
  tshirt_size?: string;
  tshirt_size_breakdown?: string;
  tshirt_color?: string;
  tshirt_print_type?: string;
  print_meters?: number;
  print_rate_per_meter?: number;
  has_id_cards?: number;
  id_card_quantity?: number;
  id_card_unit_price?: number;
  id_card_unit_cost?: number;
  id_card_selling_price?: number;
  id_card_cost?: number;
  id_card_profit?: number;
  order_date: string;
  created_by_name: string;
  created_by: string;
}

interface MockInvoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
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
    id: 'cust-1',
    customer_code: 'CUST-0001',
    name: 'Rahul Sharma',
    phone: '+91 98490 11223',
    email: 'rahul.sharma@example.com',
    address: 'Flat 402, Banjara Hills, Hyderabad',
    total_orders: 3,
    total_spent: 12500,
    total_paid: 12500,
    outstanding_balance: 0,
    total_profit_generated: 4850,
    status: 'ACTIVE',
    created_at: '2026-06-01'
  },
  {
    id: 'cust-2',
    customer_code: 'CUST-0002',
    name: 'Priya Patel',
    phone: '+91 98490 22334',
    email: 'priya.patel@example.com',
    address: 'Villa 18, Gachibowli, Hyderabad',
    total_orders: 2,
    total_spent: 8600,
    total_paid: 8600,
    outstanding_balance: 0,
    total_profit_generated: 3400,
    status: 'ACTIVE',
    created_at: '2026-06-05'
  },
  {
    id: 'cust-3',
    customer_code: 'CUST-0003',
    name: 'Vikram Malhotra',
    phone: '+91 98490 33445',
    email: 'vikram.m@example.com',
    address: 'Plot 12, Madhapur, Hyderabad',
    total_orders: 1,
    total_spent: 3600,
    total_paid: 2000,
    outstanding_balance: 1600,
    total_profit_generated: 1450,
    status: 'ACTIVE',
    created_at: '2026-06-10'
  },
  {
    id: 'cust-4',
    customer_code: 'CUST-0004',
    name: 'Ananya Rao',
    phone: '+91 98490 44556',
    email: 'ananya.rao@example.com',
    address: 'Road No. 10, Jubilee Hills, Hyderabad',
    total_orders: 2,
    total_spent: 4200,
    total_paid: 4200,
    outstanding_balance: 0,
    total_profit_generated: 1800,
    status: 'ACTIVE',
    created_at: '2026-06-15'
  },
  {
    id: 'cust-5',
    customer_code: 'CUST-0005',
    name: 'Sneha Gupta',
    phone: '+91 98490 55667',
    email: 'sneha.g@example.com',
    address: 'Apt 3B, Kondapur, Hyderabad',
    total_orders: 1,
    total_spent: 2598,
    total_paid: 2598,
    outstanding_balance: 0,
    total_profit_generated: 1120,
    status: 'ACTIVE',
    created_at: '2026-06-20'
  },
  {
    id: 'cust-6',
    customer_code: 'CUST-0006',
    name: 'Karthik Iyer',
    phone: '+91 98490 66778',
    email: 'karthik.i@example.com',
    address: 'Cyber Towers Lane, Hitec City, Hyderabad',
    total_orders: 2,
    total_spent: 9800,
    total_paid: 9800,
    outstanding_balance: 0,
    total_profit_generated: 3950,
    status: 'ACTIVE',
    created_at: '2026-06-25'
  }
];

const INITIAL_ORDERS: MockOrder[] = [
  {
    id: 'ord-1',
    order_number: 'ORD-2026-0001',
    customer_id: 'cust-1',
    customer_name: 'Rahul Sharma',
    customer_phone: '+91 98490 11223',
    product_name: 'Custom Printed T-Shirt',
    quantity: 10,
    selling_price: 6500,
    product_cost: 2200,
    printing_cost: 1400,
    tshirt_rapido_cost: 120,
    print_rapido_cost: 80,
    delivery_cost: 200,
    other_cost: 50,
    total_cost: 3850,
    profit: 2650,
    profit_margin: 40.8,
    payment_status: 'PAID',
    payment_received: 6500,
    available_amount: 2650,
    is_tshirt: 1,
    tshirt_neck_type: 'Collar',
    tshirt_fabric: 'Poly Cotton',
    tshirt_size: 'Custom',
    tshirt_size_breakdown: 'M: 4, L: 4, XL: 2',
    tshirt_color: 'Navy Blue',
    tshirt_print_type: 'Front & Back',
    print_meters: 1.8,
    print_rate_per_meter: 300,
    has_id_cards: 1,
    id_card_quantity: 10,
    id_card_unit_price: 70,
    id_card_unit_cost: 35,
    id_card_selling_price: 700,
    id_card_cost: 350,
    id_card_profit: 350,
    order_date: '2026-09-02',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1'
  },
  {
    id: 'ord-2',
    order_number: 'ORD-2026-0002',
    customer_id: 'cust-2',
    customer_name: 'Priya Patel',
    customer_phone: '+91 98490 22334',
    product_name: 'Custom Printed T-Shirt',
    quantity: 4,
    selling_price: 4800,
    product_cost: 1600,
    printing_cost: 1000,
    tshirt_rapido_cost: 80,
    print_rapido_cost: 70,
    delivery_cost: 150,
    other_cost: 50,
    total_cost: 2800,
    profit: 2000,
    profit_margin: 41.7,
    payment_status: 'PAID',
    payment_received: 4800,
    available_amount: 2000,
    is_tshirt: 1,
    tshirt_neck_type: 'Round Neck',
    tshirt_fabric: 'Pure Cotton',
    tshirt_size: 'M',
    tshirt_size_breakdown: 'M: 4',
    tshirt_color: 'White',
    tshirt_print_type: 'Front & Back',
    print_meters: 1.2,
    print_rate_per_meter: 300,
    has_id_cards: 0,
    order_date: '2026-09-03',
    created_by_name: 'Rajshekar Reddy',
    created_by: 'usr-rajshekar-2'
  },
  {
    id: 'ord-3',
    order_number: 'ORD-2026-0003',
    customer_id: 'cust-3',
    customer_name: 'Vikram Malhotra',
    customer_phone: '+91 98490 33445',
    product_name: 'Photo Frame',
    quantity: 2,
    selling_price: 3600,
    product_cost: 1100,
    printing_cost: 700,
    tshirt_rapido_cost: 0,
    print_rapido_cost: 0,
    delivery_cost: 150,
    other_cost: 50,
    total_cost: 2000,
    profit: 1600,
    profit_margin: 44.4,
    payment_status: 'PARTIALLY_PAID',
    payment_received: 2000,
    available_amount: 0,
    is_tshirt: 0,
    order_date: '2026-09-04',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1'
  },
  {
    id: 'ord-4',
    order_number: 'ORD-2026-0004',
    customer_id: 'cust-4',
    customer_name: 'Ananya Rao',
    customer_phone: '+91 98490 44556',
    product_name: 'Bouquet',
    quantity: 2,
    selling_price: 2598,
    product_cost: 1000,
    printing_cost: 200,
    tshirt_rapido_cost: 0,
    print_rapido_cost: 0,
    delivery_cost: 120,
    other_cost: 30,
    total_cost: 1350,
    profit: 1248,
    profit_margin: 48.0,
    payment_status: 'PAID',
    payment_received: 2598,
    available_amount: 1248,
    is_tshirt: 0,
    order_date: '2026-09-05',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1'
  },
  {
    id: 'ord-5',
    order_number: 'ORD-2026-0005',
    customer_id: 'cust-5',
    customer_name: 'Sneha Gupta',
    customer_phone: '+91 98490 55667',
    product_name: 'Custom Printed T-Shirt',
    quantity: 2,
    selling_price: 2598,
    product_cost: 760,
    printing_cost: 440,
    tshirt_rapido_cost: 60,
    print_rapido_cost: 60,
    delivery_cost: 120,
    other_cost: 30,
    total_cost: 1350,
    profit: 1248,
    profit_margin: 48.0,
    payment_status: 'PAID',
    payment_received: 2598,
    available_amount: 1248,
    is_tshirt: 1,
    tshirt_neck_type: 'Round Neck',
    tshirt_fabric: 'Nano Curve',
    tshirt_size: 'S',
    tshirt_size_breakdown: 'S: 2',
    tshirt_color: 'Black',
    tshirt_print_type: 'Front Print',
    print_meters: 0.8,
    print_rate_per_meter: 300,
    has_id_cards: 0,
    order_date: '2026-09-06',
    created_by_name: 'Rajshekar Reddy',
    created_by: 'usr-rajshekar-2'
  },
  {
    id: 'ord-6',
    order_number: 'ORD-2026-0006',
    customer_id: 'cust-6',
    customer_name: 'Karthik Iyer',
    customer_phone: '+91 98490 66778',
    product_name: 'Custom Printed T-Shirt',
    quantity: 15,
    selling_price: 9800,
    product_cost: 3300,
    printing_cost: 2100,
    tshirt_rapido_cost: 140,
    print_rapido_cost: 110,
    delivery_cost: 250,
    other_cost: 80,
    total_cost: 5730,
    profit: 4070,
    profit_margin: 41.5,
    payment_status: 'PAID',
    payment_received: 9800,
    available_amount: 4070,
    is_tshirt: 1,
    tshirt_neck_type: 'Collar',
    tshirt_fabric: 'Cotton',
    tshirt_size: 'Custom',
    tshirt_size_breakdown: 'S: 3, M: 6, L: 4, XL: 2',
    tshirt_color: 'Royal Blue',
    tshirt_print_type: 'Front & Back',
    print_meters: 2.5,
    print_rate_per_meter: 300,
    has_id_cards: 1,
    id_card_quantity: 15,
    id_card_unit_price: 70,
    id_card_unit_cost: 35,
    id_card_selling_price: 1050,
    id_card_cost: 525,
    id_card_profit: 525,
    order_date: '2026-09-07',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1'
  }
];

const INITIAL_INVOICES: MockInvoice[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-2026-0001',
    customer_id: 'cust-1',
    customer_name: 'Rahul Sharma',
    issue_date: '2026-09-02',
    due_date: '2026-09-12',
    subtotal: 6500,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 6500,
    amount_paid: 6500,
    balance_due: 0,
    status: 'PAID',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1',
    items: [
      { description: 'Custom Collar T-Shirts (Poly Cotton, Front & Back)', quantity: 10, unit_price: 580, amount: 5800 },
      { description: 'Custom College ID Cards with Lanyards', quantity: 10, unit_price: 70, amount: 700 }
    ]
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-2026-0002',
    customer_id: 'cust-2',
    customer_name: 'Priya Patel',
    issue_date: '2026-09-03',
    due_date: '2026-09-13',
    subtotal: 4800,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 4800,
    amount_paid: 4800,
    balance_due: 0,
    status: 'PAID',
    created_by_name: 'Rajshekar Reddy',
    created_by: 'usr-rajshekar-2',
    items: [
      { description: 'Custom Round Neck Pure Cotton T-Shirts (White, M)', quantity: 4, unit_price: 1200, amount: 4800 }
    ]
  },
  {
    id: 'inv-3',
    invoice_number: 'INV-2026-0003',
    customer_id: 'cust-3',
    customer_name: 'Vikram Malhotra',
    issue_date: '2026-09-04',
    due_date: '2026-09-14',
    subtotal: 3600,
    tax_rate: 0,
    tax_amount: 0,
    grand_total: 3600,
    amount_paid: 2000,
    balance_due: 1600,
    status: 'PARTIAL',
    created_by_name: 'Jashwanth Reddy',
    created_by: 'usr-jashwanth-1',
    items: [
      { description: '12x18 Inch Matte Finish Premium Photo Frame', quantity: 2, unit_price: 1800, amount: 3600 }
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
    description: 'Bulk Blank Premium Cotton T-Shirts S/M/L/XL Roll',
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

class MockDatabase {
  customers: MockCustomer[] = [];
  orders: MockOrder[] = [];
  invoices: MockInvoice[] = [];
  expenses: MockExpense[] = [];
  currentUser: any = PARTNER_1;

  constructor() {
    this.load();
  }

  load() {
    try {
      const stored = localStorage.getItem('infinity_mock_db_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.customers = parsed.customers || INITIAL_CUSTOMERS;
        this.orders = parsed.orders || INITIAL_ORDERS;
        this.invoices = parsed.invoices || INITIAL_INVOICES;
        this.expenses = parsed.expenses || INITIAL_EXPENSES;
        return;
      }
    } catch {
      // ignore
    }
    this.customers = [...INITIAL_CUSTOMERS];
    this.orders = [...INITIAL_ORDERS];
    this.invoices = [...INITIAL_INVOICES];
    this.expenses = [...INITIAL_EXPENSES];
    this.save();
  }

  save() {
    try {
      localStorage.setItem('infinity_mock_db_v2', JSON.stringify({
        customers: this.customers,
        orders: this.orders,
        invoices: this.invoices,
        expenses: this.expenses
      }));
    } catch {
      // ignore
    }
  }

  reset() {
    this.customers = [...INITIAL_CUSTOMERS];
    this.orders = [...INITIAL_ORDERS];
    this.invoices = [...INITIAL_INVOICES];
    this.expenses = [...INITIAL_EXPENSES];
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
    const totalOrders = mockDb.orders.length;
    const totalRevenue = mockDb.orders.reduce((sum, o) => sum + (o.selling_price || 0), 0);
    const totalCosts = mockDb.orders.reduce((sum, o) => sum + (o.total_cost || 0), 0);
    const netProfit = totalRevenue - totalCosts;
    const totalAvailable = mockDb.orders.reduce((sum, o) => sum + (o.available_amount || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Partner rules: Rajshekar has share ONLY in T-Shirts, ID Cards, Caps
    const sharedProfit = mockDb.orders
      .filter(o => o.is_tshirt === 1 || o.product_name.includes('Cap') || o.has_id_cards === 1)
      .reduce((sum, o) => sum + (o.profit || 0), 0);
    const soleProfit = netProfit - sharedProfit;
    const jashwanthProfit = Math.round(sharedProfit * 0.5) + soleProfit;
    const rajshekarProfit = Math.round(sharedProfit * 0.5);

    return jsonResponse({
      revenue: totalRevenue,
      totalCosts,
      netProfit,
      totalOrders,
      totalAvailable,
      profitMargin: Number(profitMargin),
      margin: Number(profitMargin),
      partnerAllocations: {
        jashwanth: { totalProfit: jashwanthProfit, sharedProfit: Math.round(sharedProfit * 0.5), soleProfit },
        rajshekar: { totalProfit: rajshekarProfit, sharedProfit: rajshekarProfit, soleProfit: 0 }
      },
      partner1Share: jashwanthProfit,
      partner2Share: rajshekarProfit,
      recentOrders: mockDb.orders.slice(0, 5),
      tshirtAnalytics: {
        totalSold: mockDb.orders.filter(o => o.is_tshirt).reduce((sum, o) => sum + o.quantity, 0),
        revenue: mockDb.orders.filter(o => o.is_tshirt).reduce((sum, o) => sum + o.selling_price, 0),
        profit: mockDb.orders.filter(o => o.is_tshirt).reduce((sum, o) => sum + o.profit, 0)
      }
    });
  }

  // 6. Orders
  if (pathname === '/api/orders') {
    if (method === 'POST') {
      const isTshirt = body.is_tshirt === 1 || (body.product_name && body.product_name.toLowerCase().includes('t-shirt'));
      const selling = Number(body.selling_price || 0);
      const prodCost = Number(body.product_cost || 0);
      const printCost = Number(body.printing_cost || 0);
      const tshirtRapido = Number(body.tshirt_rapido_cost || 0);
      const printRapido = Number(body.print_rapido_cost || 0);
      const delCost = Number(body.delivery_cost || (tshirtRapido + printRapido) || 0);
      const otherCost = Number(body.other_cost || 0);
      const totalCost = prodCost + printCost + delCost + otherCost;
      const profit = selling - totalCost;
      const margin = selling > 0 ? Number(((profit / selling) * 100).toFixed(1)) : 0;
      const received = body.payment_status === 'PAID' ? selling : Number(body.payment_received || 0);
      const available = received - totalCost;

      const newOrder: MockOrder = {
        id: `ord-${Date.now()}`,
        order_number: `ORD-2026-${String(mockDb.orders.length + 1).padStart(4, '0')}`,
        customer_id: body.customer_id || 'cust-1',
        customer_name: body.customer_name || 'Walk-in Customer',
        customer_phone: body.customer_phone || '+91 98000 00000',
        product_name: body.product_name || 'Custom Printed T-Shirt',
        quantity: Number(body.quantity || 1),
        selling_price: selling,
        product_cost: prodCost,
        printing_cost: printCost,
        tshirt_rapido_cost: tshirtRapido,
        print_rapido_cost: printRapido,
        delivery_cost: delCost,
        other_cost: otherCost,
        total_cost: totalCost,
        profit,
        profit_margin: margin,
        payment_status: body.payment_status || (received >= selling ? 'PAID' : received > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
        payment_received: received,
        available_amount: available,
        is_tshirt: isTshirt ? 1 : 0,
        tshirt_neck_type: body.tshirt_neck_type || 'Round Neck',
        tshirt_fabric: body.tshirt_fabric || 'Pure Cotton',
        tshirt_size: body.tshirt_size || 'L',
        tshirt_size_breakdown: body.tshirt_size_breakdown || '',
        tshirt_color: body.tshirt_color || 'Black',
        tshirt_print_type: body.tshirt_print_type || 'Front Print',
        print_meters: Number(body.print_meters || 0),
        print_rate_per_meter: Number(body.print_rate_per_meter || 300),
        has_id_cards: body.has_id_cards ? 1 : 0,
        id_card_quantity: Number(body.id_card_quantity || 0),
        id_card_unit_price: Number(body.id_card_unit_price || 70),
        id_card_unit_cost: Number(body.id_card_unit_cost || 35),
        id_card_selling_price: Number(body.id_card_selling_price || 0),
        id_card_cost: Number(body.id_card_cost || 0),
        id_card_profit: Number(body.id_card_profit || 0),
        order_date: new Date().toISOString().split('T')[0],
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id
      };

      mockDb.orders.unshift(newOrder);

      // Also create an invoice for this order automatically
      const newInvoice: MockInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-2026-${String(mockDb.invoices.length + 1).padStart(4, '0')}`,
        customer_id: newOrder.customer_id,
        customer_name: newOrder.customer_name,
        issue_date: newOrder.order_date,
        due_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        subtotal: selling,
        tax_rate: 0,
        tax_amount: 0,
        grand_total: selling,
        amount_paid: received,
        balance_due: selling - received,
        status: received >= selling ? 'PAID' : received > 0 ? 'PARTIAL' : 'SENT',
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        items: [
          {
            description: `${newOrder.product_name} (${newOrder.tshirt_neck_type || ''} ${newOrder.tshirt_fabric || ''})`.trim(),
            quantity: newOrder.quantity,
            unit_price: selling / newOrder.quantity,
            amount: selling
          }
        ]
      };
      mockDb.invoices.unshift(newInvoice);

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

  // Single Order
  if (pathname.startsWith('/api/orders/')) {
    const parts = pathname.split('/');
    const orderId = parts[3];
    const order = mockDb.orders.find(o => o.id === orderId || o.order_number === orderId) || mockDb.orders[0];
    return jsonResponse(order);
  }

  // 7. Invoices
  if (pathname === '/api/invoices') {
    if (method === 'POST') {
      const newInv: MockInvoice = {
        id: `inv-${Date.now()}`,
        invoice_number: `INV-2026-${String(mockDb.invoices.length + 1).padStart(4, '0')}`,
        customer_id: body.customer_id || 'cust-1',
        customer_name: body.customer_name || 'Customer',
        issue_date: body.issue_date || new Date().toISOString().split('T')[0],
        due_date: body.due_date || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
        subtotal: Number(body.subtotal || body.grand_total || 0),
        tax_rate: Number(body.tax_rate || 0),
        tax_amount: Number(body.tax_amount || 0),
        grand_total: Number(body.grand_total || body.subtotal || 0),
        amount_paid: Number(body.amount_paid || 0),
        balance_due: Number(body.grand_total || 0) - Number(body.amount_paid || 0),
        status: (body.amount_paid >= body.grand_total) ? 'PAID' : (body.amount_paid > 0) ? 'PARTIAL' : 'SENT',
        created_by_name: mockDb.currentUser.full_name,
        created_by: mockDb.currentUser.id,
        items: body.items || []
      };
      mockDb.invoices.unshift(newInv);
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
    const inv = mockDb.invoices.find(i => i.id === invId || i.invoice_number === invId) || mockDb.invoices[0];
    return jsonResponse(inv);
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
    const totalRev = mockDb.orders.reduce((s, o) => s + o.selling_price, 0);
    const totalCost = mockDb.orders.reduce((s, o) => s + o.total_cost, 0);
    const grossProfit = totalRev - totalCost;
    const expTotal = mockDb.expenses.reduce((s, o) => s + o.amount, 0);
    const netProfit = grossProfit - expTotal;

    const tOrders = mockDb.orders.filter(o => o.is_tshirt === 1);
    const sharedProfit = tOrders.reduce((s, o) => s + o.profit, 0);
    const soleProfit = grossProfit - sharedProfit;

    const jashwanthShared = Math.round(sharedProfit * 0.5);
    const jashwanthSole = soleProfit;
    const jashwanthTotal = jashwanthShared + jashwanthSole;
    const rajshekarTotal = Math.round(sharedProfit * 0.5);

    return jsonResponse({
      revenue: { salesRevenue: totalRev, otherIncome: 0, totalRevenue: totalRev },
      expenses: { categories: mockDb.expenses, totalExpenses: expTotal },
      netProfit,
      profitMargin: totalRev > 0 ? Number(((netProfit / totalRev) * 100).toFixed(1)) : 0,
      partnerAllocation: {
        sharedCategoryProfit: sharedProfit,
        soleCategoryProfit: soleProfit,
        jashwanth: { totalProfit: jashwanthTotal, sharedProfit: jashwanthShared, soleProfit: jashwanthSole },
        rajshekar: { totalProfit: rajshekarTotal, sharedProfit: rajshekarTotal, soleProfit: 0 }
      },
      itemized: [
        { product_name: 'Custom Printed T-Shirt', is_tshirt: 1, orders_count: tOrders.length, items_sold: tOrders.reduce((s, o) => s + o.quantity, 0), revenue: tOrders.reduce((s, o) => s + o.selling_price, 0), total_cost: tOrders.reduce((s, o) => s + o.total_cost, 0), profit: sharedProfit, margin_pct: 42.5 },
        { product_name: 'Photo Frame', is_tshirt: 0, orders_count: 1, items_sold: 2, revenue: 3600, total_cost: 2000, profit: 1600, margin_pct: 44.4 },
        { product_name: 'Bouquet', is_tshirt: 0, orders_count: 1, items_sold: 2, revenue: 2598, total_cost: 1350, profit: 1248, margin_pct: 48.0 }
      ]
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
