import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, get, run } from '../db/index.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';
import { broadcastToBusiness } from '../services/websocketService.js';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/quotations - List quotations
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const { search, status } = req.query;

    let sql = `SELECT * FROM quotations WHERE business_id = ?`;
    const params: any[] = [businessId];

    if (status && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (quotation_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR notes LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    sql += ` ORDER BY created_at DESC`;

    const quotations = await query<any>(sql, params);

    // Attach items for each quotation
    for (const q of quotations) {
      q.items = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?`, [q.id]);
    }

    res.json(quotations);
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

/**
 * GET /api/quotations/:id - Single quotation with items
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const quoteId = req.params.id as string;

    const quote = await get<any>(
      `SELECT * FROM quotations WHERE (id = ? OR quotation_number = ?) AND business_id = ?`,
      [quoteId, quoteId, businessId]
    );

    if (!quote) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    const items = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?`, [quote.id]);
    res.json({ ...quote, items });
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    res.status(500).json({ error: 'Failed to fetch quotation details' });
  }
});

/**
 * POST /api/quotations - Create quotation
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
      valid_until,
      items = [],
      discount = 0,
      tax_rate = 0,
      tax_amount = 0,
      notes = '',
      terms = ''
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
    const taxR = Number(tax_rate) || 0;
    const computedTax = tax_amount !== undefined ? Number(tax_amount) : Math.round((subtotal - disc) * (taxR / 100));
    const grand_total = Math.max(0, subtotal - disc + computedTax);

    const countRes = await get<any>(`SELECT COUNT(*) as count FROM quotations WHERE business_id = ?`, [businessId]);
    const quoteNumber = `QT-2026-${((countRes?.count || 0) + 1).toString().padStart(4, '0')}`;
    const quoteId = uuidv4();
    const nowIso = new Date().toISOString();
    const defaultValidUntil = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

    await run(
      `INSERT INTO quotations (
        id, business_id, quotation_number, customer_id, customer_name, customer_phone, customer_email, customer_address,
        valid_until, subtotal, discount, tax_rate, tax_amount, grand_total, status, notes, terms,
        created_by, created_by_name, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )`,
      [
        quoteId, businessId, quoteNumber, customer_id || null, customer_name.trim(), customer_phone.trim(), customer_email || null, customer_address || null,
        valid_until || defaultValidUntil, subtotal, disc, taxR, computedTax, grand_total, 'SENT', notes, terms,
        partnerId, partnerName, nowIso, nowIso
      ]
    );

    for (const item of items) {
      const itQty = Number(item.quantity || 1);
      const itRate = Number(item.rate || 0);
      const itAmt = Math.round(itQty * itRate);
      await run(
        `INSERT INTO quotation_items (id, quotation_id, description, quantity, rate, discount, tax_rate, amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), quoteId, item.description || 'Customized Item', itQty, itRate, Number(item.discount || 0), Number(item.tax_rate || 0), itAmt]
      );
    }

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'CREATE',
      entityType: 'QUOTATION',
      entityId: quoteId,
      entityReference: quoteNumber,
      newValue: { quotationNumber: quoteNumber, customerName: customer_name, grandTotal: grand_total },
      reason: 'Quotation created'
    });

    broadcastToBusiness(businessId, {
      type: 'QUOTATION_CREATED',
      payload: { quoteId, quotationNumber: quoteNumber, customerName: customer_name, grandTotal: grand_total, createdBy: partnerName }
    });

    const created = await get(`SELECT * FROM quotations WHERE id = ?`, [quoteId]);
    const createdItems = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?`, [quoteId]);
    res.status(201).json({ ...created, items: createdItems });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

/**
 * PUT /api/quotations/:id - Update quotation
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const quoteId = req.params.id as string;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const quote = await get<any>(
      `SELECT * FROM quotations WHERE (id = ? OR quotation_number = ?) AND business_id = ?`,
      [quoteId, quoteId, businessId]
    );

    if (!quote) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    const {
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      valid_until,
      items = [],
      discount,
      tax_rate,
      tax_amount,
      notes,
      terms,
      status
    } = req.body;

    const cName = customer_name ? String(customer_name).trim() : quote.customer_name;
    const cPhone = customer_phone ? String(customer_phone).trim() : quote.customer_phone;
    const cEmail = customer_email !== undefined ? customer_email : quote.customer_email;
    const cAddress = customer_address !== undefined ? customer_address : quote.customer_address;
    const vUntil = valid_until || quote.valid_until;
    const qNotes = notes !== undefined ? notes : quote.notes;
    const qTerms = terms !== undefined ? terms : quote.terms;
    const qStatus = status || quote.status;

    let subtotal = 0;
    if (items.length > 0) {
      for (const item of items) {
        subtotal += Math.round(Number(item.quantity || 1) * Number(item.rate || 0));
      }
    } else {
      subtotal = quote.subtotal;
    }

    const disc = discount !== undefined ? Math.max(0, Math.round(Number(discount) || 0)) : quote.discount;
    const taxR = tax_rate !== undefined ? Number(tax_rate) : quote.tax_rate;
    const computedTax = tax_amount !== undefined ? Number(tax_amount) : Math.round((subtotal - disc) * (taxR / 100));
    const grand_total = Math.max(0, subtotal - disc + computedTax);
    const nowIso = new Date().toISOString();

    await run(
      `UPDATE quotations SET
        customer_id = ?, customer_name = ?, customer_phone = ?, customer_email = ?, customer_address = ?,
        valid_until = ?, subtotal = ?, discount = ?, tax_rate = ?, tax_amount = ?, grand_total = ?,
        status = ?, notes = ?, terms = ?, updated_at = ?
       WHERE id = ? AND business_id = ?`,
      [
        customer_id || quote.customer_id, cName, cPhone, cEmail, cAddress,
        vUntil, subtotal, disc, taxR, computedTax, grand_total,
        qStatus, qNotes, qTerms, nowIso,
        quote.id, businessId
      ]
    );

    if (items.length > 0) {
      await run(`DELETE FROM quotation_items WHERE quotation_id = ?`, [quote.id]);
      for (const item of items) {
        const itQty = Number(item.quantity || 1);
        const itRate = Number(item.rate || 0);
        const itAmt = Math.round(itQty * itRate);
        await run(
          `INSERT INTO quotation_items (id, quotation_id, description, quantity, rate, discount, tax_rate, amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), quote.id, item.description || 'Customized Item', itQty, itRate, Number(item.discount || 0), Number(item.tax_rate || 0), itAmt]
        );
      }
    }

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'UPDATE',
      entityType: 'QUOTATION',
      entityId: quote.id,
      entityReference: quote.quotation_number,
      newValue: { quotationNumber: quote.quotation_number, customerName: cName, grandTotal: grand_total },
      reason: 'Quotation updated'
    });

    broadcastToBusiness(businessId, {
      type: 'QUOTATION_UPDATED',
      payload: { quoteId: quote.id, quotationNumber: quote.quotation_number, customerName: cName, grandTotal: grand_total, updatedBy: partnerName }
    });

    const updated = await get(`SELECT * FROM quotations WHERE id = ?`, [quote.id]);
    const updatedItems = await query(`SELECT * FROM quotation_items WHERE quotation_id = ?`, [quote.id]);
    res.json({ ...updated, items: updatedItems });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

/**
 * DELETE /api/quotations/:id - Delete quotation (Accessible to both co-partners)
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const quoteId = req.params.id as string;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const quote = await get<any>(
      `SELECT * FROM quotations WHERE (id = ? OR quotation_number = ?) AND business_id = ?`,
      [quoteId, quoteId, businessId]
    );

    if (!quote) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    await run(`DELETE FROM quotation_items WHERE quotation_id = ?`, [quote.id]);
    await run(`DELETE FROM quotations WHERE id = ? AND business_id = ?`, [quote.id, businessId]);

    await logAudit({
      businessId,
      actorId: partnerId,
      actorName: partnerName,
      action: 'DELETE',
      entityType: 'QUOTATION',
      entityId: quote.id,
      entityReference: quote.quotation_number,
      reason: `Quotation deleted by ${partnerName}`
    });

    broadcastToBusiness(businessId, {
      type: 'QUOTATION_DELETED',
      payload: { quoteId: quote.id, quotationNumber: quote.quotation_number, deletedBy: partnerName }
    });

    res.json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
});

/**
 * POST /api/quotations/:id/convert - Convert quotation into Order + Invoice
 */
