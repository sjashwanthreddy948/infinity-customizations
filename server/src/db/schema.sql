-- INFINITY CUSTOMIZATIONS Database Schema
-- Business Management & Smart Invoice System
-- Compatible with SQLite and PostgreSQL

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Partnership',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  address TEXT NOT NULL,
  gstin TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'PARTNER', -- 'OWNER', 'PARTNER'
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  avatar_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS business_members (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PARTNER',
  partner_share_percentage REAL DEFAULT 50.0,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(business_id, user_id)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  total_paid INTEGER NOT NULL DEFAULT 0,
  outstanding_balance INTEGER NOT NULL DEFAULT 0,
  total_profit_generated INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_selling_price INTEGER NOT NULL DEFAULT 0,
  default_product_cost INTEGER NOT NULL DEFAULT 0,
  default_printing_cost INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selling_price INTEGER NOT NULL DEFAULT 0, -- Customer Total (in rupees)
  payment_received INTEGER NOT NULL DEFAULT 0,
  payment_pending INTEGER NOT NULL DEFAULT 0,
  product_cost INTEGER NOT NULL DEFAULT 0,
  printing_cost INTEGER NOT NULL DEFAULT 0,
  delivery_cost INTEGER NOT NULL DEFAULT 0, -- Rapido/delivery cost
  other_cost INTEGER NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL DEFAULT 0, -- Product + Printing + Delivery + Other
  profit INTEGER NOT NULL DEFAULT 0, -- Customer Total - Total Cost
  profit_margin REAL NOT NULL DEFAULT 0, -- Profit / Customer Total * 100
  available_amount INTEGER NOT NULL DEFAULT 0, -- Payment Received - Total Cost
  payment_status TEXT NOT NULL DEFAULT 'PENDING', -- 'PAID', 'PARTIALLY_PAID', 'PENDING'
  order_status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  order_date TEXT NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  -- T-Shirt Specific Fields
  is_tshirt INTEGER NOT NULL DEFAULT 0,
  tshirt_size TEXT, -- S, M, L, XL, XXL
  tshirt_color TEXT, -- Black, White, Navy, etc.
  tshirt_size_breakdown TEXT, -- JSON string: {"S":2,"M":5,"L":8,"XL":0,"XXL":0}
  print_meters REAL DEFAULT 0, -- Printing measured in meters
  print_rate_per_meter INTEGER DEFAULT 300, -- Rate per meter in rupees (default 300)
  tshirt_rapido_cost INTEGER DEFAULT 0, -- Rapido cost for picking up blank T-shirts
  print_rapido_cost INTEGER DEFAULT 0, -- Rapido cost for printing pickup/delivery
  tshirt_print_type TEXT, -- Front Print, Back Print, Sleeve Print, Custom Design
  tshirt_front_print INTEGER NOT NULL DEFAULT 0,
  tshirt_back_print INTEGER NOT NULL DEFAULT 0,
  tshirt_sleeve_print INTEGER NOT NULL DEFAULT 0,
  tshirt_design_notes TEXT,
  tshirt_neck_type TEXT DEFAULT 'Round Neck', -- Round Neck, Collar
  tshirt_fabric TEXT DEFAULT 'Pure Cotton', -- Pure Cotton, Cotton, Poly Cotton, Nano Curve
  tshirt_variants TEXT, -- JSON array of variant objects with individual neck, fabric, color, sizes & costs
  -- ID Card Add-on Fields
  has_id_cards INTEGER NOT NULL DEFAULT 0,
  id_card_quantity INTEGER NOT NULL DEFAULT 0,
  id_card_type TEXT,
  id_card_unit_cost INTEGER NOT NULL DEFAULT 0,
  id_card_unit_price INTEGER NOT NULL DEFAULT 0,
  id_card_total_cost INTEGER NOT NULL DEFAULT 0,
  id_card_total_price INTEGER NOT NULL DEFAULT 0,
  is_partner_shared INTEGER NOT NULL DEFAULT 1, -- 1 for T-Shirts, ID Cards, Caps (Shared); 0 for Bouquets, Frames, Mugs, Gifts (Sole)
  -- Invoice Linking
  invoice_id TEXT,
  invoice_number TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  grand_total INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  balance_due INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PAID', -- 'PAID', 'PARTIALLY_PAID', 'PENDING', 'CANCELLED'
  payment_method TEXT,
  notes TEXT,
  terms TEXT,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  rate INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  payment_number TEXT NOT NULL,
  order_id TEXT,
  invoice_id TEXT,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'UPI', -- 'UPI', 'Cash', 'Bank Transfer', 'Card'
  date TEXT NOT NULL,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  expense_number TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Printing', 'Rapido', 'Materials', 'Packaging', 'Electricity', 'Rent', 'Marketing', 'Other'
  description TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  date TEXT NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'VOID'
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'VOID', 'PAYMENT_RECORDED', 'INVOICE_GENERATED'
  entity_type TEXT NOT NULL, -- 'order', 'invoice', 'expense', 'customer', 'product'
  entity_id TEXT NOT NULL,
  entity_reference TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- INDEXES for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_business ON audit_logs(business_id);
