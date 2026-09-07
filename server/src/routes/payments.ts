import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { AuthenticatedRequest } from '../types/index.js';
import { query, get, run } from '../db/index.js';
import { logAudit } from '../services/auditService.js';
import { recordFinancialTransaction } from '../services/transactionService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

// List payments
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const method = req.query.method as string;
    const search = req.query.search as string;

    let sql = `SELECT * FROM payments WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (method && method !== 'ALL') {
      sql += ` AND method = ?`;
      params.push(method);
    }

    if (search) {
      sql += ` AND (customer_name LIKE ? OR invoice_number LIKE ? OR payment_number LIKE ? OR reference_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY date DESC, created_at DESC`;
    const payments = await query<any>(sql, params);

    res.json(payments.map(p => ({
      ...p,
      amount: Math.round(p.amount / 100)
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Record standalone or customer payment
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const businessId = req.businessId!;
    const user = req.user!;
    const {
      customerId,
      invoiceId,
      amount,
      method = 'UPI',
      date,
      referenceNumber = '',
      notes = '',
      accountId
    } = req.body;

    const amountPaise = Math.round(Number(amount) * 100);
    if (!amountPaise || amountPaise <= 0) {
      res.status(400).json({ error: 'Valid payment amount is required' });
      return;
    }

    let customerName = 'Direct Customer';
    let invoiceNumber = null;
    let inv = null;

    if (invoiceId) {
      inv = await get<any>(
        `SELECT * FROM invoices WHERE id = ? AND business_id = ?`,
        [invoiceId, businessId]
      );
      if (inv) {
        customerName = inv.customer_name;
        invoiceNumber = inv.invoice_number;
      }
    } else if (customerId) {
      const cust = await get<any>(
        `SELECT name FROM customers WHERE id = ? AND business_id = ?`,
        [customerId, businessId]
      );
      if (cust) customerName = cust.name;
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const paymentId = uuidv4();
    const now = new Date().toISOString();
    const payDate = date || now.split('T')[0];

    let targetAccountId = accountId;
    if (!targetAccountId) {
      const defAcc = await get<any>(
        `SELECT id FROM cash_accounts WHERE business_id = ? ORDER BY is_default DESC LIMIT 1`,
        [businessId]
      );
      targetAccountId = defAcc?.id || null;
    }

    // Insert Payment
    await run(
      `INSERT INTO payments (
        id, business_id, payment_number, customer_id, customer_name, invoice_id,
        invoice_number, amount, method, date, reference_number, account_id, notes,
        status, recorded_by, recorded_by_name, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?, ?)`,
      [
        paymentId, businessId, paymentNumber, customerId || null, customerName,
        invoiceId || null, invoiceNumber, amountPaise, method, payDate, referenceNumber,
        targetAccountId, notes, user.id, user.full_name, now
      ]
    );

    // If linked to invoice, update invoice
    if (inv) {
      const newPaid = inv.amount_paid + amountPaise;
      const newBalance = Math.max(0, inv.balance_due - amountPaise);
      const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

      await run(
        `UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, updated_at = ? WHERE id = ?`,
        [newPaid, newBalance, newStatus, now, inv.id]
      );
    }

    // If customer specified, update customer
    if (customerId) {
      await run(
        `UPDATE customers SET total_paid = total_paid + ?, outstanding_balance = outstanding_balance - ? WHERE id = ?`,
        [amountPaise, amountPaise, customerId]
      );
    }

    // Record Transaction
    await recordFinancialTransaction({
      businessId,
      type: 'INCOME',
      category: 'Payment Received',
      description: `Payment ${paymentNumber} from ${customerName}${invoiceNumber ? ` for ${invoiceNumber}` : ''}`,
      amount: amountPaise,
      paymentMethod: method,
      accountId: targetAccountId,
      referenceType: 'PAYMENT',
      referenceId: paymentId,
      actorId: user.id,
      actorName: user.full_name,
      date: payDate
    });

    // Audit Log
    await logAudit({
      businessId,
      actorId: user.id,
      actorName: user.full_name,
      action: 'PAYMENT',
      entityType: 'PAYMENT',
      entityId: paymentId,
      entityReference: paymentNumber,
      reason: `Recorded ${method} payment of ₹${(amountPaise / 100).toLocaleString('en-IN')} from ${customerName}`,
      newValue: { paymentNumber, customerName, amount: amountPaise / 100, method }
    });

    // Notify Partner
    await createNotification({
      businessId,
      actorName: user.full_name,
      title: 'Payment Received',
      message: `${user.full_name} recorded ₹${(amountPaise / 100).toLocaleString('en-IN')} from ${customerName} via ${method}`,
      type: 'FINANCIAL',
      entityType: 'PAYMENT',
      entityId: paymentId
    });

    res.status(201).json({
      id: paymentId,
      payment_number: paymentNumber,
      amount: Math.round(amountPaise / 100),
      status: 'COMPLETED'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