router.post('/:id/convert', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const businessId = req.businessId!;
    const quoteId = req.params.id as string;
    const partnerId = req.user!.userId;
    const partnerName = req.user!.fullName;

    const quote = await get<any>(
      `SELECT * FROM quotations WHERE (id = ? OR quotation_number = ?) AND business_id = ?`,
      [quoteId, quoteId, businessId]
    );

    if (!quote) {
      res.status(404).json({ error: 'Quotation not found' });
      return;
    }

    const items = await query<any>(`SELECT * FROM quotation_items WHERE quotation_id = ?`, [quote.id]);
    const totalUnits = items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
    const orderNumber = `ORD-2026-${Date.now().toString().slice(-4)}`;
    const invoiceNumber = `INV-2026-${Date.now().toString().slice(-4)}`;
    const newOrderId = uuidv4();
    const newInvoiceId = uuidv4();
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const estBlankCost = Math.round(quote.grand_total * 0.45);
    const estPrintCost = Math.round(quote.grand_total * 0.20);
    const estLogistics = 350;
    const totalCost = estBlankCost + estPrintCost + estLogistics;
    const profit = Math.max(0, quote.grand_total - totalCost);
    const profitMargin = quote.grand_total > 0 ? (profit / quote.grand_total) * 100 : 0;

    // Create Order
    await run(
      `INSERT INTO orders (
        id, business_id, order_number, customer_id, customer_name, customer_phone,
        product_name, quantity, selling_price, payment_received, payment_pending,
        product_cost, printing_cost, delivery_cost, total_cost, profit, profit_margin,
        available_amount, payment_status, order_status, order_date, is_tshirt, is_partner_shared,
        invoice_id, invoice_number, created_by, created_by_name, notes, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        newOrderId, businessId, orderNumber, quote.customer_id || uuidv4(), quote.customer_name, quote.customer_phone,
        items[0]?.description || 'Customized Merchandise', totalUnits, quote.grand_total, 0, quote.grand_total,
        estBlankCost, estPrintCost, estLogistics, totalCost, profit, profitMargin,
        -totalCost, 'PENDING', 'IN_PROGRESS', todayStr, 1, 1,
        newInvoiceId, invoiceNumber, partnerId, partnerName, `Converted from Quotation ${quote.quotation_number}`, nowIso, nowIso
      ]
    );

    // Create Invoice
    await run(
      `INSERT INTO invoices (
        id, business_id, invoice_number, order_id, customer_id, customer_name, customer_phone, customer_email, customer_address,
        issue_date, due_date, subtotal, discount, tax_amount, grand_total, amount_paid, balance_due,
        status, notes, terms, created_by, created_by_name, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?
      )`,
      [
        newInvoiceId, businessId, invoiceNumber, newOrderId, quote.customer_id || uuidv4(), quote.customer_name, quote.customer_phone, quote.customer_email || null, quote.customer_address || null,
        todayStr, todayStr, quote.subtotal, quote.discount, quote.tax_amount, quote.grand_total, 0, quote.grand_total,
        'PENDING', `Converted from Quotation ${quote.quotation_number}`, quote.terms, partnerId, partnerName, nowIso, nowIso
      ]
    );

    for (const it of items) {
      await run(
        `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [uuidv4(), newInvoiceId, it.description, it.quantity, it.rate, it.amount]
      );
    }

    // Mark Quotation as CONVERTED
    await run(
      `UPDATE quotations SET status = 'CONVERTED', converted_order_id = ?, converted_invoice_id = ?, updated_at = ? WHERE id = ?`,
      [newOrderId, newInvoiceId, nowIso, quote.id]
    );

    const updatedQuote = await get(`SELECT * FROM quotations WHERE id = ?`, [quote.id]);
    const createdOrder = await get(`SELECT * FROM orders WHERE id = ?`, [newOrderId]);
    const createdInvoice = await get(`SELECT * FROM invoices WHERE id = ?`, [newInvoiceId]);

    res.json({
      success: true,
      quotation: updatedQuote,
      order: createdOrder,
      invoice: createdInvoice
    });
  } catch (error) {
    console.error('Error converting quotation:', error);
    res.status(500).json({ error: 'Failed to convert quotation' });
  }
});

export default router;
