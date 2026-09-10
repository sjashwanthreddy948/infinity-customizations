import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { broadcastToBusiness } from '../services/websocketService.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/invoices - List all invoices with filters
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { search, status, startDate, endDate, limit = '100', offset = '0' } = req.query;

    let sql = `
      SELECT i.*, o.order_number, o.product_name, o.is_tshirt, o.tshirt_size, o.tshirt_color
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      WHERE i.business_id = ?
    `;
    const params: any[] = [businessId];

    if (search) {
      sql += ` AND (i.invoice_number LIKE ? OR i.customer_name LIKE ? OR i.customer_phone LIKE ? OR i.notes LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    if (startDate) {
      sql += ` AND i.issue_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND i.issue_date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY i.issue_date DESC, i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

    const invoices = await query(sql, params);
    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/invoices/:id - Get full invoice data with line items & business details
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const invoiceId = req.params.id as string;

    const invoice = await get<any>(
      `SELECT i.*, o.order_number, o.product_name, o.quantity as order_quantity,
              o.tshirt_size, o.tshirt_color, o.tshirt_print_type, o.is_tshirt
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       WHERE i.id = ? AND i.business_id = ?`,
      [invoiceId, businessId]
    );

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const items = await query(`SELECT * FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
    const business = await get<any>(`SELECT * FROM businesses WHERE id = ?`, [businessId]);
    const payments = await query(`SELECT * FROM payments WHERE invoice_id = ? ORDER BY date DESC`, [invoiceId]);

    res.json({
      ...invoice,
      items,
      payments,
      business: {
        name: business?.name || 'Infinity Customizations',
        email: business?.email || 'hello@infinitycustomizations.com',
        phone: business?.phone || '+91 98765 43210',
        address: business?.address || 'Plot 42, Designer Hub, Jubilee Hills, Hyderabad, Telangana 500033',
        gstin: business?.gstin || '36AAACI1234F1Z5',
        currency: business?.currency || 'INR',
        currencySymbol: business?.currency_symbol || '₹'
      }
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

/**
 * POST /api/invoices - Create custom invoice directly
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      items = [],
      discount = 0,
      tax_amount = 0,
      payment_method = 'UPI',
      amount_paid = 0,
      notes = '',
      terms = 'Thank you for choosing Infinity Customizations!'
    } = req.body;

    if (!customer_name || !customer_phone || items.length === 0) {
      res.status(400).json({ error: 'Customer name, phone, and at least one item are required' });
      return;
    }

    let subtotal = 0;
    for (const item of items) {
      subtotal += Math.round(Number(item.quantity || 1) * Number(item.rate || 0));
    }

    const disc = Math.max(0, Math.round(Number(discount) || 0));
    const tax = Math.max(0, Math.round(Number(tax_amount) || 0));
    const grand_total = Math.max(0, subtotal - disc + tax);
    const paid = Math.max(0, Math.round(Number(amount_paid) || 0));
    const balance_due = Math.max(0, grand_total - paid);

    let status = 'PENDING';
    if (paid >= grand_total && grand_total > 0) {
      status = 'PAID';
    } else if (paid > 0) {
      status = 'PARTIALLY_PAID';
    }

    const invCountRes = await get<any>(`SELECT COUNT(*) as count FROM invoices WHERE business_id = ?`, [businessId]);
    const invoiceNumber = `INV-2026-${((invCountRes?.count || 0) + 1).toString().padStart(4, '0')}`;
    const invoiceId = uuidv4();
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    let custId = customer_id;
    if (!custId) {
      const existingCust = await get<any>(`SELECT id FROM customers WHERE phone = ? AND business_id = ?`, [customer_phone.trim(), businessId]);
      if (existingCust) {
        custId = existingCust.id;
      } else {
        custId = uuidv4();
        await run(
          `INSERT INTO customers (id, business_id, customer_code, name, phone, email, address, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [custId, businessId, `CUST-${invoiceNumber.slice(-4)}`, customer_name.trim(), customer_phone.trim(), customer_email || null, customer_address || null]
        );
      }
    }

    await run(
      `INSERT INTO invoices (
        id, business_id, invoice_number, customer_id, customer_name, customer_phone, customer_email, customer_address,
        issue_date, due_date, subtotal, discount, tax_amount, grand_total, amount_paid,
        balance_due, status, payment_method, notes, terms, created_by, created_by_name, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        invoiceId, businessId, invoiceNumber, custId, customer_name.trim(), customer_phone.trim(), customer_email || null, customer_address || null,
        todayStr, todayStr, subtotal, disc, tax, grand_total, paid,
        balance_due, status, payment_method, notes, terms, partnerId, partnerName, nowIso, nowIso
      ]
    );

    for (const item of items) {
      const itemAmt = Math.round(Number(item.quantity || 1) * Number(item.rate || 0));
      await run(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), invoiceId, item.description || 'Customized Item', Number(item.quantity || 1), Number(item.rate || 0), itemAmt]
      );
    }

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      entityReference: invoiceNumber,
      newValue: { invoiceNumber, customerName: customer_name, grandTotal: grand_total, status },
      reason: 'Manual invoice created'
    });

    broadcastToBusiness(businessId, {
      type: 'INVOICE_CREATED',
      payload: { invoiceId, invoiceNumber, customerName: customer_name, grandTotal: grand_total, createdBy: partnerName }
    });

    const created = await get(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

/**
 * POST /api/invoices/:id/void - Void an invoice with reason
 */
router.post('/:id/void', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;
    const invoiceId = req.params.id as string;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 3) {
      res.status(400).json({ error: 'A valid cancellation reason is required' });
      return;
    }

    const inv = await get<any>(`SELECT * FROM invoices WHERE id = ? AND business_id = ?`, [invoiceId, businessId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const nowIso = new Date().toISOString();
    await run(`UPDATE invoices SET status = 'CANCELLED', void_reason = ?, updated_at = ? WHERE id = ?`, [reason.trim(), nowIso, invoiceId]);

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'VOID',
      entityType: 'INVOICE',
      entityId: invoiceId,
      entityReference: inv.invoice_number,
      reason: reason.trim()
    });

    res.json({ success: true, message: 'Invoice cancelled' });
  } catch (error) {
    console.error('Error voiding invoice:', error);
    res.status(500).json({ error: 'Failed to cancel invoice' });
  }
});

/**
 * PUT /api/invoices/:id - Update existing invoice
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const invoiceId = req.params.id as string;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const inv = await get<any>(`SELECT * FROM invoices WHERE id = ? AND business_id = ?`, [invoiceId, businessId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      issue_date,
      due_date,
      items = [],
      discount = 0,
      tax_amount = 0,
      payment_method = 'UPI',
      amount_paid = 0,
      notes = '',
      terms = ''
    } = req.body;

    const cName = customer_name ? String(customer_name).trim() : inv.customer_name;
    const cPhone = customer_phone ? String(customer_phone).trim() : inv.customer_phone;
    const cEmail = customer_email !== undefined ? customer_email : inv.customer_email;
    const cAddress = customer_address !== undefined ? customer_address : inv.customer_address;
    const iDate = issue_date || inv.issue_date;
    const dDate = due_date || inv.due_date;
    const iNotes = notes !== undefined ? notes : inv.notes;
    const iTerms = terms !== undefined ? terms : inv.terms;

    let subtotal = 0;
    if (items.length > 0) {
      for (const item of items) {
        subtotal += Math.round(Number(item.quantity || 1) * Number(item.rate || item.unit_price || 0));
      }
    } else {
      subtotal = inv.subtotal;
    }

    const disc = discount !== undefined ? Math.max(0, Math.round(Number(discount) || 0)) : inv.discount;
    const tax = tax_amount !== undefined ? Math.max(0, Math.round(Number(tax_amount) || 0)) : inv.tax_amount;
    const grand_total = Math.max(0, subtotal - disc + tax);
    const paid = amount_paid !== undefined ? Math.max(0, Math.round(Number(amount_paid) || 0)) : inv.amount_paid;
    const balance_due = Math.max(0, grand_total - paid);

    let status = inv.status;
    if (status !== 'CANCELLED') {
      if (paid >= grand_total && grand_total > 0) {
        status = 'PAID';
      } else if (paid > 0) {
        status = 'PARTIALLY_PAID';
      } else {
        status = 'PENDING';
      }
    }

    const nowIso = new Date().toISOString();

    await run(
      `UPDATE invoices SET
        customer_id = ?, customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?,
        issue_date = ?, due_date = ?, subtotal = ?, discount = ?, tax_amount = ?, grand_total = ?,
        amount_paid = ?, balance_due = ?, status = ?, notes = ?, terms = ?, updated_at = ?
       WHERE id = ? AND business_id = ?`,
      [
        customer_id || inv.customer_id, cName, cPhone, cEmail, cAddress,
        iDate, dDate, subtotal, disc, tax, grand_total,
        paid, balance_due, status, iNotes, iTerms, nowIso,
        invoiceId, businessId
      ]
    );

    if (items.length > 0) {
      await run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
      for (const item of items) {
        const itemAmt = Math.round(Number(item.quantity || 1) * Number(item.rate || item.unit_price || 0));
        await run(
          `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), invoiceId, item.description || 'Customized Item', Number(item.quantity || 1), Number(item.rate || item.unit_price || 0), itemAmt]
        );
      }
    }

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'UPDATE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      entityReference: inv.invoice_number,
      newValue: { invoiceNumber: inv.invoice_number, customerName: cName, grandTotal: grand_total, status },
      reason: 'Invoice details updated'
    });

    broadcastToBusiness(businessId, {
      type: 'INVOICE_UPDATED',
      payload: { invoiceId, invoiceNumber: inv.invoice_number, customerName: cName, grandTotal: grand_total, updatedBy: partnerName }
    });

    const updated = await get(`SELECT * FROM invoices WHERE id = ?`, [invoiceId]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

/**
 * DELETE /api/invoices/:id - Delete invoice (Accessible to both co-partners)
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const invoiceId = req.params.id as string;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const inv = await get<any>(`SELECT * FROM invoices WHERE id = ? AND business_id = ?`, [invoiceId, businessId]);
    if (!inv) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Unlink any orders referencing this invoice
    await run(`UPDATE orders SET invoice_id = NULL WHERE invoice_id = ? AND business_id = ?`, [invoiceId, businessId]);
    // Delete invoice items
    await run(`DELETE FROM invoice_items WHERE invoice_id = ?`, [invoiceId]);
    // Delete the invoice itself
    await run(`DELETE FROM invoices WHERE id = ? AND business_id = ?`, [invoiceId, businessId]);

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'DELETE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      entityReference: inv.invoice_number,
      reason: `Invoice deleted by ${partnerName}`
    });

    broadcastToBusiness(businessId, {
      type: 'INVOICE_DELETED',
      payload: { invoiceId, invoiceNumber: inv.invoice_number, deletedBy: partnerName }
    });

    res.json({ success: true, message: 'Invoice permanently deleted' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

export default router;
