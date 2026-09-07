import { Router, Response } from 'express';
import { query } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/search - Global search across Orders, Customers, Invoices, Products
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const q = req.query.q as string;

    if (!q || q.trim().length < 2) {
      res.json({ orders: [], customers: [], invoices: [], products: [] });
      return;
    }

    const searchTerm = `%${q.trim()}%`;

    // 1. Search Orders
    const orders = await query<any>(
      `SELECT id, order_number, customer_name, customer_phone, product_name, quantity, selling_price, profit, payment_status, order_date
       FROM orders
       WHERE business_id = ? AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR product_name LIKE ? OR notes LIKE ?)
       LIMIT 8`,
      [businessId, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    // 2. Search Customers
    const customers = await query<any>(
      `SELECT id, customer_code, name, phone, email, total_orders, total_spent, outstanding_balance
       FROM customers
       WHERE business_id = ? AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)
       LIMIT 8`,
      [businessId, searchTerm, searchTerm, searchTerm]
    );

    // 3. Search Invoices
    const invoices = await query<any>(
      `SELECT id, invoice_number, customer_name, customer_phone, grand_total, amount_paid, balance_due, status, issue_date
       FROM invoices
       WHERE business_id = ? AND (invoice_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)
       LIMIT 8`,
      [businessId, searchTerm, searchTerm, searchTerm]
    );

    // 4. Search Products
    const products = await query<any>(
      `SELECT id, name, category, default_selling_price, default_product_cost, default_printing_cost
       FROM products
       WHERE business_id = ? AND (name LIKE ? OR category LIKE ?)
       LIMIT 8`,
      [businessId, searchTerm, searchTerm]
    );

    res.json({ orders, customers, invoices, products });
  } catch (error) {
    console.error('Error in global search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
