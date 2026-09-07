export interface User {
  id: string;
  email: string;
  full_name: string;
  fullName?: string;
  phone?: string;
  avatar_url?: string;
  role: 'OWNER' | 'PARTNER' | 'ACCOUNTANT' | 'STAFF';
  partner_share_percentage?: number;
  business_id: string;
  business_name?: string;
  currency_symbol?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  category: string;
  email: string;
  phone: string;
  currency: string;
  currency_symbol: string;
  address: string;
  gstin?: string;
}

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  total_purchases: number;
  total_paid: number;
  outstanding_balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  last_purchase?: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' | 'CANCELLED';
  notes?: string;
  terms?: string;
  created_by: string;
  created_by_name: string;
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface Expense {
  id: string;
  expense_number: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  vendor: string;
  date: string;
  notes?: string;
  receipt_url?: string;
  receipt_name?: string;
  status: 'ACTIVE' | 'VOID' | 'REVERSED';
  created_by: string;
  created_by_name: string;
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_number: string;
  customer_id?: string;
  customer_name?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount: number;
  method: string;
  date: string;
  reference_number?: string;
  account_id?: string;
  notes?: string;
  status: 'COMPLETED' | 'VOID' | 'REVERSED';
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
}

export interface CashAccount {
  id: string;
  account_name: string;
  account_type: 'CASH' | 'BANK' | 'UPI' | 'SAVINGS';
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  initial_balance: number;
  current_balance: number;
  is_default: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
  category: string;
  description: string;
  partner: string;
  actorId: string;
  paymentMethod: string;
  status: string;
  income: number | null;
  expense: number | null;
  amount: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityReference?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  actor_name: string;
  title: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

export interface TShirtVariant {
  id: string;
  neckType: 'Round Neck' | 'Collar';
  fabric: 'Pure Cotton' | 'Cotton' | 'Poly Cotton' | 'Nano Curve';
  color: string;
  sizes: { S: number; M: number; L: number; XL: number; XXL: number };
  quantity: number;
  unitBlankCost: number;
  unitSellingPrice: number;
}

export interface Order {
  id: string;
  business_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  selling_price: number;
  payment_received: number;
  payment_pending: number;
  product_cost: number;
  printing_cost: number;
  delivery_cost: number;
  other_cost: number;
  total_cost: number;
  profit: number;
  profit_margin: number;
  available_amount: number;
  payment_status: 'PAID' | 'PARTIALLY_PAID' | 'PENDING';
  order_status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  order_date: string;
  notes?: string;
  created_by: string;
  created_by_name: string;
  is_tshirt: number;
  tshirt_size?: string;
  tshirt_color?: string;
  tshirt_size_breakdown?: string;
  print_meters?: number;
  print_rate_per_meter?: number;
  tshirt_rapido_cost?: number;
  print_rapido_cost?: number;
  tshirt_print_type?: string;
  tshirt_front_print?: number;
  tshirt_back_print?: number;
  tshirt_sleeve_print?: number;
  tshirt_design_notes?: string;
  tshirt_neck_type?: 'Round Neck' | 'Collar';
  tshirt_fabric?: 'Pure Cotton' | 'Cotton' | 'Poly Cotton' | 'Nano Curve';
  tshirt_variants?: string;
  has_id_cards?: number;
  id_card_quantity?: number;
  id_card_type?: string;
  id_card_unit_cost?: number;
  id_card_unit_price?: number;
  id_card_total_cost?: number;
  id_card_total_price?: number;
  is_partner_shared?: number;
  partner_share_allocation?: {
    isShared: boolean;
    categoryTag: string;
    scopeLabel: string;
    jashwanthShare: number;
    rajshekarShare: number;
    jashwanthPercentage: number;
    rajshekarPercentage: number;
    explanation: string;
  };
  invoice_id?: string;
  invoice_number?: string;
  created_at: string;
  updated_at?: string;
  items?: any[];
  payments?: any[];
}
