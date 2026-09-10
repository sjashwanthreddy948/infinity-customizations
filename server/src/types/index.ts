import { Request } from 'express';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'OWNER' | 'PARTNER' | 'ACCOUNTANT' | 'STAFF' | 'ADMIN';
  partner_share_percentage: number;
  joined_at: string;
  status: string;
  user?: User;
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
  created_at: string;
}

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  full_name: string;
  fullName: string;
  role: 'OWNER' | 'PARTNER' | 'ACCOUNTANT' | 'STAFF' | 'ADMIN';
  business_id: string;
  business_name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  businessId?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  customer_code: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  total_purchases: number; // in paise (₹1 = 100 paise)
  total_paid: number;
  outstanding_balance: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Product {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  unit_price: number; // paise
  tax_rate: number;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  rate: number; // paise
  discount: number; // percentage
  tax_rate: number; // percentage
  amount: number; // paise
}

export interface Invoice {
  id: string;
  business_id: string;
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
  payment_method?: string;
  notes?: string;
  terms?: string;
  created_by: string;
  created_by_name: string;
  void_reason?: string;
  voided_by?: string;
  voided_at?: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface Expense {
  id: string;
  business_id: string;
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
  updated_at: string;
}

export interface Payment {
  id: string;
  business_id: string;
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
  business_id: string;
  account_name: string;
  account_type: 'CASH' | 'BANK' | 'UPI' | 'SAVINGS';
  account_number?: string;
  bank_name?: string;
  ifsc_code?: string;
  initial_balance: number;
  current_balance: number;
  is_default: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  transaction_number: string;
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'ADJUSTMENT';
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  account_id?: string;
  to_account_id?: string;
  reference_type?: string;
  reference_id?: string;
  actor_id: string;
  actor_name: string;
  status: 'COMPLETED' | 'VOID' | 'REVERSED';
  created_at: string;
}

export interface AuditLog {
  id: string;
  business_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_reference?: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
  ip_address?: string;
  created_at: string;
}
