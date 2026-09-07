import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get, run } from '../db/index.js';
import { logAudit } from '../services/auditService.js';
import { recordFinancialTransaction } from '../services/transactionService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

// List sales
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let sql = `SELECT * FROM sales WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (status && status !== 'ALL') {
      sql += ` AND payment_status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (sale_number LIKE ? OR customer_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY date DESC, created_at DESC`;
    const sales = await query<any>(sql, params);

    res.json(sales.map(s => ({
      ...s,
      subtotal: Math.round(s.subtotal / 100),
      discount: Math.round(s.discount / 100),
      tax_amount: Math.round(s.tax_amount / 100),
      grand_total: Math.round(s.grand_total / 100),
      amount_paid: Math.round(s.amount_paid / 100),
      balance_due: Math.round(s.balance_due / 100)
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Get single sale details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = req.businessId!;

    const sale = await get<any>(
      `SELECT * FROM sales WHERE id = ? AND business_id = ?`,
      [id, businessId]
    );

    if (!sale) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }

    const items = await query<any>(
      `SELECT * FROM sale_items WHERE sale_id = ?`,
      [id]
    );

    res.json({
      ...sale,
      subtotal: Math.round(sale.subtotal / 100),
      discount: Math.round(sale.discount / 100),
      tax_amount: Math.round(sale.tax_amount / 100),
      grand_total: Math.round(sale.grand_total / 100),
      amount_paid: Math.round(sale.amount_paid / 100),
      balance_due: Math.round(sale.balance_due / 100),
      items: items.map(i => ({
        ...i,
        unit_price: Math.round(i.unit_price / 100),
        total: Math.round(i.total / 100)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sale details' });
  }
});

// Record new sale
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const {
      customerId,
      date,
      paymentMethod = 'UPI',
      paymentStatus = 'PAID',
      items,
      notes = '',
      accountId
    } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Customer and items are required' });
      return;
    }

    const customer = await get<any>(
      `SELECT * FROM customers WHERE id = ? AND business_id = ?`,
      [customerId, businessId]
    );

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const saleNumber = `SALE-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const saleId = uuidv4();
    const now = new Date().toISOString();
    const saleDate = date || now.split('T')[0];

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const processedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const unitPricePaise = Math.round(Number(it.unit_price) * 100);
      const discountPct = Number(it.discount) || 0;
      const taxPct = Number(it.tax_rate) || 0;

      const rawAmount = qty * unitPricePaise;
      const discAmt = Math.round(rawAmount * (discountPct / 100));
      const taxable = rawAmount - discAmt;
      const taxAmt = Math.round(taxable * (taxPct / 100));
      const itemTotal = taxable + taxAmt;

      subtotal += rawAmount;
      totalDiscount += discAmt;
      totalTax += taxAmt;

      return {
        id: uuidv4(),
        productId: it.productId || null,
        description: it.description,
        quantity: qty,
        unit_price: unitPricePaise,
        discount: discountPct,
        tax_rate: taxPct,
        total: itemTotal
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax;
    const amountPaid = paymentStatus === 'PAID' ? grandTotal : (paymentStatus === 'PARTIAL' ? Math.round(grandTotal / 2) : 0);
    const balanceDue = grandTotal - amountPaid;

    // Insert Sale
    await run(
      `INSERT INTO sales (
        id, business_id, sale_number, customer_id, customer_name, subtotal, discount,
        tax_amount, grand_total, amount_paid, balance_due, payment_status, payment_method,
        date, notes, created_by, created_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleId, businessId, saleNumber, customer.id, customer.name, subtotal, totalDiscount,
        totalTax, grandTotal, amountPaid, balanceDue, paymentStatus, paymentMethod,
        saleDate, notes, user.id, user.full_name, now
      ]
    );

    // Insert Sale Items
    for (const item of processedItems) {
      await run(
        `INSERT INTO sale_items (id, sale_id, product_id, description, quantity, unit_price, discount, tax_rate, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, saleId, item.productId, item.description, item.quantity, item.unit_price, item.discount, item.tax_rate, item.total]
      );
    }

    // Update Customer statistics
    await run(
      `UPDATE customers 
       SET total_purchases = total_purchases + ?, total_paid = total_paid + ?, outstanding_balance = outstanding_balance + ?
       WHERE id = ? AND business_id = ?`,
      [grandTotal, amountPaid, balanceDue, customer.id, businessId]
    );

    // If paid or partial paid, record transaction and update cash/bank
    if (amountPaid > 0) {
      let targetAccountId = accountId;
      if (!targetAccountId) {
        const defAcc = await get<any>(
          `SELECT id FROM cash_accounts WHERE business_id = ? ORDER BY is_default DESC LIMIT 1`,
          [businessId]
        );
        targetAccountId = defAcc?.id || null;
      }

      await recordFinancialTransaction({
        businessId,
        type: 'INCOME',
        category: 'Sales Revenue',
        description: `Sale ${saleNumber} to ${customer.name}`,
        amount: amountPaid,
        paymentMethod,
        accountId: targetAccountId,
        referenceType: 'SALE',
        referenceId: saleId,
        actorId: user.id,
        actorName: user.full_name,
        date: saleDate
      });
    }

    // Audit Log
    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'CREATE',
      entityType: 'SALE',
      entityId: saleId,
      entityReference: saleNumber,
      reason: `Recorded direct sale to ${customer.name} totaling ₹${(grandTotal / 100).toLocaleString('en-IN')}`,
      newValue: { saleNumber, customer: customer.name, grandTotal: grandTotal / 100 }
    });

    // Notify Partner
    await createNotification({
      businessId,
      actorName: user.full_name,
      title: 'New Sale Recorded',
      message: `${user.full_name} recorded sale ${saleNumber} for ${customer.name} (₹${(grandTotal / 100).toLocaleString('en-IN')})`,
      type: 'FINANCIAL',
      entityType: 'SALE',
      entityId: saleId
    });

    res.status(201).json({
      id: saleId,
      sale_number: saleNumber,
      grand_total: Math.round(grandTotal / 100),
      balance_due: Math.round(balanceDue / 100),
      payment_status: paymentStatus
    });
  } catch (err: any) {
    console.error('Create sale error:', err);
    res.status(500).json({ error: 'Failed to record sale' });
  }
});

export default router;
