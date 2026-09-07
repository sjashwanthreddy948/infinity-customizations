import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/customers - List all customers with search and stats
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { search } = req.query;

    let sql = `
      SELECT
        c.*,
        (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'CANCELLED') as active_orders_count,
        (SELECT COALESCE(SUM(selling_price), 0) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'CANCELLED') as calculated_spent,
        (SELECT COALESCE(SUM(payment_received), 0) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'CANCELLED') as calculated_paid,
        (SELECT COALESCE(SUM(payment_pending), 0) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'CANCELLED') as calculated_pending,
        (SELECT COALESCE(SUM(profit), 0) FROM orders o WHERE o.customer_id = c.id AND o.order_status != 'CANCELLED') as calculated_profit
      FROM customers c
      WHERE c.business_id = ?
    `;
    const params: any[] = [businessId];

    if (search) {
      sql += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.address LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ` ORDER BY c.name ASC`;
    const customers = await query(sql, params);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/customers/:id - Customer profile with full order history and invoice history
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const customerId = req.params.id as string;

    const customer = await get<any>(
      `SELECT * FROM customers WHERE id = ? AND business_id = ?`,
      [customerId, businessId]
    );

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    // Orders history
    const orders = await query(
      `SELECT * FROM orders WHERE customer_id = ? AND business_id = ? ORDER BY order_date DESC, created_at DESC`,
      [customerId, businessId]
    );

    // Invoices history
    const invoices = await query(
      `SELECT * FROM invoices WHERE customer_id = ? AND business_id = ? ORDER BY issue_date DESC, created_at DESC`,
      [customerId, businessId]
    );

    // Payments history
    const payments = await query(
      `SELECT * FROM payments WHERE customer_id = ? AND business_id = ? ORDER BY date DESC, created_at DESC`,
      [customerId, businessId]
    );

    // Calculate aggregated totals directly from non-cancelled orders for 100% accuracy
    const totals = await get<any>(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(selling_price), 0) as total_spent,
        COALESCE(SUM(payment_received), 0) as total_paid,
        COALESCE(SUM(payment_pending), 0) as outstanding_balance,
        COALESCE(SUM(profit), 0) as total_profit_generated
       FROM orders
       WHERE customer_id = ? AND business_id = ? AND order_status != 'CANCELLED'`,
      [customerId, businessId]
    );

    res.json({
      ...customer,
      total_orders: totals?.total_orders || 0,
      total_spent: totals?.total_spent || 0,
      total_paid: totals?.total_paid || 0,
      outstanding_balance: totals?.outstanding_balance || 0,
      total_profit_generated: totals?.total_profit_generated || 0,
      orders,
      invoices,
      payments
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

/**
 * POST /api/customers - Add customer manually
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      res.status(400).json({ error: 'Name and phone are required' });
      return;
    }

    const customerId = uuidv4();
    const countRes = await get<any>(`SELECT COUNT(*) as count FROM customers WHERE business_id = ?`, [businessId]);
    const customerCode = `CUST-${((countRes?.count || 0) + 1).toString().padStart(4, '0')}`;

    await run(
      `INSERT INTO customers (id, business_id, customer_code, name, phone, email, address, total_orders, total_spent, total_paid, outstanding_balance, total_profit_generated, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 'ACTIVE', datetime('now'))`,
      [customerId, businessId, customerCode, name.trim(), phone.trim(), email || null, address || null]
    );

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customerId,
      entityReference: name,
      reason: 'Customer added manually'
    });

    const newCustomer = await get(`SELECT * FROM customers WHERE id = ?`, [customerId]);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error adding customer:', error);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

/**
 * PUT /api/customers/:id - Update customer profile
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const customerId = req.params.id as string;
    const { name, phone, email, address } = req.body;

    const existing = await get<any>(`SELECT * FROM customers WHERE id = ? AND business_id = ?`, [customerId, businessId]);
    if (!existing) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    await run(
      `UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND business_id = ?`,
      [name || existing.name, phone || existing.phone, email || null, address || null, customerId, businessId]
    );

    const updated = await get(`SELECT * FROM customers WHERE id = ?`, [customerId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
